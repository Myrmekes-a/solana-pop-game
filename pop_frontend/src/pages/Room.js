import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import logger from "loglevel";
import { setGameStarted, setPopRoomKey } from "../store/slices/appSlice";
import { setCredits } from "../store/slices/accountSlice";
import PopChat from "../utils/PopChat";
import MainLayout from "../layouts/MainLayout";
import Sidebar from "../components/Sidebar/Sidebar";
import Arena from "../components/Arena/Arena";
import ChatBox from "../components/ChatBox";
import "bootstrap/dist/css/bootstrap.min.css";
import "../App.css";
import { Modal } from "react-bootstrap";

export default function Room() {
    const { roomKey } = useParams();
    const dispatch = useDispatch();
    const wallet = useSelector(state => state.account.wallet);
    const loggedIn = useSelector(state => state.account.loggedIn);
    const gameState = useSelector(state => state.app.gameState);
    const popRoomKey = useSelector(state => state.app.popRoomKey);
    const bettingEndsAt = useSelector(state => state.app.bettingEndsAt);
    const winningWallet = useSelector(state => state.app.winningWallet);

    const [chatRoomClient, setChatRoomClient] = useState();
    const [popChat, setPopChat] = useState();
    const [messages, setMessages] = useState([]);
    const [chatHistory, setChatHistory] = useState([]);
    const [content, setContent] = useState("");
    const [promptShow, setPromptShow] = useState(false);

    useEffect(() => {
        if (popRoomKey !== roomKey) {
            dispatch(setPopRoomKey(roomKey));
        }
    }, []);

    useEffect(() => {
        setMessages(popChat?.chatHistory);
    }, [chatHistory]);

    useEffect(() => {
        // This could probably be idempotent too
        if (!popChat && loggedIn) {
            const newPopChat = new PopChat(wallet?.publicKey);
            newPopChat.setUpEvents(setChatHistory).then(chatRoomClient => {
                logger.debug(`Setting Chat room client`, chatRoomClient);
                setChatRoomClient(chatRoomClient);
                setPopChat(newPopChat);
            });
        }

        // Handle the winning wallet being set, then clear it
        // TODO: Revisit this
        if (winningWallet) {
            if (wallet.publicKey === winningWallet.winnerWallet) {
                dispatch(setCredits(winningWallet.newCreditBalance));
            }
        }
    }, [wallet?.publicKey, popRoomKey, loggedIn, wallet?.disconnecting, gameState]);

    useEffect(() => {
        if (gameState === "betting") {
            if (!bettingEndsAt?.value) {
                dispatch(setGameStarted(false));
                return;
            }

            const now = new Date().getTime();
            const timeUntilGameStarts = bettingEndsAt?.value - now;
            if (timeUntilGameStarts > 0) {
                dispatch(setGameStarted(true));
            } else {
                dispatch(setGameStarted(false));
            }
        } else {
            dispatch(setGameStarted(true));
        }
    }, [gameState, bettingEndsAt]);

    return (
        <MainLayout>
            <div className="w-100 d-flex flex-row" style={{ marginTop: "100px" }}>
                <Sidebar setContent={setContent} setPromptShow={setPromptShow} />

                <Arena />

                <ChatBox chatRoomClient={chatRoomClient} messages={messages} />
            </div>

            <Modal show={promptShow} backdrop="static" aria-labelledby="contained-modal-title-vcenter" centered>
                <div className="prompt-container d-flex flex-column align-items-center">
                    <span className="fw-bold text-white h4">{content}</span>
                    <button type="button" className="btn w-50 connect-btn text-white text-center" onClick={() => setPromptShow(false)}>
                        OK
                    </button>
                </div>
            </Modal>
        </MainLayout>
    );
}
