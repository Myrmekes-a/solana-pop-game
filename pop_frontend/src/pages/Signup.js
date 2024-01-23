import { useState, useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Modal } from "react-bootstrap";
import CircularProgress from "@mui/material/CircularProgress";
import "../App.css";
import "../assets/styles/signup.css";
import discordIcon from "../assets/img/logo-discord.svg";
import twitterIcon from "../assets/img/logo-twitter.svg";
import userService from "../services/user.service";
import { apiUrl } from "../services/http.common";

export default function SignUp(props) {
    const [username, setUserName] = useState("");
    const [code, setCode] = useState("");
    const [adult, setAdult] = useState(false);
    const [legal, setLegal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [promptShow, setPromptShow] = useState(false);
    const [unameConflinct, setUnameConflict] = useState(false);
    const [discordConnected, setDiscordConnected] = useState(false);

    const [searchParams, setSearchParams] = useSearchParams();

    const channel = useMemo(() => new BroadcastChannel("couldBeAnything"), []);

    useEffect(() => {
        channel.addEventListener("message", e => {
            setDiscordConnected(e.data.discordConnected);
        });

        const affiliateCode = localStorage.getItem("AffiliateCode");
        if (affiliateCode) {
            setCode(affiliateCode);
        }

        const discordToken = localStorage.getItem("discord_token");
        if (discordToken) {
            setDiscordConnected(true);
        }
    }, []);

    useEffect(() => {
        const discordToken = searchParams.get("discord_token");
        if (discordToken) {
            localStorage.setItem("discord_token", discordToken);

            channel.postMessage({
                discordConnected: true,
            });

            window.opener = null;
            window.open("", "_self");
            window.close();
        }
    }, [searchParams]);

    useEffect(() => {
        const timeOutId = setTimeout(() => {
            if (!isValidated()) return;
            userService
                .getProfileByUserName(username)
                .then(res => {
                    setUnameConflict(true);
                })
                .catch(err => {
                    setUnameConflict(false);
                });
        }, 500);
        return () => clearTimeout(timeOutId);
    }, [username]);

    const isValidated = useCallback(() => {
        return username.match(/^[a-zA-Z0-9_-]+$/);
    }, [username]);

    const canSave = useCallback(() => {
        return isValidated() && adult && legal && !unameConflinct;
    }, [username, adult, legal, unameConflinct]);

    const saveUserProfile = () => {
        if (!canSave()) return;
        setSaving(true);

        const discordToken = localStorage.getItem("discord_token");

        userService
            .createProfile(username, code, discordToken ? discordToken : "")
            .then(res => {
                setPromptShow(true);
            })
            .catch(err => {})
            .finally(() => setSaving(false));
    };

    const goToHome = () => {
        window.open("/", "_self");
    };

    const handleConnectDiscord = () => {
        window.open(`${apiUrl}/discord/login`, "_blank");
    };

    const handleDisconnectDiscord = () => {
        setDiscordConnected(false);
        localStorage.removeItem("discord_token");
    };

    return (
        <>
            <div className="signup-container d-flex flex-column">
                <form className="was-validated">
                    <div>
                        <div className="d-flex align-items-center gap-2 mb-2">
                            <label htmlFor="username" className="fw-bold text-white">
                                Username<span className="text-danger">*</span>
                            </label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={e => {
                                    setUserName(e.target.value);
                                    setUnameConflict(false);
                                }}
                                placeholder="username"
                                className={`form-control border border-0 w-100 rounded ps-2 py-2 fw-semibold fs-6 ${unameConflinct || !isValidated() ? "invalid" : ""}`}
                                required
                            />
                        </div>
                        {unameConflinct && <div className="invalid-feedback">The username already taken.</div>}
                        {!unameConflinct && !isValidated() && <div className="invalid-feedback text-center">The letters can be taken from a-zA-Z0-9_-</div>}
                    </div>

                    <div className="d-flex flex-column gap-1 w-100">
                        <div className="d-flex align-items-center gap-4 py-2">
                            <button type="button" className="btn w-50 connect-btn text-white text-center">
                                <img alt="discord" src={twitterIcon} width={20} className="me-1" />
                                <span>Connect Twitter</span>
                            </button>

                            {!discordConnected && (
                                <button type="button" className="btn gap-2 w-50 connect-btn text-white text-center" onClick={handleConnectDiscord}>
                                    <img alt="discord" src={discordIcon} width={20} className="me-1" />
                                    <span>Connect Discord</span>
                                </button>
                            )}
                            {discordConnected && (
                                <button type="button" className="btn gap-2 w-50 disconnect-btn text-center" onClick={handleDisconnectDiscord}>
                                    Disconnect Discord
                                </button>
                            )}
                        </div>

                        <div className="w-100 d-flex flex-column align-items-start gap-2">
                            <div className="form-check">
                                <input className="form-check-input" type="checkbox" value={adult} onChange={() => setAdult(!adult)} id="adultCheck" required />
                                <label className="form-check-label text-white fw-semibold" htmlFor="adultCheck">
                                    I confirm that I am at least 18 (eighteen) years old<span className="text-danger">*</span>
                                </label>
                            </div>

                            <div className="form-check">
                                <input className="form-check-input" type="checkbox" value={legal} onChange={() => setLegal(!legal)} id="legalCheck" required />
                                <label className="form-check-label text-white fw-semibold" htmlFor="legalCheck">
                                    I confirm that online gambling is legal in my region<span className="text-danger">*</span>
                                </label>
                            </div>

                            <input
                                type="text"
                                value={code}
                                onChange={val => setCode(val.target.value)}
                                placeholder="affiliate code"
                                className="border border-0 w-100 rounded ps-2 py-2 fw-semibold fs-6"
                            />
                        </div>
                    </div>
                </form>

                {saving && (
                    <button type="button" className="btn connect-btn text-white text-center mx-auto" disabled>
                        <CircularProgress style={{ color: "white" }} />
                    </button>
                )}
                {!saving && !canSave() && (
                    <button type="button" className="btn connect-btn text-white text-center mx-auto" disabled>
                        Register
                    </button>
                )}
                {!saving && canSave() && (
                    <button type="button" className="btn connect-btn text-white text-center mx-auto" onClick={saveUserProfile}>
                        Register
                    </button>
                )}
            </div>

            <Modal show={promptShow} backdrop="static" aria-labelledby="contained-modal-title-vcenter" centered>
                <div className="prompt-container d-flex flex-column align-items-center">
                    <span className="fw-bold text-white">Your account created.</span>
                    <button type="button" className="btn w-50 connect-btn text-white text-center" onClick={goToHome}>
                        OK
                    </button>
                </div>
            </Modal>
        </>
    );
}
