import { useState, useCallback, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import Modal from "react-bootstrap/Modal";
import CircularProgress from "@mui/material/CircularProgress";
import { CopyToClipboard } from "react-copy-to-clipboard";
import userService from "../services/user.service";
import { setName } from "../store/slices/accountSlice";
import "../assets/styles/signup.css";

export default function Profile(props) {
    const dispatch = useDispatch();
    const loggedIn = useSelector(state => state.account.loggedIn);

    const [thisName, setThisName] = useState("");
    const [username, setUserName] = useState("");
    const [affiliateLink, setAffiliateLink] = useState("");
    const [balloonsBought, setBalloonsBought] = useState(0);
    const [gamesWon, setGamesWon] = useState(0);
    const [saving, setSaving] = useState(false);
    const [unameConflinct, setUnameConflict] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!loggedIn) return;

        userService.getMyProfile().then(res => {
            const profile = res.data.user.userProfile;
            if (!profile) return;

            setThisName(profile.name);
            setUserName(profile.name);
            setAffiliateLink(`${window.location.origin}?affiliate=${profile.name}`);
            setBalloonsBought(profile.balloonsBought);
            setGamesWon(profile.gamesWon);
        });
    }, [props.show]);

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

    const isThisName = useCallback(() => {
        return username === thisName;
    }, [username]);

    const isValidated = useCallback(() => {
        return username.match(/^[a-zA-Z0-9_-]+$/);
    }, [username]);

    const canSave = useCallback(() => {
        return !unameConflinct && isValidated() && !isThisName();
    }, [username]);

    const saveUserProfile = () => {
        if (unameConflinct || !isValidated() || isThisName()) return;

        setSaving(true);

        userService
            .updateProfile(username)
            .then(res => {
                dispatch(setName(username));
                props.onHide();
            })
            .catch(err => {})
            .finally(() => setSaving(false));
    };

    return (
        <Modal {...props} aria-labelledby="contained-modal-title-vcenter" centered>
            <div className="layout"></div>

            <div className="signup-container d-flex flex-column">
                <form className="was-validated">
                    <div className="mb-2">
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
                                className={`form-control border border-0 w-100 rounded ps-2 py-2 fw-semibold fs-6 ${
                                    (unameConflinct || !isValidated()) && !isThisName() ? "invalid" : ""
                                }`}
                                required
                            />
                        </div>
                        {unameConflinct && !isThisName() && <div className="invalid-feedback text-center">The username already taken.</div>}
                        {!unameConflinct && !isThisName() && !isValidated() && <div className="invalid-feedback text-center">The letters can be taken from a-zA-Z0-9_-</div>}
                    </div>

                    <div className="d-flex justify-content-between gap-2 mb-3">
                        <label className="fw-bold text-white">Balloons Purchased:</label>
                        <span className="fw-bold text-white">{balloonsBought}</span>
                    </div>

                    <div className="d-flex justify-content-between gap-2 mb-3">
                        <label className="fw-bold text-white">Games Won:</label>
                        <span className="fw-bold text-white">{gamesWon}</span>
                    </div>

                    <div>
                        <label htmlFor="affiliateCode" className="fw-bold text-white">
                            Affiliate Code:
                        </label>
                        <div className="d-flex justify-content-between gap-2 mb-2">
                            <input
                                type="text"
                                id="affiliateCode"
                                value={affiliateLink}
                                className="form-control border border-0 w-100 rounded ps-2 py-2 fw-semibold fs-6"
                                disabled
                            />
                            <CopyToClipboard
                                text={affiliateLink}
                                onCopy={() => {
                                    setCopied(true);
                                    setTimeout(() => {
                                        setCopied(false);
                                    }, 5000);
                                }}
                            >
                                <button type="button" className="btn connect-btn text-white text-center" style={{ width: 100 }}>
                                    {copied ? "Copied" : "Copy"}
                                </button>
                            </CopyToClipboard>
                        </div>
                    </div>
                </form>

                {saving && (
                    <button type="button" className="btn connect-btn text-white text-center mx-auto w-25" disabled>
                        <CircularProgress style={{ color: "white" }} />
                    </button>
                )}
                {!saving && !canSave() && (
                    <button type="button" className="btn connect-btn text-white text-center mx-auto w-25" disabled>
                        Save
                    </button>
                )}
                {!saving && canSave() && (
                    <button type="button" className="btn connect-btn text-white text-center mx-auto w-25" onClick={saveUserProfile}>
                        Save
                    </button>
                )}
            </div>

            <span className="position-absolute end-0 p-2" onClick={props.onHide}>
                <svg width={20} height={20} viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12.5001 37.5C11.733 36.7329 11.733 35.4893 12.5001 34.7222L34.7223 12.5C35.4894 11.7329 36.733 11.7329 37.5001 12.5C38.2672 13.267 38.2672 14.5107 37.5001 15.2778L15.2779 37.5C14.5108 38.267 13.2672 38.267 12.5001 37.5Z"
                        fill="white"
                    />
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12.5001 12.5C13.2672 11.733 14.5108 11.733 15.2779 12.5L37.5001 34.7222C38.2672 35.4893 38.2672 36.733 37.5001 37.5C36.733 38.2671 35.4894 38.2671 34.7223 37.5L12.5001 15.2778C11.733 14.5107 11.733 13.2671 12.5001 12.5Z"
                        fill="white"
                    />
                </svg>
            </span>
        </Modal>
    );
}
