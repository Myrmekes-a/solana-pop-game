import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Modal } from "react-bootstrap";
import { removePlayer, setGameStarted, setPlayers, setPopRoomKey } from "../store/slices/appSlice";
import MainLayout from "../layouts/MainLayout";
import RoomItem from "../components/RoomItem/RoomItem";
import Ballista from "../components/Ballista";
import gameClientObject, { roomMaxClients } from "../utils/getPopGameClient";
import "../assets/styles/home.css";

export default function Home() {
    const [rooms, setRooms] = useState([
        { key: "pop_0_1a", color: "yellow", amount: 0.1, players: 0 },
        { key: "pop_0_1b", color: "blue", amount: 0.1, players: 0 },
        { key: "pop_0_25a", color: "pink", amount: 0.25, players: 0 },
        { key: "pop_0_25b", color: "purple", amount: 0.25, players: 0 },
        { key: "pop_0_5", color: "green", amount: 0.5, players: 0 },
        { key: "pop_1_0", color: "orange", amount: 1.0, players: 0 },
        { key: "pop_2_0", color: "robot", amount: 2.0, players: 0 },
        { key: "pop_5_0", color: "gradient", amount: 5.0, players: 0 },
        { key: "pop_10_0", color: "solana", amount: 10.0, players: 0 },
    ]);

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const sessionId = useSelector(state => state.account.sessionId);
    const loggedIn = useSelector(state => state.account.loggedIn);
    const popRoomClient = useSelector(state => state.app.popRoomClient);

    const [board, setBoard] = useState();
    const [windowSize, setWindowSize] = useState();
    const [content, setContent] = useState("");
    const [promptShow, setPromptShow] = useState(false);

    useEffect(() => {
        popRoomClient?.leave();
        dispatch(setPlayers({}));
        dispatch(setPopRoomKey(""));
        dispatch(setGameStarted(false));
        gameClientObject.popRoom = undefined;
    }, []);

    useEffect(() => {
        if (!board) {
            const temp = document.getElementById("panel");
            setBoard(temp);
        }

        window.onresize = () => {
            setWindowSize(`${window.innerWidth}x${window.innerHeight}`);
        };
    }, [windowSize]);

    useEffect(() => {
        if (!loggedIn) return;

        const gameClient = gameClientObject.getGameClient();
        const accessToken = localStorage.getItem("pop-access-token");

        const currentRooms = rooms;
        currentRooms.forEach((currentRoom, index) => {
            gameClient
                .joinOrCreate(currentRoom.key, { accessToken, role: "spectator" })
                .then(room => {
                    let newRooms = [...rooms];
                    newRooms[index].players = room.state.players.$items.size;
                    setRooms(newRooms);

                    room.state.players.onAdd = function (player, sessionId) {
                        console.log(`Player ${player?.wallet}::${sessionId} joined.`);
                        let newRooms = [...rooms];
                        newRooms[index].players = room.state.players.size;
                        setRooms(newRooms);
                    };

                    room.state.players.onRemove = function (player, sessionId) {
                        console.log(`Player ${player?.wallet}::${sessionId} left.`);
                        let newRooms = [...rooms];
                        newRooms[index].players = room.state.players.size;
                        setRooms(newRooms);
                    };
                })
                .catch(err => {});
        });
    }, [loggedIn]);

    const handleSelectRoom = key => {
        popRoomClient?.leave();
        dispatch(removePlayer(sessionId));
        dispatch(setPopRoomKey(key));
        gameClientObject.popRoom = undefined;
        navigate(`/room/${key}`);
    };

    return (
        <MainLayout>
            <div className="room-items" id="panel">
                {rooms.map(room => {
                    return (
                        <RoomItem
                            key={room.key}
                            color={room.color}
                            amount={room.amount}
                            players={room.players}
                            clickFunc={() => {
                                handleSelectRoom(room.key);
                            }}
                        />
                    );
                })}

                <div className="">
                    <Ballista id={"ballista-top-left"} rotate={135} className={"position-absolute top-0 start-0"} />
                    <Ballista id={"ballista-top-right"} rotate={225} className={"position-absolute top-0 end-0"} />
                    <Ballista
                        id={"ballista-bottom-left"}
                        top={board?.getBoundingClientRect().bottom - 120}
                        left={board?.getBoundingClientRect().left + 9}
                        rotate={45}
                        className={"position-absolute bottom-0 start-0"}
                    />
                    <Ballista
                        id={"ballista-bottom-right"}
                        top={board?.getBoundingClientRect().bottom - 120}
                        left={board?.getBoundingClientRect().right - 60}
                        rotate={315}
                        className={"position-absolute bottom-0 end-0"}
                    />
                </div>
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
