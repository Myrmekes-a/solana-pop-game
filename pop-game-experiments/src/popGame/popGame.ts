import { MapSchema } from "@colyseus/schema";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { random } from "lodash";
import { logger } from "../logger";
import _ from "lodash";
import Matter, { Bodies } from "matter-js";

import Credits from "../database/credits";
import Debits from "../database/debits";
import Games from "../database/games";
import Users from "../database/users";
import DartManager from "./dartManager";
import {
    BalloonState,
    PopGameState,
    PopGameStates,
    WorldDimensions,
    Dart,
} from "./popGameState";
import {
    PopBalloon,
    PopInactivePlayer,
    PopPlayer,
    StartingBalloonColors,
} from "./popPlayer";
import { PopGameRoom } from "../rooms/PopGameRoom";
import {
    AFFILIATE_RAKE,
    BALLOON_COLLISION_RADIUS,
    BALLOON_POSITION_DELTA,
    BALLOON_SPEED,
    GAME_WORLD_WIDTH,
    HOUSE_CUT,
    MAX_INACTIVE_ROUNDS_FOR_PLAYER,
    MAX_PLAYER_BALLOON_COUNT,
    START_INCREASING_TIME,
    WINNER_SCREEN_PAUSE_TIME,
    maxPlayerClients,
} from "../config";

// TODO: Refactor this mess
// The pop game
// Includes a reference to the matterjs physics engine and the colyseus room state
export class PopGame {
    // TODO: Organize these class variables. Some of these should probably just go on the "State" object
    // Matter.js engine
    engine = null;
    // Matter.js world
    world = null;
    // Colyseus room state. Need to update whenever there are updates in the world.
    state: PopGameState = null;
    worldDimensions: WorldDimensions;
    wallWidth: number;
    topWall;
    rightWall;
    bottomWall;
    leftWall;
    topRightBallista;
    topLeftBallista;
    bottomRightBallista;
    bottomLeftBallista;
    balloons: { [key: string]: Matter.Body } = {};
    dartManager: DartManager;
    darts: { [key: string]: Matter.Body } = {};
    pauseGame = false;

    // TODO: Switch to basing things off of the rooms delta time
    // We should probably base things off of the rooms deltaTime. Not
    // RL time
    gameStartTime = new Date().getTime();

    balloonsCreated = false;
    hasBeenCleared = false;
    gameOverAt;
    availableBalloonColors = [...StartingBalloonColors];
    gameRecordId: number; // The id column in the database so we can tie debits back to this game
    creatingGameRecord = false;
    playersReady = false;
    playerAlreadyPaid = false;

    // Kind of a weird circular reference. Maybe we should just be passing references to functions
    // kind of like how we do with react components :shrug:
    popRoom: PopGameRoom;
    balloonPrice: number;

    constructor(
        state,
        worldWidth: number,
        worldHeight: number,
        wallWidth: number,
        balloonPrice: number,
        popRoom: PopGameRoom
    ) {
        this.state = state;

        this.worldDimensions = new WorldDimensions(worldWidth, worldHeight);
        this.state.worldDimensions = this.worldDimensions;

        this.engine = Matter.Engine.create({ gravity: { scale: 0 } });
        this.world = this.engine.world;
        this.wallWidth = wallWidth;
        this.init(this.worldDimensions.width, this.worldDimensions.height);

        this.dartManager = new DartManager(
            this,
            this.worldDimensions.height,
            this.worldDimensions.width,
            this.wallWidth
        );

        // Don't need both of these
        this.balloonPrice = balloonPrice;
        this.state.balloonPrice = balloonPrice;

        this.popRoom = popRoom;
    }

