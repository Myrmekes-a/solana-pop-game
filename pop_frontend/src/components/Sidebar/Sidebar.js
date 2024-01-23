import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { removePlayer, setPopRoomKey } from "../../store/slices/appSlice";
import "./sidebar.css";

export default function Sidebar({ setPromptShow, setContent }) {
    const rooms = [
        { color: "yellow", amount: 0.1, key: "pop_0_1a" },
        { color: "blue", amount: 0.1, key: "pop_0_1b" },
        { color: "pink", amount: 0.25, key: "pop_0_25a" },
        { color: "purple", amount: 0.25, key: "pop_0_25b" },
        { color: "green", amount: 0.5, key: "pop_0_5" },
        { color: "orange", amount: 1.0, key: "pop_1_0" },
        { color: "robot", amount: 2.0, key: "pop_2_0" },
        { color: "gradient", amount: 5.0, key: "pop_5_0" },
        { color: "solana", amount: 10.0, key: "pop_10_0" },
    ];

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const sessionId = useSelector(state => state.account.sessionId);
    const popRoomClient = useSelector(state => state.app.popRoomClient);
    const popRoomKey = useSelector(state => state.app.popRoomKey);
    const players = useSelector(state => state.app.players);
    const gameStarted = useSelector(state => state.app.gameStarted);
    const player = players[sessionId];

    const handleSelectRoom = key => {
        if (popRoomKey === key) return;
        if (gameStarted && player?.startingBalloons) {
            console.log("Already playing game");
            setContent("Please wait until game ends");
            setPromptShow(true);
            return;
        }

        popRoomClient?.leave();
        dispatch(setPopRoomKey(key));
        dispatch(removePlayer(sessionId));
        navigate(`/room/${key}`);
    };

    return (
        <div className="game-tabs">
            <ul className="game-tabs-items">
                {rooms.map(room => {
                    return (
                        <li
                            key={room.key}
                            className={popRoomKey === room.key ? `game-tab-active` : `game-tab`}
                            onClick={() => {
                                handleSelectRoom(room.key);
                            }}
                        >
                            <div className={`image-div ${room.color}`}></div>
                            <p>{room.amount} SOL</p>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
