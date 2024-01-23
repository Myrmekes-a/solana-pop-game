import { Room, Client } from "colyseus";
import jwt, { JwtPayload } from "jsonwebtoken";
import _ from "lodash";
import { logger } from "../logger";

import { PopGame } from "../popGame/popGame";
import { PopGameState, PopGameStates } from "../popGame/popGameState";
import { PopPlayer } from "../popGame/popPlayer";
import {
    GAME_PATCH_RATE,
    GAME_WALL_WIDTH,
    GAME_WORLD_HEIGHT,
    GAME_WORLD_WIDTH,
    INCREASING_TIME,
    JWT_SECRET,
    MAX_INACTIVE_ROUNDS_FOR_PLAYER,
} from "../config";

export class PopGameRoom extends Room<PopGameState> {
    // maxClients = 2; // Change this

    popGame: PopGame;

    onCreate(options) {
        this.autoDispose = false; // Rooms don't automatically get destroyed when no one is in them
        this.setState(new PopGameState());
        this.popGame = new PopGame(
            this.state,
            GAME_WORLD_WIDTH,
            GAME_WORLD_HEIGHT,
            GAME_WALL_WIDTH,
            options.balloonPrice,
            this
        );

        // Register user interactions here
        this.onMessage(
            "buy-balloons",
            async (
                client,
                message: { balloonCount: number; authToken: string }
            ) => {
                logger.debug(
                    "$$ buy-balloons:",
                    `Received Message to buy balloons`
                );
                // Check if the game is betting right now
                if (
                    this.popGame.state.currentGameState !==
                    PopGameStates.betting
                ) {
                    return {
                        err: "Game is currently not betting",
                    };
                }

                let decodedAuthToken;
                try {
                    // Check if the JWT is valid
                    decodedAuthToken = jwt.verify(
                        message.authToken,
                        JWT_SECRET
                    );
                } catch (e) {}

                if (!decodedAuthToken) {
                    // Notify client
                    logger.warn(
                        "$$ buy-balloons:",
                        `Buy balloon request with no verified jwt`
                    );
                    client.send("error", { err: "Could not buy Balloons!" });
                } else {
                    const player: PopPlayer | undefined =
                        this.popGame.state.players.get(client.sessionId);

                    if (!player) {
                        logger.error(
                            "$$ buy-balloons:",
                            `could not get player from session id`
                        );
                        client.send("error", {
                            err: "could not get player from session id",
                        });
                        return;
                    }

                    // TODO: Make sure things match up here
                    player.wallet = decodedAuthToken.publicKey;
                    logger.info(
                        "$$ buy-balloons:",
                        `${player.wallet} is buying ${message.balloonCount} balloons`
                    );

                    // Try to buy balloons
                    const buyBalloonsResult = await this.popGame.buyBalloons(
                        decodedAuthToken.publicKey,
                        client.sessionId,
                        message.balloonCount,
                        this.popGame.gameRecordId
                    );

                    if (buyBalloonsResult.err) {
                        client.send("error", buyBalloonsResult);
                    } else {
                        // Get betting players
                        let playersWithStartingBalloons = 0;
                        Array.from(this.state.players.keys()).map(
                            (sessionId) => {
                                const player =
                                    this.state.players.get(sessionId);
                                if (player.startingBalloons > 0)
                                    playersWithStartingBalloons =
                                        playersWithStartingBalloons + 1;
                            }
                        );

                        // Set bet ends time only there are more than two betting players
                        if (playersWithStartingBalloons > 1) {
                            this.popGame.state.bettingEndsAt =
                                this.popGame.state.bettingEndsAt +
                                INCREASING_TIME; // Add more seconds everytime somebody bets
                        }

                        client.send("buy-balloon-success", {
                            ...buyBalloonsResult,
                            balance: Number(buyBalloonsResult.balance),
                        });
                    }
                }
            }
        );

        this.setPatchRate(GAME_PATCH_RATE);
        this.setSimulationInterval((deltaTime) => this.update(deltaTime));
    }

    update(deltaTime) {
        this.popGame.onRoomUpdate(deltaTime);
    }

    onAuth(client, options, req) {
        try {
            const decodedJwt = jwt.verify(
                options.accessToken,
                JWT_SECRET
            ) as JwtPayload;

            options.decodedJwt = decodedJwt;
        } catch (e) {
            logger.warn(
                "$$ onAuth:",
                `Could not decode jwt for incoming join. User is not logged propbably.`
            );

            return false;
        }

        return true;
    }

    // When an individual joins the room
    async onJoin(client: Client, options: any) {
        logger.info(
            `$$ onJoin: [${this.roomName}]`,
            `Client`,
            client.sessionId,
            `is joining the ${this.popGame.balloonPrice} game`
        );

        try {
            const pubKey = options.decodedJwt.publicKey;

            if (options.role && options.role === "spectator") return;

            await this.popGame.addPlayer(client.sessionId, pubKey);
        } catch (e) {
            logger.error(`$$ onJoin: [${this.roomName}]`, e);
        }
    }

    // We don't want to remove the player entirely
    // Results in the player's balloons being removed
    async onLeave(client: Client) {
        // Try remove spectator
        this.popGame.removeSpectator(client.sessionId);

        const player = this.popGame.state.players.get(client.sessionId);
        if (
            (this.popGame.state.currentGameState !== PopGameStates.betting ||
                this.popGame.state.bettingEndsAt) &&
            player?.startingBalloons
        ) {
            // Mark leaving player while playing as max inactive rounds
            // To make leave after game ended

            player.inactiveRounds = MAX_INACTIVE_ROUNDS_FOR_PLAYER;
            return;
        }

        logger.info(
            "$$ onLeave:",
            `Client`,
            client.sessionId,
            `is leaving the ${this.popGame.balloonPrice} game`
        );

        try {
            // check if should refund before remove player
            const wallet = await this.popGame.refundPurchasedBalloons(
                client.sessionId
            );
            // emit balance updated event if refunded
            if (wallet) client.send("update-balance", { wallet });

            // Remove client from this game server
            // so that ignore all event from this room
            await this.popGame.removePlayer(client.sessionId);

            logger.info(
                `$$ onLeave: [${this.roomName}]`,
                `A player removed. Current players count ${this.popGame.state.players.size}`
            );

            await this.popGame.tryJoinSpectatorAsPlayer();

            client.leave();
        } catch (e) {
            logger.error(`$$ onLeave: [${this.roomName}]`, e);
        }
    }

    onDispose() {
        logger.info(
            "$$ onDispose:",
            "Dispose StateHandlerRoom",
            this.popGame.balloonPrice
        );
    }

    // Broadcast a message to downstream clients
    // Allows winner to update their balance without everybody getting the
    // full slug of history
    broadCastGameWinner(winnerWallet: string, newBalance: number) {
        this.broadcast("game-winner", { winnerWallet, newBalance });
    }

    // Broadcast a message to downstream clients
    // Allows affiliate user of the winner to update their rake cut balance
    updateAffiliateWinner(wallet: string) {
        this.broadcast("update-balance", { wallet });
    }
}