    init(worldWidth: number, worldHeight: number) {
        // Add some boundary in our world
        this.topWall = Bodies.rectangle(
            this.wallWidth + worldWidth / 2,
            this.wallWidth / 2,
            worldWidth,
            this.wallWidth,
            {
                isStatic: true,
                label: "wall-top",
                collisionFilter: {
                    category: 0b10,
                    group: 0,
                },
                restitution: 0.9,
            }
        );

        this.rightWall = Bodies.rectangle(
            this.wallWidth + worldWidth + this.wallWidth / 2,
            this.wallWidth + worldHeight / 2,
            this.wallWidth,
            worldHeight,
            {
                isStatic: true,
                label: "wall-left",
                collisionFilter: {
                    category: 0b10,
                    group: 0,
                },
                restitution: 0.9,
            }
        );

        this.bottomWall = Bodies.rectangle(
            this.wallWidth + worldWidth / 2,
            this.wallWidth + worldHeight + this.wallWidth / 2,
            worldWidth,
            this.wallWidth,
            {
                isStatic: true,
                label: "wall-bottom",
                collisionFilter: {
                    category: 0b10,
                    group: 0,
                },
                restitution: 0.9,
            }
        );

        this.leftWall = Bodies.rectangle(
            this.wallWidth / 2,
            this.wallWidth + worldHeight / 2,
            this.wallWidth,
            worldHeight,
            {
                isStatic: true,
                label: "wall-left",
                collisionFilter: {
                    category: 0b10,
                    group: 0,
                },
                restitution: 0.9,
            }
        );

        this.topRightBallista = Bodies.circle(
            this.wallWidth + worldWidth + this.wallWidth / 2,
            this.wallWidth / 2,
            34,
            {
                isStatic: true,
                label: "top-right-ballista",
                collisionFilter: {
                    category: 0b10,
                    group: 0,
                },
                restitution: 0.9,
            }
        );

        this.topLeftBallista = Bodies.circle(
            this.wallWidth / 2,
            this.wallWidth / 2,
            34,
            {
                isStatic: true,
                label: "top-left-ballista",
                collisionFilter: {
                    category: 0b10,
                    group: 0,
                },
                restitution: 0.9,
            }
        );

        this.bottomLeftBallista = Bodies.circle(
            this.wallWidth / 2,
            this.wallWidth / 2 + worldHeight + this.wallWidth / 2,
            34,
            {
                isStatic: true,
                label: "bottom-left-ballista",
                collisionFilter: {
                    category: 0b10,
                    group: 0,
                },
                restitution: 0.9,
            }
        );

        this.bottomRightBallista = Bodies.circle(
            this.wallWidth + worldWidth + this.wallWidth / 2,
            this.wallWidth + worldHeight + this.wallWidth / 2,
            34,
            {
                isStatic: true,
                label: "bottom-right-ballista",
                collisionFilter: {
                    category: 0b10,
                    group: 0,
                },
                restitution: 0.9,
            }
        );

        Matter.Composite.add(this.world, [
            this.topWall,
            this.rightWall,
            this.bottomWall,
            this.leftWall,
            this.topRightBallista,
            this.topLeftBallista,
            this.bottomLeftBallista,
            this.bottomRightBallista,
        ]);

        this.initUpdateEvents();
        this.initCollisionEvents();
    }

