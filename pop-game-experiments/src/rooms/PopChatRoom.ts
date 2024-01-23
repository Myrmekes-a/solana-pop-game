import { Room } from "colyseus";
import jwt, { JwtPayload } from "jsonwebtoken";
import { logger } from "../logger";

import Users from "../database/users";
import {
    CHAT_HANDLE_SLICE_COUNT,
    JWT_SECRET,
    MAX_CHAT_HISTORY_LEN,
} from "../config";

interface ChatMessage {
    publicKey: string;
    chatHandle: string;
    message: string;
}

export class PopChatRoom extends Room {
    static chatHistoryMaxLength = MAX_CHAT_HISTORY_LEN; // Maybe less? Maybe more

    chatHistory: ChatMessage[] = [];

    onCreate(options) {
        this.autoDispose = false;
        this.onMessage("message", async (client, message) => {
            logger.info(
                "$$ message:",
                "ChatRoom received message from",
                client.sessionId,
                ":",
                message
            );
            const messageJwt = message.jwt;

            let decodedJwt;
            try {
                decodedJwt = jwt.verify(messageJwt, JWT_SECRET) as JwtPayload;
            } catch (e) {
                logger.error(
                    "$$ message:",
                    "jwt verify failed while create room",
                    e
                );
                return;
            }

            let chatHandle;
            try {
                const result = await Users.getUserProfileByWallet(
                    decodedJwt.publicKey
                );

                if (result.user) {
                    chatHandle =
                        result.user.userProfile.name ||
                        decodedJwt.publicKey.slice(0, CHAT_HANDLE_SLICE_COUNT); // Maybe should use db record
                } else {
                    chatHandle = decodedJwt.publicKey.slice(
                        0,
                        CHAT_HANDLE_SLICE_COUNT
                    );
                }
            } catch (e) {
                chatHandle = decodedJwt.publicKey.slice(
                    0,
                    CHAT_HANDLE_SLICE_COUNT
                );
            }

            // const renderedMessage = `[${chatHandle}] ${message.message}`;
            const chatMessage = {
                publicKey: decodedJwt.publicKey,
                chatHandle,
                message: message.message,
            };

            this.broadcast("chat-messages", {
                chatMessage,
            });

            this.addMessageToHistory(chatMessage);
        });

        // User is attempting to set their global handle
        this.onMessage("set-handle", async (client, setHandleMsg) => {
            const messageJwt = setHandleMsg.jwt;

            let decodedJwt;
            try {
                decodedJwt = jwt.verify(messageJwt, JWT_SECRET) as JwtPayload;
            } catch (e) {
                logger.error("$$ set-handle:", "jwt verify failed", e);
                client.send("error", { err: `jwt verify failed: ${e}` });
                return;
            }

            const userPubKey = decodedJwt.publicKey;

            // If it Checks out
            const newHandle = setHandleMsg.newHandle;
            try {
                const result = await Users.updateUserName(
                    userPubKey,
                    newHandle
                );

                this.updateUserHandleinHistory(userPubKey, newHandle);

                result.err
                    ? client.send("error", result)
                    : client.send("set-handle-success", result);
            } catch (e) {
                client.send("error", { err: e });
            }
        });

        // Client is asking for the chat History
        this.onMessage("history", async (client, historyReqParams) => {
            client.send("history-data", this.chatHistory);
        });
    }

    onJoin(client) {
        logger.info("$$ onJoin:", "User Joined ChatRoom", client.sessionId);
        this.broadcast("messages", `${client.sessionId} joined.`);
    }

    onLeave(client) {
        logger.info("$$ onLeave:", "User Left ChatRoom", client.sessionId);
        this.broadcast("messages", `${client.sessionId} left.`);
    }

    onDispose() {
        logger.info("$$ onDispose:", `Disposing of chat room`);
    }

    // Pushes a single message into the history
    addMessageToHistory(message: ChatMessage) {
        // Remove one of the entries if the length is big
        if (this.chatHistory.length >= PopChatRoom.chatHistoryMaxLength) {
            this.chatHistory.shift();
        }

        this.chatHistory.push(message);
    }

    // Updates the user's handle in the history
    updateUserHandleinHistory(userPubKey: string, newHandle: string) {
        this.chatHistory = this.chatHistory.map((chatMessage) => {
            const match = chatMessage.publicKey === userPubKey;
            if (!match) return chatMessage;

            return { ...chatMessage, chatHandle: newHandle };
        });

        // Send new history
        // TODO: Change the implementation of this not to send a slug of data down
        // stream.
        this.broadcast("handle-change", { userPubKey, newHandle });
    }
}
