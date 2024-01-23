import { useState, useEffect, useMemo, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import logger from "loglevel";
import * as buffer from "buffer";
import bs58 from "bs58";
import { Modal } from "react-bootstrap";
import { WalletProvider, ConnectionProvider, useWallet } from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { setLoggedIn, setCredits, setWallet } from "./store/slices/accountSlice";
import authService from "./services/auth.service";
import creditService from "./services/credit.service";
import userService from "./services/user.service";
import { Home, Leaderboard, Room, SignUp } from "./pages";
import { gamblingAudio } from "./data/audios";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

logger.setLevel(logger.levels.DEBUG);

window.Buffer = buffer.Buffer;

const bestWidth = 1024;
const bestHeight = 1180;

function App() {
    const appRef = useRef();
    const dispatch = useDispatch();
    const { disconnect } = useWallet();
    const searchParams = new URLSearchParams(document.location.search);

    const musicVolume = useSelector(state => state.app.musicVolume);
    const wallet = useSelector(state => state.account.wallet);
    const loggedIn = useSelector(state => state.account.loggedIn);
    const popRoomClient = useSelector(state => state.app.popRoomClient);
    const gameStarted = useSelector(state => state.app.gameStarted);

    const [isPlayed, setIsPlayed] = useState(false);
    const [promptShow, setPromptShow] = useState(false);
    const [windowSize, setWindowSize] = useState();
    const [ratio, setRatio] = useState();

    const network = WalletAdapterNetwork.Mainnet;
    const endpoint = process.env.REACT_APP_ENDPOINT;
    const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter({ network })], [network]);

    const handleResize = () => {
        setWindowSize(`${window.innerWidth}x${window.innerHeight}`);

        const wRatio = window.innerWidth / bestWidth;
        const hRatio = window.innerHeight / bestHeight;
        setRatio(wRatio <= hRatio ? wRatio : hRatio);
    };

    useEffect(() => {
        window.onload = handleResize;
        window.onresize = handleResize;
    }, [windowSize]);

    useEffect(() => {
        appRef.current.addEventListener("click", playGamblingAudio);
    }, [appRef]);

    useEffect(() => {
        appRef.current.setAttribute("music-volume", musicVolume);
        gamblingAudio.volume = musicVolume / 100;
    }, [musicVolume]);

    const playGamblingAudio = () => {
        if (isPlayed) return;

        gamblingAudio.volume = appRef.current.getAttribute("music-volume") / 100;
        gamblingAudio.loop = true;
        const gamblingAudioPromise = gamblingAudio.play();
        if (gamblingAudioPromise) {
            gamblingAudioPromise.catch(e => {}).then(() => {});
        }

        setIsPlayed(true);
    };

    useEffect(() => {
        // Check to see if we need to clear being logged in
        // This logic can be cleaned up
        if (loggedIn && !wallet?.connected) {
            dispatch(setLoggedIn(false));
            localStorage.removeItem("pop-access-token");
        }

        if (!loggedIn && wallet?.publicKey) {
            const message = new TextEncoder().encode("pop!012345678901234567890123456789");

            wallet.signMessage(message).then(signature => {
                authService.login(wallet.publicKey.toBase58(), bs58.encode(signature)).then(loginResp => {
                    // If successful set jwt in local storage and set logged in
                    if (loginResp.data?.accessToken) {
                        localStorage.setItem("pop-access-token", loginResp.data.accessToken);

                        userService
                            .getMyProfile()
                            .then(res => {
                                if (res.data.user.userProfile) {
                                    dispatch(setLoggedIn(true));

                                    creditService.getCreditBalance().then(resp => {
                                        dispatch(setCredits(resp.data.balance));
                                    });
                                } else {
                                    setPromptShow(true);
                                }
                            })
                            .catch(err => {
                                setPromptShow(true);
                            });
                    }
                });
            });
        }
    }, [wallet?.publicKey, loggedIn]);

    useEffect(() => {
        if (localStorage.getItem("pop-access-token") && wallet?.disconnecting) {
            dispatch(setLoggedIn(false));
            dispatch(
                setWallet({
                    publicKey: "",
                    signMessage: "",
                    signTransaction: "",
                    connected: false,
                    connecting: false,
                    disconnecting: false,
                }),
            );
            if (!gameStarted && popRoomClient) {
                popRoomClient.leave();
            }
            localStorage.removeItem("pop-access-token");
        }
    }, [wallet?.disconnecting]);

    useEffect(() => {
        const affiliateCode = searchParams.get("affiliate");
        if (affiliateCode) {
            localStorage.setItem("AffiliateCode", affiliateCode);
        }

        if (!loggedIn) return;

        userService
            .getUser()
            .then(res => {})
            .catch(err => {
                if (wallet) {
                    disconnect();
                }
            });
    }, [wallet?.connected]);

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <style>
                        {`#arena {
                                zoom: ${ratio}
                            }`}
                    </style>

                    <div className="App" ref={appRef}>
                        <BrowserRouter>
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/signup" element={<SignUp />} />
                                <Route path="/leaderboard" element={<Leaderboard />} />
                                <Route path="/room/:roomKey" element={<Room />} />
                                <Route path="/*" element={<Home />} />
                            </Routes>
                        </BrowserRouter>
                    </div>

                    <Modal show={promptShow} backdrop="static" aria-labelledby="contained-modal-title-vcenter" centered>
                        <div className="prompt-container d-flex flex-column align-items-center">
                            <span className="fw-bold text-white">You have to make an account!</span>
                            <button
                                type="button"
                                className="btn w-50 connect-btn text-white text-center"
                                onClick={() => {
                                    window.location.href = "/signup";
                                }}
                            >
                                OK
                            </button>
                        </div>
                    </Modal>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}

export default App;