    // Kind of the main Loop?
    // TODO: Refactor this into a statemachine at some point. Simple enough right now.... not anymore
    // Grosss
    onRoomUpdate(deltaTime) {
        const now = new Date().getTime();
        const timeSinceStart = now - this.gameStartTime;

        // If we're in the betting phase, count up all the players with at least one balloon bought
        let playersWithStartingBalloons = 0;
        if (this.state.currentGameState == PopGameStates.betting) {
            Array.from(this.state.players.keys()).map((sessionId) => {
                const player = this.state.players.get(sessionId);
                if (player.startingBalloons > 0)
                    playersWithStartingBalloons =
                        playersWithStartingBalloons + 1;
            });
        }

        // If there has been two people placing bets
        // Try to make this a one shot
        if (playersWithStartingBalloons > 1 && !this.playersReady) {
            // If we haven't set when the betting ends set it
            if (!this.state.winningPlayer) {
                this.state.bettingEndsAt = now + START_INCREASING_TIME;
                this.playersReady = true;
            }
        }

        // Whack time based state machine
        // This should go somewhere else
        if (!this.playersReady) {
            this.state.currentGameState = PopGameStates.betting;

            // Create the record for this new game
            if (!this.creatingGameRecord && !this.gameRecordId) {
                this.creatingGameRecord = true;

                Games.createEmptyGame()
                    .then((gameRecord) => {
                        this.gameRecordId = gameRecord.id;
                        this.creatingGameRecord = false;
                    })
                    .catch((e) => {
                        logger.warn("Error while create empty game:", e);
                    });
            }

            this.hasBeenCleared = false; // For when the game is over
        } else if (
            // Waiting for players
            !this.state.winningPlayer && // TODO: Add some logic here to we have to wait a bit before it moves on
            this.playersReady &&
            now > this.state.bettingEndsAt
        ) {
            this.state.currentGameState = PopGameStates.running;

            // Created the player's baloons if we haven't yet
            // And mark the players that didn't bet
            if (!this.balloonsCreated) {
                // If the balloons havent been created yet
                this.balloonsCreated = true;
                let self = this;
                // Get inactive round players
                Array.from(this.state.players.keys()).map((sessionId) => {
                    const player = this.state.players.get(sessionId);
                    self.updateUserPaidStatus(
                        player.wallet,
                        player.startingBalloons,
                        Math.floor(this.balloonPrice * LAMPORTS_PER_SOL)
                    );
                    if (player.startingBalloons > 0) {
                        _.range(player.startingBalloons).map((idx) => {
                            this.addBalloon(sessionId);
                        });
                    } else {
                        logger.debug(`Player did not bet marking as inactive`);
                        player.inactiveRounds = player.inactiveRounds + 1;
                    }
                });
            }

            this.dartManager.run(); // Fire darts if its time to. Probably should have this down a level

            Matter.Engine.update(this.engine, deltaTime); // This triggers the afterUpdate in the PopGame Class
        } else if (this.state.winningPlayer) {
            if (!this.gameOverAt) this.gameOverAt = new Date().getTime();

            const timeSinceGameOver = new Date().getTime() - this.gameOverAt;
            if (timeSinceGameOver < WINNER_SCREEN_PAUSE_TIME) {
                // Pause here for the game to show who won
                // NOOP
                this.payPlayer(this.gameRecordId, this.state.winningPlayer);
            } else if (!this.hasBeenCleared) {
                this.state.currentGameState = PopGameStates.gameOver;

                // Reset the clock
                this.balloonsCreated = false;

                // Clear the board
                // Balloons
                Object.entries(this.balloons).map((keyValue) => {
                    Matter.Composite.remove(this.world, keyValue[1]);
                });
                this.balloons = {};
                this.state.balloons = new MapSchema<PopBalloon>();

                // Darts
                Object.values(this.darts).map((dart) =>
                    Matter.Composite.remove(this.world, dart)
                );

                // Reset Objects
                this.darts = {};
                this.state.darts = new MapSchema<Dart>();

                const keys = Array.from(this.state.players.keys());

                // Reset Player Balloon Count
                for (let i = keys.length - 1; i >= 0; --i) {
                    const player = this.state.players.get(keys[i]);
                    if (!player) continue;

                    logger.debug(
                        "Players inactive rounds ",
                        player.sessionId,
                        player.inactiveRounds
                    );
                    if (
                        player.inactiveRounds >= MAX_INACTIVE_ROUNDS_FOR_PLAYER
                    ) {
                        logger.debug(`Removing player ${player.sessionId}`);
                        this.removePlayer(player.sessionId);
                        this.tryJoinSpectatorAsPlayer();
                    } else {
                        logger.debug("Here", player);

                        for (let j = i - 1; j >= 0; --j) {
                            const member = this.state.players.get(keys[j]);
                            if (!member) continue;
                            if (member.wallet === player.wallet) {
                                this.availableBalloonColors.push(
                                    member.balloonColor
                                );
                                this.state.players.delete(keys[j]);
                            }
                        }

                        // Probably did not need a new player object.
                        // Probably could have just reassigned everything
                        this.state.players[keys[i]] = new PopPlayer(
                            player.sessionId,
                            player.balloonColor,
                            0,
                            0,
                            player.chatHandle,
                            player.inactiveRounds,
                            player.wallet
                        );
                    }
                }

                this.gameStartTime = new Date().getTime();
                this.state.bettingEndsAt = null;
                this.hasBeenCleared = true;
                this.gameOverAt = null;

                // Do the player Payout
                this.state.winningPlayer = null;
                this.gameRecordId = null;
                this.playersReady = false;
                this.playerAlreadyPaid = false;
                this.dartManager.reset(); // Reset the dart manager
            }
        }
    }

