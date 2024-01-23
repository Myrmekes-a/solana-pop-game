import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import Modal from "react-bootstrap/Modal";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Slider from "@mui/material/Slider";
import VolumeUpRounded from "@mui/icons-material/VolumeUpRounded";
import VolumeDownRounded from "@mui/icons-material/VolumeDownRounded";
import { setMusicVolume, setSoundVolume } from "../store/slices/appSlice";
import "../assets/styles/signup.css";

export default function AudioSettings({ show, onHide }) {
    const dispatch = useDispatch();
    const musicVolume = useSelector(state => state.app.musicVolume);
    const soundVolume = useSelector(state => state.app.soundVolume);

    const [musicValue, setMusicValue] = useState(musicVolume);
    const [soundValue, setSoundValue] = useState(soundVolume);

    useEffect(() => {
        setMusicValue(musicVolume);
        setSoundValue(soundVolume);
    }, [show]);

    const handleMusicChange = (event, newValue) => {
        dispatch(setMusicVolume(newValue));
    };

    const handleSoundChange = (event, newValue) => {
        dispatch(setSoundVolume(newValue));
    };

    const handleSave = () => {
        onHide();
    };

    const handleHide = () => {
        dispatch(setMusicVolume(musicValue));
        dispatch(setSoundVolume(soundValue));
        onHide();
    };

    return (
        <Modal show={show} onHide={handleHide} aria-labelledby="contained-modal-title-vcenter" centered>
            <div className="layout"></div>

            <div className="signup-container d-flex flex-column">
                <Box sx={{ width: "100%" }}>
                    <Stack spacing={2}>
                        <Stack direction="row" spacing={2}>
                            <Stack spacing={2}>
                                <span className="fw-bold text-white">Music</span>
                                <span className="fw-bold text-white">Sound</span>
                            </Stack>

                            <Stack sx={{ width: "100%" }}>
                                <Stack spacing={2} direction="row" sx={{ mb: 1, px: 1 }} alignItems="center">
                                    <VolumeDownRounded htmlColor={"rgba(255,255,255,1)"} />
                                    <Slider
                                        aria-label="Volume"
                                        value={musicVolume}
                                        sx={{
                                            color: "#fff",
                                            "& .MuiSlider-track": {
                                                border: "none",
                                                backgroundColor: "#DD525B",
                                            },
                                            "& .MuiSlider-thumb": {
                                                width: 24,
                                                height: 24,
                                                backgroundColor: "#DD525B",
                                                "&:before": {
                                                    boxShadow: "0 4px 8px rgba(0,0,0,0.4)",
                                                },
                                                "&:hover, &.Mui-focusVisible, &.Mui-active": {
                                                    boxShadow: "none",
                                                },
                                            },
                                        }}
                                        onChange={handleMusicChange}
                                    />
                                    <VolumeUpRounded htmlColor={"rgba(255,255,255,1)"} />
                                </Stack>

                                <Stack spacing={2} direction="row" sx={{ mb: 1, px: 1 }} alignItems="center">
                                    <VolumeDownRounded htmlColor={"rgba(255,255,255,1)"} />
                                    <Slider
                                        aria-label="Volume"
                                        value={soundVolume}
                                        sx={{
                                            color: "#fff",
                                            "& .MuiSlider-track": {
                                                border: "none",
                                                backgroundColor: "#DD525B",
                                            },
                                            "& .MuiSlider-thumb": {
                                                width: 24,
                                                height: 24,
                                                backgroundColor: "#DD525B",
                                                "&:before": {
                                                    boxShadow: "0 4px 8px rgba(0,0,0,0.4)",
                                                },
                                                "&:hover, &.Mui-focusVisible, &.Mui-active": {
                                                    boxShadow: "none",
                                                },
                                            },
                                        }}
                                        onChange={handleSoundChange}
                                    />
                                    <VolumeUpRounded htmlColor={"rgba(255,255,255,1)"} />
                                </Stack>
                            </Stack>
                        </Stack>

                        <Stack>
                            <button type="button" className="btn connect-btn text-white text-center mx-auto w-25" onClick={handleSave}>
                                OK
                            </button>
                        </Stack>
                    </Stack>
                </Box>
            </div>

            <span className="position-absolute end-0 p-2" onClick={handleHide}>
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
