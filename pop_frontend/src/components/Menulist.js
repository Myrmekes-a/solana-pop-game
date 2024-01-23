import Modal from "react-bootstrap/Modal";
import { useNavigate } from "react-router-dom";

export default function Menulist(props) {
    const navigate = useNavigate();

    return (
        <Modal {...props} aria-labelledby="contained-modal-title-vcenter" centered>
            <div className="layout"></div>

            <ul className="menu-list d-flex flex-column align-items-start">
                <button
                    type="button"
                    className="common-red-bg text-white"
                    onClick={() => {
                        props.onHide();
                        navigate("/");
                    }}
                >
                    Home
                </button>
                <button
                    type="button"
                    className="common-red-bg text-white"
                    onClick={() => {
                        props.onHide();
                        navigate("/leaderboard");
                    }}
                >
                    Leaderboard
                </button>
                <button
                    type="button"
                    className="common-red-bg text-white"
                    onClick={() => {
                        props.onHide();
                        navigate("/howtoplay");
                    }}
                >
                    How to Play
                </button>
                <button
                    type="button"
                    className="common-red-bg text-white"
                    onClick={() => {
                        props.onHide();
                        navigate("/faq");
                    }}
                >
                    FAQ
                </button>
            </ul>

            <span className="position-absolute closeBtn" onClick={props.onHide}>
                <svg width={50} height={50} viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
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