    async payPlayer(gameRecordId: number, winningPlayer: string) {
        if (this.playerAlreadyPaid) return;

        logger.info(
            `Paying winning player ${winningPlayer} for game ${gameRecordId}`
        );

        // Mark that this game has tried to pay the player
        this.playerAlreadyPaid = true;
        try {
            const aggregate = await Debits.getSumAmountByGameId(
                this.gameRecordId
            );
            // TODO: Research the dangers of casting these number
            const houseCut = Math.floor(
                Number(aggregate._sum.amount) * HOUSE_CUT
            );

            const winnerCut = Number(aggregate._sum.amount) - houseCut;

            const creditResult = await Credits.credit(
                winningPlayer,
                winnerCut,
                "winnings",
                gameRecordId
            );

            this.popRoom.broadCastGameWinner(
                winningPlayer,
                Number(creditResult.balance)
            );

            const updatedWinnerStatus = await Users.updateWinnerStatus(
                winningPlayer,
                winnerCut
            );

            logger.debug(
                `Crediting user: ${winningPlayer}, totalSolWon: ${updatedWinnerStatus?.totalSolWon}, gamesWon: ${updatedWinnerStatus?.gamesWon}`
            );

            const affiliateResult = await Users.getAffiliateUserByWallet(
                winningPlayer
            );
            if (affiliateResult.err) return;

            // Send rake amount of house cnt to affliliate user
            const affiliatePlayer = affiliateResult.affiliatedUser.wallet;
            const affiliateCut = Math.floor(houseCut * AFFILIATE_RAKE);
            await Credits.credit(
                affiliatePlayer,
                affiliateCut,
                "winnings",
                gameRecordId
            );
            this.popRoom.updateAffiliateWinner(affiliatePlayer);

            const updatedAffiliateStatus =
                await Users.updateAffiliateWinnerStatus(
                    affiliatePlayer,
                    affiliateCut
                );
            logger.debug(
                `Crediting affiliate player of winner: ${affiliateCut}, updated RakePaid: ${updatedAffiliateStatus?.rakePaid}`
            );
        } catch (e) {
            logger.error(" -> Error:", e);
        }
    }

    getVelocityMagnitude(velocity: { x: number; y: number }) {
        return Math.pow(velocity.x, 2) + Math.pow(velocity.y, 2);
    }

    // Iterate over the updated bodies from the world and update
    // their positions in the schema
    updateBalloonPositions() {
        for (const key in this.balloons) {
            const bodyBalloon = this.balloons[key];
            const stateBalloon = this.state.balloons[bodyBalloon.label];

            // if (stateBalloon.balloonState == BalloonState.popped) return; // Skip this if its popped

            // Check if the balloon is out of bounds for some reason?
            const xLimit =
                this.wallWidth + this.worldDimensions.height + this.wallWidth;
            const yLimit =
                this.wallWidth + this.worldDimensions.height + this.wallWidth;
            if (bodyBalloon.position.x >= xLimit) {
                bodyBalloon.position.x = xLimit - this.wallWidth * 2;
            } else if (bodyBalloon.position.x < 0) {
                bodyBalloon.position.x = xLimit + this.wallWidth * 2;
            }

            if (bodyBalloon.position.y >= yLimit) {
                bodyBalloon.position.y = yLimit - this.wallWidth * 2;
            } else if (bodyBalloon.position.y < 0) {
                bodyBalloon.position.y = yLimit + this.wallWidth * 2;
            }

            let velocityAngle;
            if (bodyBalloon.velocity.x > 0) {
                velocityAngle = Math.atan(
                    bodyBalloon.velocity.y / bodyBalloon.velocity.x
                );

                const newY = Math.sin(velocityAngle) * BALLOON_SPEED;
                const newX = Math.cos(velocityAngle) * BALLOON_SPEED;

                Matter.Body.setVelocity(bodyBalloon, { x: newX, y: newY });
            } else if (bodyBalloon.velocity.x < 0) {
                velocityAngle = Math.atan(
                    bodyBalloon.velocity.y / bodyBalloon.velocity.x
                );

                const newY = Math.sin(velocityAngle + Math.PI) * BALLOON_SPEED;
                const newX = Math.cos(velocityAngle + Math.PI) * BALLOON_SPEED;

                Matter.Body.setVelocity(bodyBalloon, { x: newX, y: newY });
            }

            stateBalloon.x = bodyBalloon.position.x;
            stateBalloon.y = bodyBalloon.position.y;
        }
    }

