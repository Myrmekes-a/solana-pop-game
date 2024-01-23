import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Modal } from "react-bootstrap";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import "../App.css";
import "../assets/styles/interface.css";

const MAX_BALLOON_COUNT = 10;

function Interface() {
    const players = useSelector(state => state.app.players);
    const popRoomClient = useSelector(state => state.app.popRoomClient);
    const gameState = useSelector(state => state.app.gameState);
    const balloonPrice = useSelector(state => state.app.balloonPrice);
    const sessionId = useSelector(state => state.account.sessionId);
    const credits = useSelector(state => state.account.credits);
    const player = players[sessionId];
    const [balloonCount, setBalloonCount] = useState(5);
    const [playerBalloonColor, setPlayerBalloonColor] = useState();
    const [promptShow, setPromptShow] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const maxBalloonCount = useMemo(() => {
        if (!player) return MAX_BALLOON_COUNT;
        return MAX_BALLOON_COUNT - player.startingBalloons;
    }, [player?.startingBalloons]);

    const onRemove = () => {
        if (!(balloonCount > 0)) return;

        setBalloonCount(currentBalloonCount => {
            return --currentBalloonCount;
        });
    };

    const onAdd = () => {
        if (!player) return;
        if (balloonCount >= MAX_BALLOON_COUNT - player.startingBalloons) return;

        setBalloonCount(currentBalloonCount => {
            return ++currentBalloonCount;
        });
    };

    const onConfirm = () => {
        if (!player || !balloonCount) return;
        if (balloonCount > MAX_BALLOON_COUNT - player.startingBalloons) {
            setErrorMsg(`You already purchased ${player.startingBalloons}. Max is ${MAX_BALLOON_COUNT}`);
            setPromptShow(true);
            return;
        }
        if (balloonPrice * balloonCount > credits / LAMPORTS_PER_SOL) {
            setErrorMsg(`You don't have enough credits.`);
            setPromptShow(true);
            return;
        }
        const authToken = localStorage.getItem("pop-access-token");
        popRoomClient.send("buy-balloons", { balloonCount, authToken });
    };

    useEffect(() => {
        if (player?.balloonColor) {
            setPlayerBalloonColor(player.balloonColor);
        }
    }, [player, player?.remainingBalloons, gameState]);

    useEffect(() => {
        if (balloonCount > maxBalloonCount) setBalloonCount(maxBalloonCount);
    }, [maxBalloonCount, balloonCount]);

    return (
        <div className="interface">
            <div className="interface-container">
                <div className="balloon-container">
                    <div className="inner-balloon-container">
                        <div className="balloon-amount">Balloon Amount</div>

                        <div className="add-balloons">
                            <div className="add-balloons-top">
                                <div
                                    className="add-balloons-five"
                                    onClick={() => {
                                        for (let i = 0; i < 5; i++) {
                                            if (balloonCount + 5 >= maxBalloonCount) {
                                                for (let i = 0; i < maxBalloonCount - balloonCount; i++) {
                                                    onAdd();
                                                }
                                                return;
                                            }
                                            onAdd();
                                        }
                                    }}
                                >
                                    <p>+5</p>
                                </div>

                                {/* <div
                                    className="add-balloons-ten"
                                    onClick={() => {
                                        for (let i = 0; i < 10; i++) {
                                            if (balloonCount + 10 >= maxBalloonCount) {
                                                for (let i = 0; i < maxBalloonCount - balloonCount; i++) {
                                                    onAdd();
                                                }
                                                return;
                                            }
                                            onAdd();
                                        }
                                    }}
                                >
                                    <p>+10</p>
                                </div> */}
                            </div>

                            <div
                                className="add-balloons-bottom"
                                onClick={() => {
                                    for (let i = 0; i < maxBalloonCount - balloonCount; i++) {
                                        onAdd();
                                    }
                                }}
                            >
                                <p>+MAX</p>
                            </div>
                        </div>

                        <div className="balloon-counter">
                            <div className="plus-minus">
                                <div className="plus" onClick={onAdd}>
                                    <p>+</p>
                                </div>
                                <div className="minus" onClick={onRemove}>
                                    <p>-</p>
                                </div>
                            </div>

                            <div className="balloon-counter-number">
                                <div className={`${playerBalloonColor ? playerBalloonColor : "purple"}-balloon`}></div>
                                <p>x{balloonCount}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rectangle"></div>

                    <button
                        className="confirm"
                        onClick={() => {
                            onConfirm();
                        }}
                    >
                        Confirm
                    </button>
                </div>
            </div>

            <Modal show={promptShow} backdrop="static" aria-labelledby="contained-modal-title-vcenter" centered>
                <div className="prompt-container d-flex flex-column align-items-center">
                    <span className="fw-bold text-white h5">{errorMsg}</span>
                    <button
                        type="button"
                        className="btn w-50 confirm-btn text-white text-center"
                        onClick={() => {
                            setPromptShow(false);
                        }}
                    >
                        OK
                    </button>
                </div>
            </Modal>
        </div>
    );
}

export default Interface;
