import { useRef, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import userService from "../services/user.service";
import "../assets/styles/chatbox.css";
import arrowRight from "../assets/img/arrow-right.svg";

function ChatBox({ chatRoomClient, messages }) {
    const chatInput = useRef();
    const ref = useChatScroll(messages?.length);
    const loggedIn = useSelector(state => state.account.loggedIn);
    const uname = useSelector(state => state.account.name);

    const [userHandle, setUserHandle] = useState();
    const [showEdit, setShowEdit] = useState(false);
    const [boxHidden, setBoxHidden] = useState(true);

    const getUserHandle = async () => {
        if (!loggedIn) return;
        console.log("Getting User handle");

        userService
            .getUser()
            .then(popUserResp => {
                popUserResp
                    ? popUserResp.data.user.chatHandle
                        ? setUserHandle(popUserResp.data.user.chatHandle)
                        : setUserHandle(popUserResp.data.user.wallet)
                    : setUserHandle("Handle");
            })
            .catch(err => {});
    };

    // TODO: Add endpoint to update handle
    // TODO: Add some validations here
    const setHandle = async () => {
        const jwt = localStorage.getItem("pop-access-token");
        const handleInput = document.getElementById("handle");

        const newHandle = handleInput.value;
        if (newHandle.trim().length === 0) return;

        await chatRoomClient.send("set-handle", {
            newHandle,
            jwt,
        });

        setUserHandle(newHandle);
        setShowEdit(false);
    };

    const sendMessageToChatRoom = async (client, chatInput) => {
        const jwt = localStorage.getItem("pop-access-token");

        const message = chatInput.current.value;
        if (message.trim().length === 0) return;

        console.log("Sending message with", client);

        await client.send("message", {
            jwt,
            message: message,
        });

        // chatOutAudio.play();

        // Clear the chatbox
        chatInput.current.value = "";
    };

    const handleChatEnterKeypress = event => {
        if (event.key === "Enter") {
            sendMessageToChatRoom(chatRoomClient, chatInput);
        }
    };

    const getHandleDisplay = chatHandle => {
        if (!chatHandle) return "";

        chatHandle = chatHandle.trim();
        let formattedHandle;

        if (chatHandle?.length > 22) {
            formattedHandle = `${chatHandle.slice(0, 6)}...${chatHandle.slice(chatHandle.length - 6, chatHandle.length)}`;
        } else {
            formattedHandle = chatHandle;
        }

        return formattedHandle;
    };

    useEffect(() => {
        // Load Chat info about this user
        if (!userHandle) getUserHandle();

        // Watch for enter
        chatInput.current.addEventListener("keypress", handleChatEnterKeypress);

        // Remove the bit that was watching for the keypress
        return () => {
            chatInput.current?.removeEventListener("keypress", handleChatEnterKeypress);
        };
    }, [chatRoomClient]);

    function useChatScroll(dep) {
        const ref = useRef();
        useEffect(() => {
            if (ref.current) {
                ref.current.scrollTop = ref.current.scrollHeight;
            }
        }, [dep]);
        return ref;
    }

    return (
        <div className={`chat-box ${boxHidden ? "chat-box-hidden" : ""}`}>
            <div className="set-handle-container">
                <div
                    className={`chatbox-button ${boxHidden ? "chatbox-button-left" : "chatbox-button-right"}`}
                    onClick={() => {
                        setBoxHidden(!boxHidden);
                    }}
                >
                    <img src={arrowRight} />
                </div>
                <div className="your-name-container">
                    {!showEdit && (
                        <>
                            <p>{getHandleDisplay(uname || userHandle)}</p>
                            <div className="edit-image" onClick={() => setShowEdit(true)}></div>
                        </>
                    )}
                    {showEdit && (
                        <>
                            <input type="text" id="handle" defaultValue={uname || userHandle} />
                            <div className="check-image" onClick={setHandle}></div>
                        </>
                    )}
                </div>
            </div>
            <div className="send-message">
                <div className="input-container">
                    <input ref={chatInput} id="chat-message" placeholder="type here"></input>
                </div>
            </div>
            <div className="messages" id="messages" ref={ref}>
                <div className="message-container">
                    {messages &&
                        messages.map((chatMessage, index) => {
                            return (
                                <div key={index} className="message-body">
                                    <div className="avatar-image"></div>
                                    <div className="message-text">
                                        <p className="player-name">{getHandleDisplay(chatMessage.chatHandle)}</p>
                                        <p className="player-message">{chatMessage.message}</p>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>
        </div>
    );
}

export default ChatBox;