    // Does the same thing as updateBalloonPositionsInSchema
    updateDartPositions() {
        // this.darts.map((dart, index) => {
        Object.keys(this.darts).map((label) => {
            const stateDart = this.state.darts[label];
            const matterDart = this.darts[label];

            // Check if the dart is out of bounds to remove
            const xLimit =
                this.wallWidth + this.worldDimensions.height + this.wallWidth;
            const yLimit =
                this.wallWidth + this.worldDimensions.height + this.wallWidth;
            if (matterDart.position.x >= xLimit) {
                this.dartManager.removeDart(label);
            } else if (matterDart.position.x < 0) {
                this.dartManager.removeDart(label);
            }

            if (matterDart.position.y >= yLimit) {
                this.dartManager.removeDart(label);
            } else if (matterDart.position.y < 0) {
                this.dartManager.removeDart(label);
            }

            let velocityAngle;
            if (matterDart.velocity.x > 0) {
                velocityAngle = Math.atan(
                    matterDart.velocity.y / matterDart.velocity.x
                );

                const newY = Math.sin(velocityAngle) * BALLOON_SPEED;
                const newX = Math.cos(velocityAngle) * BALLOON_SPEED;

                Matter.Body.setVelocity(matterDart, { x: newX, y: newY });
            } else if (matterDart.velocity.x < 0) {
                velocityAngle = Math.atan(
                    matterDart.velocity.y / matterDart.velocity.x
                );

                const newY = Math.sin(velocityAngle + Math.PI) * BALLOON_SPEED;
                const newX = Math.cos(velocityAngle + Math.PI) * BALLOON_SPEED;

                Matter.Body.setVelocity(matterDart, { x: newX, y: newY });
            }
            stateDart.x = matterDart.position.x;
            stateDart.y = matterDart.position.y;

            stateDart.velocity.x = matterDart.velocity.x;
            stateDart.velocity.y = matterDart.velocity.y;
        });
    }

    initUpdateEvents() {
        // Update events to sync bodies in the world to the state.
        Matter.Events.on(this.engine, "afterUpdate", () => {
            this.updateBalloonPositions();
            this.updateDartPositions();
        });
    }

