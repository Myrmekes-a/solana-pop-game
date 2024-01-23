import * as Colyseus from "colyseus.js";
import logger from "loglevel";
import { wsUrl } from "../services/http.common.js";
import {
    setPlayers,
    updatePlayer,
    removePlayer,
    setBalloons,
    updateBalloon,
    removeBalloon,
    clearBalloons,
    setDarts,
    updateDart,
    removeDart,
    clearDarts,
    setBallista,
    setPopRoomClient,
    setGameState,
    setBalloonPrice,
    setBettingEndsAt,
    setWinningPlayer,
    setWinningName,
    setWinningWallet,
    setGameStarted,
} from "../store/slices/appSlice";
import { setSessionId, setCredits } from "../store/slices/accountSlice";
import store from "../store/store";
import creditService from "../services/credit.service";
import userService from "../services/user.service.js";
import { poppingAudio, firingAudio, winningAudio } from "../data/audios.js";
import { ROOM_FULL_FILLED_ERROR } from "../data/errors";
import Balloon from "./Balloon";
import Dart from "./Dart";

let popGameClient;
let joiningGame = false;
let popRoom;

export const roomMaxClients = 10;

export const translateBalloonState = {
    1: "unpopped",
    2: "popping",
    3: "popped",
};

const refreshWinnerBalance = (winnerPubkey, dispatch) => {
    if (winnerPubkey !== store.getState().account.wallet?.publicKey?.toBase58()) {
        return;
    }

    creditService.getCreditBalance().then(resp => {
        dispatch(setCredits(resp.data.balance));
    });
};

