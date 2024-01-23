import logger from "loglevel";
import gameClientObject from "./getPopGameClient";

// Handles connection to the chat room and anything else
class PopChat {
    static defaultGlobal = "pop-global";

    CHAT_HISTORY_MAX_LENGTH = 20;

    chatHistory;
    publicKey;
    colyseusClient;
    chatRoom;
    lastMessageReceivedAt;
    setChatData; // Use state function

    constructor(publicKey) {
        if (publicKey) {
            this.publicKey = publicKey;
        }
    }

    async setUpEvents(setChatHistory) {
        const gameClient = gameClientObject.getGameClient();

        const chatRoom = await gameClient.joinOrCreate(this.chatRoom || PopChat.defaultGlobal);

        logger.debug(`Join chat room ${chatRoom.name}`);

        // Receiveing for the history backend
        chatRoom.onMessage("history-data", historyData => {
            this.chatHistory = historyData;
        });

        // Receive Broadcast on the frontend when someone sends a new message
        chatRoom.onMessage("chat-messages", messagePayload => {
            logger.debug(`Received new chat messages`, messagePayload);

            // this.chatInAudio.play();

            this.addMessageToChatHistory(messagePayload.chatMessage, setChatHistory);
        });

        // Receive
        chatRoom.onMessage("handle-change", handleChange => {
            logger.debug(`Receiceved new `);
            this.chatHistory.map(chatMessage => {
                if (chatMessage.publicKey === handleChange.userPubKey) {
                    chatMessage.chatHandle = handleChange.newHandle;

                    return chatMessage;
                } else {
                    return chatMessage;
                }
            });
        });

        return chatRoom;
    }

    // Adds message to chat history
    addMessageToChatHistory(message, setChatHistory) {
        if (!this.chatHistory) this.chatHistory = [];

        this.chatHistory.push(message);

        if (this.chatHistory.length > this.CHAT_HISTORY_MAX_LENGTH) this.chatHistory.shift();

        this.lastMessageReceivedAt = new Date().getTime();

        setChatHistory(chatHistory => {
            return [...chatHistory, message];
        });
    }
}

export default PopChat;
