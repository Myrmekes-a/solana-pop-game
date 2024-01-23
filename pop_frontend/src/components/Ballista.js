import { useState, useEffect } from "react";
import ballista from "../data/ballista";

function Ballista({ ballistaId, fireTrigger, rotate, className }) {
    const [animationRunning, setAnimationRunning] = useState(false);
    const [currentBallistaFrame, setCurrentBallistaFrame] = useState();

    const runFireBallistaAnimation = frameNumber => {
        if (frameNumber === ballista.firingFrames.length) {
            setAnimationRunning(false);
            return;
        }

        const nextFrame = ballista.firingFrames[frameNumber];
        setCurrentBallistaFrame(nextFrame);

        setTimeout(() => {
            runFireBallistaAnimation(frameNumber + 1);
        }, 60);
    };

    useEffect(() => {
        if (!animationRunning && fireTrigger !== 0) {
            setAnimationRunning(true);

            runFireBallistaAnimation(0);
        }
    }, [fireTrigger, currentBallistaFrame]);

    return (
        <img
            id={ballistaId}
            src={animationRunning ? currentBallistaFrame : ballista.img}
            style={{
                maxWidth: "50px",
                scale: "2.5",
                transform: `rotate(${rotate}deg)`,
            }}
            className={className}
        />
    );
}

export default Ballista;