    initCollisionEvents() {
        // The collision events
        Matter.Events.on(this.engine, "collisionStart", (event) => {
            const pairs = event.pairs;

            pairs.forEach((pair) => {
                const dartCollision =
                    pair.bodyA.label.startsWith("dart") ||
                    pair.bodyB.label.startsWith("dart");

                if (dartCollision) {
                    if (pair.bodyA.label.startsWith("balloon")) {
                        Matter.Composite.remove(this.world, pair.bodyA);

                        const balloon = this.state.balloons.get(
                            pair.bodyA.label
                        );
                        if (
                            balloon &&
                            balloon.balloonState === BalloonState.unpopped
                        ) {
                            balloon.balloonState = BalloonState.popping;
                            setTimeout(() => {
                                balloon.balloonState = BalloonState.popped;
                            }, 1000);
                            balloon.owner.remainingBalloons =
                                balloon.owner.remainingBalloons - 1;
                        }
                    } else {
                        // this.removePlayer(pair.bodyA.label);
                        Matter.Composite.remove(this.world, pair.bodyB);

                        const balloon = this.state.balloons.get(
                            pair.bodyB.label
                        );
                        if (
                            balloon &&
                            balloon.balloonState === BalloonState.unpopped
                        ) {
                            balloon.balloonState = BalloonState.popping;
                            setTimeout(() => {
                                balloon.balloonState = BalloonState.popped;
                            }, 1000);
                            balloon.owner.remainingBalloons =
                                balloon.owner.remainingBalloons - 1;
                        }
                    }

                    // Check for winner
                    // Prbably should keep a counter. Would be faster than looping
                    const winnerLookup = {};
                    Array.from(this.state.balloons.keys()).map((key) => {
                        const balloon: PopBalloon = this.state.balloons[key];
                        const owner: PopPlayer = balloon.owner;

                        winnerLookup[owner.sessionId] = owner.remainingBalloons;
                    });

                    const playersStillInTheGame = Object.entries(
                        winnerLookup
                    ).filter((keyValue) => {
                        const playerBalloonCount = keyValue[1] as number;

                        return playerBalloonCount > 0;
                    });

                    if (playersStillInTheGame.length == 1) {
                        // this.pauseGame = true;
                        const winner = playersStillInTheGame[0];
                        const player = this.state.players.get(winner[0]);

                        this.state.winningPlayer = player?.wallet ?? "Unknown";
                    }
                }
            });
        });
    }

    // I guess we're kind of saving seats
    async addPlayer(sessionId: string, walletPubkey: string) {
        try {
            let oldPlayerInfo: PopPlayer | undefined = undefined;
            // Remove previous player when betting
            this.state.players.forEach((player, key) => {
                if (player.wallet === walletPubkey) {
                    this.availableBalloonColors.push(player.balloonColor);
                    oldPlayerInfo = this.state.players.get(key);
                    this.state.players.delete(key);
                }
            });

            // join as spectator if room locked
            if (this.state.players.size >= maxPlayerClients) {
                this.addSpectator(sessionId, walletPubkey);
                logger.warn(
                    `$$ onJoin: [${this.popRoom.roomName}]`,
                    `Sit down a player as spectator because max player clients reached`
                );
                return;
            }

            // Check if player already has balloons in the game
            // Update the session id of the game player to match
            // New just create a new player
            const userRecord = await Users.getUserProfileByWallet(walletPubkey);
            const userHandle =
                userRecord?.user.userProfile?.name || walletPubkey;

            const colorAssignment =
                this.availableBalloonColors.shift() || "purple";

            // TODO: Refactor how the popplayer record gets created
            this.state.players.set(
                sessionId,
                new PopPlayer(
                    sessionId,
                    colorAssignment,
                    oldPlayerInfo?.startingBalloons ?? 0,
                    oldPlayerInfo?.remainingBalloons ?? 0,
                    userHandle,
                    0,
                    walletPubkey
                ) // lots of arguments like is is a code smell.
            );
            logger.info(
                `$$ onJoin: [${this.popRoom.roomName}]`,
                `New player added. Current players count ${this.popRoom.popGame.state.players.size}`
            );
            // if (this.state.players.size >= maxPlayerClients) {
            //     logger.info(
            //         `$$ addPlayer: [${this.popRoom.roomName}]`,
            //         "Room locked"
            //     );
            //     this.state.locked = true;
            // }
        } catch (e) {
            logger.error("Error while adding player:", e);
        }
    }

    removePlayer(sessionId) {
        const removingPlayer = this.state.players.get(sessionId);
        if (!removingPlayer)
            return { err: "Could not find player from client Id" };

        // If no current game remove player

        // Check if the player has any balloons in the game
        // Do anything
        // if no balloons remove the player

        this.availableBalloonColors.push(removingPlayer.balloonColor);

        this.state.players.delete(sessionId);

        // if (this.state.players.size < maxPlayerClients) {
        //     this.state.locked = false;
        //     logger.info(
        //         `$$ removePlayer: [${this.popRoom.roomName}]`,
        //         "Room unlocked"
        //     );
        // }
    }

