import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import Ballista from "../Ballista";
import balloonAssets from "../../data/balloons";
import gameClient from "../../utils/getPopGameClient";
import { clearBalloons, clearDarts } from "../../store/slices/appSlice";
import Interface from "../Interface";
import "./arena.css";
import winnerImg from "../../assets/img/winner.webp";
import dartImage from "../../assets/img/dart.png";
import dartMask from "../../assets/img/dart_mask.png";

const colors = ["red", "yellow", "blue", "pink", "purple", "green", "orange", "robot", "gradient", "solana"];

const getEmptyImages = colors => {
    let object = {};
    for (let i = 0; i < colors.length; i++) {
        object[colors[i]] = [];
    }
    return object;
};

export default function Arena() {
    const gameStartsAtInterval = useRef();
    const canvasRef = useRef();
    const dispatch = useDispatch();

    const loggedIn = useSelector(state => state.account.loggedIn);
    const sessionId = useSelector(state => state.account.sessionId);
    const players = useSelector(state => state.app.players);
    const ballistas = useSelector(state => state.app.ballistas);
    const popRoomKey = useSelector(state => state.app.popRoomKey);
    const gameState = useSelector(state => state.app.gameState);
    const balloonPrice = useSelector(state => state.app.balloonPrice);
    const bettingEndsAt = useSelector(state => state.app.bettingEndsAt);
    const winningPlayer = useSelector(state => state.app.winningPlayer);
    const winningName = useSelector(state => state.app.winningName);
    const player = players[sessionId];

    const [board, setBoard] = useState();
    const [windowSize, setWindowSize] = useState();
    const [roundStartsIn, setRoundStartsIn] = useState();
    const [canvasCtx, setCanvasCtx] = useState(null);
    const [images, setImages] = useState(getEmptyImages(colors));

    useEffect(() => {
        const ctx = canvasRef.current.getContext("2d");
        setCanvasCtx(ctx);

        colors.forEach(color => {
            let imageUrls = [
                balloonAssets[`${color}Balloon`].poppingFrames.frame1,
                balloonAssets[`${color}Balloon`].poppingFrames.frame2,
                balloonAssets[`${color}Balloon`].poppingFrames.frame3,
                balloonAssets[`${color}Balloon`].poppingFrames.frame4,
                balloonAssets[`${color}Balloon`].poppingFrames.frame5,
                balloonAssets[`${color}Balloon`].poppingFrames.frame6,
                balloonAssets[`${color}Balloon`].poppingFrames.frame7,
                balloonAssets[`${color}Balloon`].poppingFrames.frame8,
                balloonAssets[`${color}Balloon`].poppingFrames.frame9,
                balloonAssets[`${color}Balloon`].poppingFrames.frame10,
            ];

            imageUrls.forEach(imageUrl => {
                let img = new Image();
                img.src = imageUrl;
                images[color].push(img);
            });
        });

        let dartImg = new Image();
        dartImg.src = dartImage;
        setImages(currentImages => {
            return { ...currentImages, dart: dartImg };
        });

        let balloonMaskImg = new Image();
        balloonMaskImg.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = 102;
            canvas.height = 102;
            const tmpCtx = canvas.getContext("2d");
            tmpCtx.drawImage(balloonMaskImg, 0, 0);
            setImages(currentImages => {
                return { ...currentImages, balloonMask: canvas };
            });
        };
        balloonMaskImg.src = balloonAssets.balloonMask;

        let dartMaskImg = new Image();
        dartMaskImg.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = 15;
            canvas.height = 52;
            const tmpCtx = canvas.getContext("2d");
            tmpCtx.drawImage(dartMaskImg, 0, 0, 15, 52);
            setImages(currentImages => {
                return { ...currentImages, dartMask: canvas };
            });
        };
        dartMaskImg.src = dartMask;
    }, []);

    useEffect(() => {
        // Connect to the game room and the chat
        // Only if you're logged in (and by logged in all you have to do is select a wallet)
        if (loggedIn && board && canvasCtx && "balloonMask" in images && "dartMask" in images) {
            setTimeout(() => {
                canvasRef.current.width = canvasRef.current.width;
                canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }, 100);
            gameClient.getPopGameClient(dispatch, popRoomKey, board, canvasCtx, images);
        }
    }, [popRoomKey, loggedIn, board, canvasCtx, images]);

    const handleResize = () => {
        setWindowSize(`${window.innerWidth}x${window.innerHeight}`);
    };

    useEffect(() => {
        if (!board) {
            let temp = document.getElementById("board");
            setBoard(temp);
        }

        window.onload = handleResize;
        window.onresize = handleResize;

        // Set a timer for the game starts clock
        if (bettingEndsAt) {
            gameStartsAtInterval.current = setInterval(() => {
                const timeUntilGameStarts = getSecondsUntilGameStarts(bettingEndsAt);
                setRoundStartsIn(timeUntilGameStarts);

                // Stop using this as trigger
                if (timeUntilGameStarts < 0) clearInterval(gameStartsAtInterval);
            }, 150);
        }

        return () => {
            if (gameStartsAtInterval.current) {
                clearInterval(gameStartsAtInterval.current);
            }
        };
    }, [windowSize, bettingEndsAt]);

    // Fix undefined?
    const getSecondsUntilGameStarts = bettingEndsAt => {
        if (!bettingEndsAt?.value) return -1;

        const now = new Date().getTime();
        const timeUntilGameStarts = (bettingEndsAt?.value - now) / 1000;

        return timeUntilGameStarts;
    };

    const getTotalJackpot = () => {
        let sum = 0;

        Object.values(players).forEach(player => {
            sum = sum + player.startingBalloons * balloonPrice;
        });

        return sum;
    };

    const getOddsToWin = () => {
        let totalBallons = 0;

        Object.values(players).forEach(player => {
            totalBallons = totalBallons + player.startingBalloons;
        });

        if (totalBallons === 0) return 1;
        if (player.startingBalloons === 0) return 0;

        return player.startingBalloons / totalBallons;
    };

    // Applies some logic around displaying the chat handle based on the length
    const getHandleDisplay = chatHandle => {
        let formattedHandle;

        if (chatHandle?.length > 12) {
            formattedHandle = `${chatHandle.slice(0, 6)}...${chatHandle.slice(chatHandle.length - 6, chatHandle.length)}`;
        } else {
            formattedHandle = chatHandle;
        }

        return formattedHandle;
    };

    const getWinningColor = () => {
        for (const player in players) {
            if (players[player].wallet === winningPlayer) {
                return players[player].balloonColor;
            }
        }
    };

    const playersAry = Object.keys(players).map(k => players[k]);
    const playersGroup1 = playersAry.filter((_, index) => index % 2 === 0);
    const playersGroup2 = playersAry.filter((_, index) => index % 2 === 1);

    useEffect(() => {
        if (winningPlayer) {
            dispatch(clearBalloons());
            dispatch(clearDarts());
            setTimeout(() => {
                canvasRef.current.width = canvasRef.current.width;
                canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }, 100);
        }
    }, [winningPlayer]);

    return (
        <div id="arena" className="mx-auto my-5 d-flex flex-column pe-xxl-124">
            <div className="arena">
                <div id="board" className="position-relative">
                    {gameState === "betting" && (
                        <div className="m-auto betting-board">
                            <div className="active-balloons">
                                <div className="active-balloons-left">
                                    {playersGroup1.slice(0, 5).map(player => (
                                        <div className="active-balloons-color">
                                            <div className={`color-balloon ${player?.balloonColor}-balloon`}></div>
                                            <div className="player-information">
                                                <div className="player-name">{getHandleDisplay(player.chatHandle ? player.chatHandle : player.sessionId)}</div>
                                                <div className="round-balloon-amount">
                                                    <div className="amount-container">
                                                        <p>{player?.startingBalloons}</p>
                                                    </div>
                                                    <p className="one">x</p>
                                                    <p className="two">{balloonPrice} SOL</p>
                                                    <p className="three">=</p>
                                                    <p className="four">{(player?.startingBalloons * balloonPrice).toFixed(2)} SOL</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="active-balloons-right">
                                    {playersGroup2.slice(0, 5).map(player => (
                                        <div className={"active-balloons-color"}>
                                            <div className={`color-balloon ${player?.balloonColor}-balloon`}></div>
                                            <div className="player-information">
                                                <div className="player-name">{getHandleDisplay(player.chatHandle ? player.chatHandle : player.sessionId)}</div>
                                                <div className="round-balloon-amount">
                                                    <div className="amount-container">
                                                        <p>{player?.startingBalloons}</p>
                                                    </div>
                                                    <p className="one">x</p>
                                                    <p className="two">{balloonPrice} SOL</p>
                                                    <p className="three">=</p>
                                                    <p className="four">{(player?.startingBalloons * balloonPrice).toFixed(2)} SOL</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="round-information mx-5 mb-1">
                                <div className="round-transition-information">
                                    <div className="round-starts">
                                        <div className="round-starts-container">
                                            <p className="one">Round Starts:</p>
                                            <p className="two pt-3">{roundStartsIn < 0 ? "Waiting for Players.." : roundStartsIn?.toFixed(1)}</p>
                                        </div>
                                    </div>

                                    <div className="odds-to-win">
                                        <div className="odds-to-win-container">
                                            <p className="one">Your odds to win:</p>
                                            <p className="two">{player?.startingBalloons ? `${(getOddsToWin() * 100).toFixed(2)}%` : `0%`} </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Interface />
                        </div>
                    )}

                    {board && (
                        <div className="">
                            <Ballista id={"ballista-top-left"} fireTrigger={ballistas.topLeftCorner} rotate={135} className={"position-absolute top-0 start-0"} />
                            <Ballista id={"ballista-top-right"} fireTrigger={ballistas.topRightCorner} rotate={225} className={"position-absolute top-0 end-0"} />

                            <Ballista
                                id={"ballista-bottom-left"}
                                fireTrigger={ballistas.bottomLeftCorner}
                                top={board.getBoundingClientRect().bottom - 120}
                                left={board.getBoundingClientRect().left + 9}
                                rotate={45}
                                className={"position-absolute bottom-0 start-0"}
                            />
                            <Ballista
                                id={"ballista-bottom-right"}
                                fireTrigger={ballistas.bottomRightCorner}
                                top={board.getBoundingClientRect().bottom - 120}
                                left={board.getBoundingClientRect().right - 60}
                                rotate={315}
                                className={"position-absolute bottom-0 end-0"}
                            />
                        </div>
                    )}

                    {winningPlayer && gameState !== "betting" && (
                        <div className="m-auto">
                            <div className="success-screen">
                                <img src={winnerImg} alt="winner" />
                                <h1 className="winner-name">{winningName}</h1>
                                <h5>{winningPlayer}</h5>
                                <div
                                    style={{
                                        backgroundImage: `url('${
                                            getWinningColor() === "red"
                                                ? balloonAssets.redBalloon.static
                                                : getWinningColor() === "blue"
                                                ? balloonAssets.blueBalloon.static
                                                : getWinningColor() === "pink"
                                                ? balloonAssets.pinkBalloon.static
                                                : getWinningColor() === "yellow"
                                                ? balloonAssets.yellowBalloon.static
                                                : getWinningColor() === "purple"
                                                ? balloonAssets.purpleBalloon.static
                                                : getWinningColor() === "green"
                                                ? balloonAssets.greenBalloon.static
                                                : getWinningColor() === "orange"
                                                ? balloonAssets.orangeBalloon.static
                                                : getWinningColor() === "robot"
                                                ? balloonAssets.robotBalloon.static
                                                : getWinningColor() === "solana"
                                                ? balloonAssets.solanaBalloon.static
                                                : balloonAssets.gradientBalloon.static
                                        }')`,
                                        width: "58px",
                                        height: "75px",
                                        backgroundSize: "cover",
                                        backgroundRepeat: "no-repeat",
                                        backgroundPosition: "center",
                                    }}
                                ></div>
                            </div>
                        </div>
                    )}

                    <canvas ref={canvasRef} width={935} height={935} className="position-absolute top-0 left-0" />
                </div>
            </div>

            <div className="total-jackpot">
                <div className="total-jackpot-title">Total Jackpot</div>

                <div className="total-jackpot-amount">
                    <div className="sol-amount">
                        <p>{getTotalJackpot().toFixed(2)}</p>
                        <div className="solana-image"></div>
                    </div>
                    <div className="sol-fee">House fee - {(getTotalJackpot() * 0.05).toFixed(3)} SOL</div>
                </div>

                <div className="players">
                    <p className="players-label">Players:</p>
                    <p className="players-amount">{Object?.values(players).length}</p>
                </div>
            </div>
        </div>
    );
}
