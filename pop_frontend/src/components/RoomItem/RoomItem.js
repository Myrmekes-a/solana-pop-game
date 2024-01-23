import { useEffect } from "react";
import { roomMaxClients } from "../../utils/getPopGameClient";
import "./roomitem.css";

export default function RoomItem({ color, amount, players, clickFunc }) {
    useEffect(() => {}, [players]);

    return (
        <div className="room-item" onClick={clickFunc}>
            <div className={`room-img ${color}`}></div>
            <div className="room-amount">{amount} SOL</div>
            <div className={`room-players ${players >= roomMaxClients ? "room-full" : ""}`}>({players}/{roomMaxClients})</div>
        </div>
    );
}