// Place to put colyseus client build up stuff?
// A lot of this stuff needs to be collapsed into common objects just
// to make things easier to reason about
const getPopGameClient = (dispatch, popRoomKey, board, canvasCtx, images) => {
    if (!popRoomKey) return;

    const gameClient = getGameClient();

    // Check what room we're already connected to
    if (joiningGame || popRoom?.name === popRoomKey) {
        console.log("Already joining a game or connected to", joiningGame, popRoom?.name, popRoomKey);

        return;
    }

    joiningGame = true;
    const accessToken = localStorage.getItem("pop-access-token"); // I'm not sure if this will be available yet

    // Attempt to join the game here
    gameClient
        .joinOrCreate(popRoomKey, { accessToken })
        .then(room_instance => {
            const room = room_instance;

            logger.debug(`Joining New Room ${popRoomKey}`);

            popRoom = room;
            dispatch(setPopRoomClient(popRoom));
            dispatch(setSessionId(room.sessionId));
            dispatch(setPlayers(room.state.players.values())); // reset players when join another room
            dispatch(setGameState(room.state.currentGameState));
            dispatch(clearBalloons());
            dispatch(clearDarts());
            dispatch(setWinningWallet({}));
            dispatch(setWinningPlayer(""));

            room.onStateChange.once(state => {
                dispatch(setBettingEndsAt({ value: state.bettingEndsAt }));
                dispatch(setGameState(state.currentGameState));
            });

            // Set up darts
            room.state.darts.onAdd = dart => {
                // Do stuff for when a "Player" joins
                logger.debug("Dart Added", dart);

                const firingAudioClone = firingAudio.cloneNode(true);
                firingAudioClone.volume = store.getState().app.soundVolume / 100;
                firingAudioClone.muted = store.getState().app.popRoomKey !== popRoom?.name;
                firingAudioClone.addEventListener(
                    "ended",
                    ev => {
                        ev.target.remove();
                    },
                    false,
                );
                const firingAudioPromise = firingAudioClone.play();
                if (firingAudioPromise) {
                    firingAudioPromise.catch(e => {}).then(() => {});
                }

                const newDart = {
                    x: dart.x,
                    y: dart.y,
                    velocity: {
                        x: dart.velocity.x,
                        y: dart.velocity.y,
                    },
                    angle: dart.angle,
                    label: dart.label,
                };

                // Add the dart to the arena
                dispatch(setDarts({ ...store.getState().app.darts, [dart.label]: new Dart(canvasCtx, images.dart, images.dartMask, newDart, board.getBoundingClientRect()) }));

                // We're setting the
                const labelTokenLength = dart.label.split("_").length;
                const cornerFiring = dart.label.split("_")[labelTokenLength - 1];
                const changingBallista = Object.assign({}, store.getState().app.ballistas);
                changingBallista[cornerFiring]++;

                // Increment the dart toggle to trigger the ballista animation
                dispatch(setBallista({ key: cornerFiring, value: changingBallista[cornerFiring] }));

                dart.onChange = function (changes) {
                    // Hook in stuff for when a "Player Changes"
                    let currentValue = Object.assign({}, store.getState().app.darts[dart.label]);
                    currentValue.x = dart.x;
                    currentValue.y = dart.y;
                    currentValue.angle = dart.angle;
                    let currentVelocity = Object.assign({}, currentValue.velocity);
                    currentVelocity.x = dart.velocity.x;
                    currentVelocity.y = dart.velocity.y;
                    currentValue.velocity = currentVelocity;

                    dispatch(updateDart({ key: dart.label, value: currentValue }));
                };

                dart.onRemove = () => {
                    dispatch(removeDart(dart.label));
                };
            };

            // Set up player Stuff
            room.state.players.onAdd = function (player, sessionId) {
                // Do stuff for when a "Player" joins
                console.log("currentPlayers", store.getState().app.players);
                console.log("Player Added", player.sessionId, player.wallet);

                const currentPlayers = store.getState().app.players;
                if (Object.keys(currentPlayers).length > 0 && currentPlayers.constructor === Object) {
                    Object.keys(currentPlayers).map(key => {
                        if (currentPlayers[key].wallet === player.wallet) {
                            dispatch(removePlayer(key));
                        }
                        return null;
                    });
                }

                const newPlayer = {
                    startingBalloons: player.startingBalloons,
                    credits: player.credits,
                    remainingBalloons: player.remainingBalloons,
                    balloonColor: player.balloonColor,
                    chatHandle: player.chatHandle,
                    wallet: player.wallet,
                };
                dispatch(setPlayers({ ...currentPlayers, [sessionId]: newPlayer }));

                player.onChange = function (changes) {
                    console.log("Player Changes", changes);
                    // Hook in stuff for when a "Player Changes"
                    const currentPlayer = Object.assign({}, store.getState().app.players[sessionId]);
                    if (!currentPlayer) return { ...currentPlayers };

                    changes.forEach(change => {
                        currentPlayer[change.field] = change.value;
                    });
                    dispatch(updatePlayer({ key: sessionId, value: currentPlayer }));
                };
            };

            // Set up Balloon Stuff
            room.state.balloons.onAdd = (balloon, sessionId) => {
                let currentBalloonSate = "unpopped";

                // Register the on changes
                balloon.onChange = changes => {
                    changes.forEach(change => {
                        if (change.field === "balloonState" && change.previousValue) {
                            const newBalloonSate = translateBalloonState[change.value];
                            const previousBallonState = translateBalloonState[change.previousValue];
                            currentBalloonSate = newBalloonSate;

                            // Catch the popping edge
                            if (newBalloonSate === "popping" && previousBallonState === "unpopped") {
                                // Play a random popping sound from the popping sounds arrays
                                const poppingAudioClone = poppingAudio.cloneNode(true);
                                poppingAudioClone.volume = store.getState().app.soundVolume / 100;
                                poppingAudioClone.muted = store.getState().app.popRoomKey !== popRoom?.name;
                                poppingAudioClone.addEventListener(
                                    "ended",
                                    ev => {
                                        ev.target.remove();
                                    },
                                    false,
                                );
                                const poppingAudioPromise = poppingAudioClone.play();
                                if (poppingAudioPromise) {
                                    poppingAudioPromise.catch(e => {}).then(() => {});
                                }
                            }
                        }
                    });

                    if (!store.getState().app.balloons[balloon.label]) {
                        dispatch(
                            setBalloons({
                                ...store.getState().app.balloons,
                                [balloon.label]: new Balloon(canvasCtx, images[balloon.owner.balloonColor], images.balloonMask, balloon.x, balloon.y),
                            }),
                        );
                    } else {
                        dispatch(updateBalloon({ key: balloon.label, value: { state: currentBalloonSate, x: balloon.x, y: balloon.y } }));
                    }
                };

                balloon.onRemove = () => {
                    dispatch(removeBalloon(balloon.label));
                };
            };

            // General Room Infomation
            room.state.onChange = changes => {
                changes.forEach(change => {
                    if (change.field === "currentGameState") {
                        dispatch(setGameState(change.value));

                        if (change.value === "game-over" && change.previousValue === "running") {
                            console.log("Game over edge");
                        }
                    }

                    if (change.field === "winningPlayer") {
                        setTimeout(() => {
                            dispatch(setWinningPlayer(change.value));

                            if (!change.value) return;

                            userService.getProfileByWallet(change.value).then(res => {
                                const profile = res.data.userProfile.user.userProfile;
                                if (!profile) return;

                                dispatch(setWinningName(profile.name));

                                winningAudio.volume = store.getState().app.soundVolume / 100;
                                winningAudio.muted = store.getState().app.popRoomKey !== popRoom?.name;
                                const winningAudioPromise = winningAudio.play();
                                if (winningAudioPromise) {
                                    winningAudioPromise.catch(e => {}).then(() => {});
                                }
                            });
                        }, 2000);
                    }

                    if (change.field === "bettingEndsAt") {
                        console.log("Betting change value", change.value);
                        dispatch(setBettingEndsAt({ value: change.value }));
                    }

                    if (change.field === "balloonPrice") {
                        console.log("Setting balloon Price");
                        dispatch(setBalloonPrice(change.value));
                    }
                });
            };

            // When somebody leaves the room
            room.state.players.onRemove = function (player, sessionId) {
                // Do stuff for when a "Player" leaves
                console.log("Player Removed", player.sessionId, player.wallet);

                dispatch(removePlayer(sessionId));
            };

            room.onMessage("error", error => {
                console.log("Error", error);
            });

            room.onMessage("buy-balloon-success", msg => {
                // Set the user Balance
                dispatch(setCredits(msg.balance));
            });

            room.onMessage("game-winner", msg => {
                const winnerWallet = msg.winnerWallet;
                const newCreditBalance = msg.newBalance;

                console.log("Received winning message");
                refreshWinnerBalance(winnerWallet, dispatch);
                dispatch(setWinningWallet({ winnerWallet, newCreditBalance }));
                dispatch(setGameStarted(false));
            });

            room.onMessage("update-balance", msg => {
                const wallet = msg.wallet;

                console.log("Received balance updated message", wallet);
                refreshWinnerBalance(wallet, dispatch);
            });

            room.onLeave((client, consented) => {
                console.log("Leaving Room");
                popRoom = undefined;
            });
        })
        .catch(reason => {
            if (reason === ROOM_FULL_FILLED_ERROR) {
                console.error(`Could not join to the room because already full-filled max clients count`);
            }
            console.error(reason);
            dispatch(setGameStarted(false));
        })
        .finally(() => {
            logger.debug(`Set joining room to false`);
            joiningGame = false;
        });

    return gameClient;
};

const getGameClient = () => {
    if (!popGameClient) {
        popGameClient = new Colyseus.Client(`${wsUrl}`);
    }

    return popGameClient;
};

const gameClientObject = {
    getPopGameClient,
    getGameClient,
    popRoom,
};

export default gameClientObject;