    // I guess we're kind of saving seats
    addSpectator(sessionId: string, walletPubkey: string) {
        let oldPlayerInfo: PopInactivePlayer | undefined = undefined;
        // Replace spectator sessionId if already exist
        const replaced = this.state.inactivePlayers.some((player, index) => {
            if (player.wallet === walletPubkey) {
                oldPlayerInfo = this.state.inactivePlayers.at(index);
                this.state.inactivePlayers.setAt(
                    index,
                    new PopInactivePlayer(sessionId, walletPubkey)
                );
                logger.info(
                    `Exist spectator updated: ${walletPubkey}::${sessionId}::${this.state.inactivePlayers.length}`
                );
                return true;
            }
        });

        if (!replaced) {
            this.state.inactivePlayers.push(
                new PopInactivePlayer(sessionId, walletPubkey)
            );
            logger.info(
                `New spectator added: ${walletPubkey}::${sessionId}::${this.state.inactivePlayers.length}`
            );
        }
    }

    removeSpectator(sessionId) {
        const removingPlayerIdx = this.state.inactivePlayers.findIndex(
            (player) => player.sessionId === sessionId
        );
        if (removingPlayerIdx === -1)
            return { err: "Could not find inactive player from client Id" };

        this.state.inactivePlayers.splice(removingPlayerIdx, 1);
        logger.info(
            `A spectator removed: ${sessionId}::${this.state.inactivePlayers.length}`
        );
    }

    async tryJoinSpectatorAsPlayer() {
        for (let i = 0; i < this.state.inactivePlayers.length; ) {
            if (this.state.players.size >= maxPlayerClients) return;

            const firstSpectator = this.state.inactivePlayers.at(i);

            try {
                const userRecord = await Users.getUserProfileByWallet(
                    firstSpectator.wallet
                );
                const userHandle =
                    userRecord?.user.userProfile?.name || firstSpectator.wallet;

                let oldPlayerInfo: PopPlayer | undefined = undefined;
                // Remove previous player when betting
                this.state.players.forEach((player, key) => {
                    if (player.wallet === firstSpectator.wallet) {
                        this.availableBalloonColors.push(player.balloonColor);
                        oldPlayerInfo = this.state.players.get(key);
                        this.state.players.delete(key);
                    }
                });

                // Check if player already has balloons in the game
                // Update the session id of the game player to match
                // New just create a new player

                const colorAssignment =
                    this.availableBalloonColors.shift() || "purple";

                // TODO: Refactor how the popplayer record gets created
                this.state.players.set(
                    firstSpectator.sessionId,
                    new PopPlayer(
                        firstSpectator.sessionId,
                        colorAssignment,
                        oldPlayerInfo?.startingBalloons ?? 0,
                        oldPlayerInfo?.remainingBalloons ?? 0,
                        userHandle,
                        0,
                        firstSpectator.wallet
                    ) // lots of arguments like is is a code smell.
                );

                this.state.inactivePlayers.deleteAt(i);
                logger.info(
                    `addSpectatorAsPlayer: remaining inactive players ${this.state.inactivePlayers.length}`
                );
            } catch (e) {
                logger.error("Error while adding spectator as player:", e);
                i++;
            }
        }
    }

    async refundPurchasedBalloons(sessionId) {
        const refundingPlayer = this.state.players.get(sessionId);
        // return if no player with the sessionId
        if (!refundingPlayer) return;

        // refund only waiting alone case
        if (
            this.playersReady ||
            this.state.currentGameState !== PopGameStates.betting
        )
            return;

        // return because no balloons purchased
        if (refundingPlayer.startingBalloons === 0) return;

        const refundBalance =
            this.balloonPrice *
            refundingPlayer.startingBalloons *
            LAMPORTS_PER_SOL;

        try {
            const refundResult = await Debits.cancelPlayerAllGameDebitsByGameId(
                refundingPlayer.wallet,
                refundBalance,
                this.gameRecordId
            );

            // return refunded wallet if canceled any debits
            if (refundResult.count > 0) return refundingPlayer.wallet;
        } catch (e) {
            logger.error("Error while refund balloon purchaing", e);
        }
    }

