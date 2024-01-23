import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import "../App.css";
import "../assets/styles/leaderboard.css";
import MainLayout from "../layouts/MainLayout";
import userService from "../services/user.service";
import { trim } from "../utils/trim";
import { setPopRoomKey } from "../store/slices/appSlice";

export default function Leaderboard() {
    const dispatch = useDispatch();

    const [board, setBoard] = useState(0);
    const [players, setPlayers] = useState([]);

    useEffect(() => {
        dispatch(setPopRoomKey(""));

        userService
            .getAllUsers()
            .then(res => {
                setPlayers(res.data);
            })
            .catch(err => {});
    }, []);

    const handleSelect = item => {
        setBoard(item);

        if (item === 0) {
            setPlayers(
                players.sort((a, b) => {
                    return b.solWon - a.solWon;
                }),
            );
        } else if (item === 1) {
            setPlayers(
                players.sort((a, b) => {
                    return b.balloonPurchased - a.balloonPurchased;
                }),
            );
        } else if (item === 2) {
            setPlayers(
                players.sort((a, b) => {
                    return b.gameWon - a.gameWon;
                }),
            );
        }
    };

    return (
        <MainLayout>
            <div className="leaderboard-container">
                <ul className="leaderboard-tabs">
                    <li className={`leaderboard-tab ${board === 0 ? "leaderboard-tab-active" : ""}`} onClick={() => handleSelect(0)}>
                        SOL Won
                    </li>
                    <li className={`leaderboard-tab ${board === 1 ? "leaderboard-tab-active" : ""}`} onClick={() => handleSelect(1)}>
                        Balloons Purchased
                    </li>
                    <li className={`leaderboard-tab ${board === 2 ? "leaderboard-tab-active" : ""}`} onClick={() => handleSelect(2)}>
                        Game Won
                    </li>
                </ul>

                <div className="leaderboard-pane">
                    <table className="w-100">
                        <thead>
                            <tr>
                                <th>Player</th>
                                <th>Amount</th>
                                <th>Wallet</th>
                            </tr>
                        </thead>
                        <tbody>
                            {players.length === 0 && (
                                <tr className="text-center">
                                    <td colSpan="3">No player exist</td>
                                </tr>
                            )}
                            {players.length > 0 &&
                                players.map(player => {
                                    return (
                                        <tr key={player.name}>
                                            <td>{player.name}</td>
                                            <td>{new Intl.NumberFormat("en-US").format(trim(player.amount / Math.pow(10, 9), 2))}</td>
                                            <td>
                                                {player.wallet.slice(0, 4)}...{player.wallet.slice(0, 4)}
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>
            </div>
        </MainLayout>
    );
}
