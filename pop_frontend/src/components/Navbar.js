import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { LAMPORTS_PER_SOL, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import logger from "loglevel";
import { capitalize } from "lodash";
import loadingImage from "../assets/img/loading_wheel.gif";
import confirmedImage from "../assets/img/black_check.webp";
import hamburger from "../assets/img/hamburger.webp";
import profileImage from "../assets/img/profile.svg";
import speakerImage from "../assets/img/speaker.svg";
import balanceService from "../services/balance.service";
import creditService from "../services/credit.service";
import solanaService from "../services/solana.service";
import Wallet from "./Wallet";
import Menulist from "./Menulist";
import Profile from "./Profile";
import AudioSettings from "./AudioSettings";
import { setCredits } from "../store/slices/accountSlice";
import { depositAudio } from "../data/audios";
import "../assets/styles/navbar.css";

const appWallet = new PublicKey(process.env.REACT_APP_WALLET);

let history;

const getFormattedDate = parsedDate => {
    console.log("Parse date", parsedDate);
    const date = new Date(parsedDate);

    return `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear().toString()}`;
};

export default function Navbar() {
    const dispatch = useDispatch();
    const wallet = useSelector(state => state.account.wallet);
    const credits = useSelector(state => state.account.credits);
    const loggedIn = useSelector(state => state.account.loggedIn);

    const [menuShown, setMenuShown] = useState(false);
    const [profileShown, setProfileShown] = useState(false);
    const [audioSettingsShown, setAudioSettingsShown] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const [accountItem, setAccountItem] = useState(1);
    const [loading, setLoading] = useState(false);
    const [depositConfirmed, setDepositConfirmed] = useState(false);
    const [withdrawConfirmed, setWithdrawConfirmed] = useState(false);
    const [transactionError, setTransactionError] = useState(false);
    const [walletSolBalance, setWalletSolBalance] = useState(0);
    const [withdrawAmount, setWithdrawAmount] = useState();
    const [depositAmount, setDepositAmount] = useState(0);

    const accountRef = useRef();

    const getWalletBalance = () => {
        if (!loggedIn) return;

        balanceService
            .getWalletBalance()
            .then(walletBalanceResp => {
                setWalletSolBalance(walletBalanceResp.data.solanaBalance.walletBalance); // Awful Naming
            })
            .catch(err => {});
    };

    const setPendingWithdraw = event => {
        setWithdrawAmount(event.target.value);
    };

    const setPendingDeposit = event => {
        setDepositAmount(event.target.value);
    };

    // Buttons
    const deposit = async () => {
        const depositAudioPromise = depositAudio.play();
        if (depositAudioPromise) {
            depositAudioPromise.catch(e => {}).then(() => {});
        }

        setLoading(true);
        setTransactionError(true);

        const rBlockhashResp = await solanaService.getRecentBlockhash();

        if (!rBlockhashResp) {
            setTransactionError(true);
        } else {
            setTransactionError(false);
        }

        const depositTx = new Transaction();
        const depositIx = SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: appWallet,
            lamports: Number(depositAmount) * LAMPORTS_PER_SOL,
        });
        depositTx.add(depositIx);
        depositTx.feePayer = wallet.publicKey;
        depositTx.recentBlockhash = rBlockhashResp.data.blockhash;
        const result = await wallet.signTransaction(depositTx);

        if (!result) {
            setTransactionError(true);
        } else {
            setTransactionError(false);
        }

        try {
            const depositResult = await creditService.deposit(depositAmount, result.serialize().toString("base64"));

            if (!depositResult || depositResult.data.err) {
                console.log("==> Deposit Error:", depositResult?.data?.err);
                setTransactionError(true);
            } else {
                setTransactionError(false);
                dispatch(setCredits(depositResult.data.balance));
            }
        } catch (e) {
            console.log("==> Deposit Error:", e);
            setTransactionError(true);
        }

        setLoading(false);
        setDepositConfirmed(true);

        setTimeout(() => {
            setDepositConfirmed(false);
            setTransactionError(false);
        }, 2000);
    };

    const withdraw = async () => {
        setLoading(true);
        setTransactionError(true);
        try {
            const withdrawResp = await creditService.withdraw(withdrawAmount);

            if (!withdrawResp || withdrawResp.data.err) {
                console.log("==> Withdraw Error:", withdrawResp?.data?.err);
                setTransactionError(true);
            } else {
                setTransactionError(false);
                dispatch(setCredits(withdrawResp.data.remainingBalance));
            }
        } catch (e) {
            console.log("==> Withdraw Error:", e);
            setTransactionError(true);
        }
        setLoading(false);
        setWithdrawConfirmed(true);
        setTimeout(() => {
            setWithdrawConfirmed(false);
            setTransactionError(false);
        }, 2000);
    };

    useEffect(() => {
        let handler = e => {
            if (!accountRef.current.contains(e.target)) {
                setAccountOpen(false);
            }
        };

        document.addEventListener("mousedown", handler);

        if (!walletSolBalance) {
            getWalletBalance();
        }

        if (!history) {
            logger.debug(`Fetching history from backend`);

            if (!history) {
                history = [];
            }

            if (loggedIn) {
                creditService.getCreditsHistory().then(historyResp => {
                    history = historyResp.data.history.slice(0, 4);
                });
            }
        }

        return () => {
            document.removeEventListener("mousedown", handler);
        };
    }, [wallet?.connected, loggedIn]);

    return (
        <>
            <Menulist
                show={menuShown}
                onHide={() => {
                    setMenuShown(false);
                }}
            />

            <Profile
                show={profileShown}
                onHide={() => {
                    setProfileShown(false);
                }}
            />

            <AudioSettings
                show={audioSettingsShown}
                onHide={() => {
                    setAudioSettingsShown(false);
                }}
            ></AudioSettings>

            <div className="navbar d-flex flex-column">
                <header className="navbar-header">
                    <div className="wrapper">
                        <div className="menu-container">
                            <img
                                src={hamburger}
                                alt="arrow"
                                className="menu-toggle"
                                onClick={() => {
                                    setMenuShown(true);
                                }}
                            />
                        </div>
                    </div>
                    <div className="logo-div">
                        <div></div>
                    </div>

                    <div className="account">
                        <button
                            className="wallet-container"
                            onClick={() => {
                                if (!accountOpen) {
                                    getWalletBalance();
                                }
                                setAccountOpen(!accountOpen);
                            }}
                        >
                            <p>Wallet</p>
                        </button>
                        <div className="balance-container">
                            {/* <div className="expand-arrow"></div> */}
                            <div className="balance">
                                <div className="solana-image"></div>
                                <p>{(credits / LAMPORTS_PER_SOL).toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                        <div id="wallet">
                            <div className="d-flex align-items-center gap-2">
                                <button className="wallet-adapter-button-trigger text-white py-2 px-2 h-12" onClick={() => setAudioSettingsShown(true)}>
                                    <img alt="speaker" src={speakerImage} width={28} />
                                </button>

                                <button className="wallet-adapter-button-trigger text-white py-2 px-2 h-12" onClick={() => setProfileShown(true)}>
                                    <img alt="signup" src={profileImage} width={28} />
                                </button>

                                <Wallet />
                            </div>
                        </div>
                    </div>
                </header>
            </div>

            <div className={`account-interface ${accountOpen ? "active" : "inactive"}`}>
                <div className="overlay"></div>
                <div className="account-interface-content" ref={accountRef}>
                    <ul className="account-item-tabs">
                        <li
                            className={accountItem === 1 ? `tab-active one` : `tab one`}
                            onClick={() => {
                                setAccountItem(1);
                            }}
                        >
                            <p>Deposit</p>
                        </li>
                        <li
                            className={accountItem === 2 ? `tab-active two` : `tab two`}
                            onClick={() => {
                                setAccountItem(2);
                            }}
                        >
                            <p>Withdraw</p>
                        </li>
                        <li
                            className={accountItem === 3 ? `tab-active three` : `tab three`}
                            onClick={() => {
                                setAccountItem(3);
                            }}
                        >
                            <p>History</p>
                        </li>
                    </ul>
                    <div className="account-item">
                        {accountItem === 1 ? (
                            <div className="deposit-item">
                                <div className="current-balance">
                                    <p>Sol Balance:</p>
                                    <div>
                                        <div className="solana-image"></div>
                                        <p>{(walletSolBalance / LAMPORTS_PER_SOL).toFixed(2)}</p>
                                    </div>
                                </div>
                                <div className="input-container">
                                    <input onChange={setPendingDeposit} defaultValue="0"></input>
                                    {!transactionError ? (
                                        loading ? (
                                            <button>
                                                <img src={loadingImage} alt="loading"></img>
                                            </button>
                                        ) : depositConfirmed ? (
                                            <button>
                                                <img id="confirmed-image" src={confirmedImage} alt="confirmed"></img>
                                            </button>
                                        ) : (
                                            <button onClick={deposit}>Deposit</button>
                                        )
                                    ) : (
                                        <button onClick={deposit}>Deposit</button>
                                    )}
                                </div>
                            </div>
                        ) : accountItem === 2 ? (
                            <div className="withdraw-item">
                                <div className="current-balance">
                                    <p>Credits:</p>
                                    <div>
                                        <div className="solana-image"></div>
                                        <p>{(credits / LAMPORTS_PER_SOL).toFixed(2)} </p>
                                    </div>
                                </div>
                                <div className="input-container">
                                    <input onChange={setPendingWithdraw} defaultValue="0"></input>
                                    {loading ? (
                                        <button>
                                            <img src={loadingImage} alt="loading"></img>
                                        </button>
                                    ) : withdrawConfirmed ? (
                                        <button>
                                            <img id="confirmed-image" src={confirmedImage} alt="confirmed"></img>
                                        </button>
                                    ) : (
                                        <button onClick={withdraw}>Withdraw</button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <table className="mb-1">
                                <tr>
                                    <th>Type</th>
                                    <th>Amount</th>
                                    <th>Time</th>
                                </tr>
                                {history?.length &&
                                    history.map(h => {
                                        return (
                                            <tr>
                                                <td>{capitalize(h.type)}</td>
                                                <td>{(h.amount / LAMPORTS_PER_SOL).toFixed(2)}</td>
                                                <td>{getFormattedDate(Date.parse(h.createdAt))}</td>
                                            </tr>
                                        );
                                    })}
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