    // Adds a balloon Body and updates the state schema
    addBalloon(playerSessionId) {
        const player = this.state.players.get(playerSessionId);
        if (!player) return { err: "Could not get player from session Id" };

        const currentBalloonLength = Array.from(
            this.state.balloons.keys()
        ).length;

        // This should be its own function or something
        const balloonLabel =
            "balloon" + playerSessionId + `_${currentBalloonLength + 1}`;

        const startX =
            parseInt(
                (
                    Math.random() *
                    (GAME_WORLD_WIDTH - BALLOON_POSITION_DELTA)
                ).toFixed()
            ) + BALLOON_POSITION_DELTA;
        const startY =
            parseInt(
                (
                    Math.random() *
                    (GAME_WORLD_WIDTH - BALLOON_POSITION_DELTA)
                ).toFixed()
            ) + BALLOON_POSITION_DELTA;

        const startingDirectionX = random(-0.005, 0.005, true);
        const startyingDirectionY = random(-0.005, 0.005, true);

        const newBalloon = Matter.Bodies.circle(
            startX,
            startY,
            BALLOON_COLLISION_RADIUS,
            {
                isStatic: false,
                restitution: 0.95,
                force: { x: startingDirectionX, y: startyingDirectionY },
                // velocity: { x: -1, y: -1 },
                friction: 0,
                frictionAir: 0,
                frictionStatic: 0,
                label: balloonLabel,
                collisionFilter: {
                    category: 0b1,
                    group: 0,
                },
            }
        );

        // Add to world
        Matter.Composite.add(this.world, newBalloon);

        // Update the bookkeeping bits
        this.balloons[balloonLabel] = newBalloon;

        this.state.balloons.set(
            balloonLabel,
            new PopBalloon(
                balloonLabel,
                player,
                newBalloon.position.x,
                newBalloon.position.y
            )
        );
    }

    // Attempts to buy balloons for the user
    async buyBalloons(userWallet, sessionId, numberOfBalloons, gameId) {
        const player = this.state.players[sessionId];
        if (!player) return { err: "Could not get player from session Id" };

        try {
            if (
                player.startingBalloons + numberOfBalloons >
                MAX_PLAYER_BALLOON_COUNT
            ) {
                return {
                    err: "Too Many balloons for Player",
                };
            }

            const playerBalance = await Credits.getBalance(userWallet);
            const balloonCost =
                this.balloonPrice * numberOfBalloons * LAMPORTS_PER_SOL;
            if (balloonCost > playerBalance.balance) {
                return {
                    err: "Not Enough Credits",
                };
            }

            const debitResult = await Debits.debit(
                userWallet,
                balloonCost,
                gameId
            );

            player.startingBalloons += numberOfBalloons;
            player.remainingBalloons += numberOfBalloons;

            return {
                err: null,
                msg: `Bought ${numberOfBalloons}`,
                balance: debitResult.balance,
            };
        } catch (e) {
            return {
                err: e,
            };
        }
    }

    // Attempts to buy balloons for the user
    async updateUserPaidStatus(
        userWallet,
        purchasedBalloonsCount,
        balloonPrice
    ) {
        try {
            const updatedPlayerStatus = await Users.updatePurchasedStatus(
                userWallet,
                purchasedBalloonsCount,
                balloonPrice
            );
            if (updatedPlayerStatus.err) throw updatedPlayerStatus.err;

            logger.debug(
                `Player balloon purchased status updated. ${userWallet}, balloonsBought:${updatedPlayerStatus.balloonsBought}, experience: ${updatedPlayerStatus.experience}, totalSolWagered: ${updatedPlayerStatus.totalSolWagered}`
            );
        } catch (e) {
            logger.error(
                `Error to update user balloon purchased status: ${JSON.stringify(
                    e
                )}`
            );
            return {
                err: e,
            };
        }
    }
}
