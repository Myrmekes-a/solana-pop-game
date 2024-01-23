import { useState, useEffect } from "react";
import Phaser from "phaser";
import { ItemPositionFeed } from "../utils/ItemPositionFeed";
import arrow from "../assets/img/arrow.webp";

function Dart({ dart, coordinates }) {
    const [motionStarted, setMotionStarted] = useState();
    const [x, setX] = useState();
    const [y, setY] = useState();

    const itemPosFeed = ItemPositionFeed.getItemPositionFeed();

    const getDartVisibility = (dart, coordinates) => {
        const insideLeftAndRight = dart.x + coordinates.left + 50 < coordinates.right && dart.x + coordinates.left - 50 > coordinates.left;
        const insideTopAndBottom = dart.y + coordinates.top + 50 < coordinates.bottom && dart.y + coordinates.top - 50 > coordinates.top;

        if (insideLeftAndRight && insideTopAndBottom) {
            return "block";
        } else {
            return "none";
        }
    };

    useEffect(() => {}, [x, y]);

    // Motion
    let lastMotionUpdateAt;
    const patchUpdate = 50; // 50 ms????

    // TODO: Improve this logic
    const animateDartMotion = requestAt => {
        if (!lastMotionUpdateAt) lastMotionUpdateAt = requestAt;

        const timeSinceLastUpdate = requestAt - lastMotionUpdateAt;
        if (timeSinceLastUpdate > patchUpdate) {
            lastMotionUpdateAt = requestAt;
        } else {
            // Should interpolate
            const positionPair = itemPosFeed.getLastPositionPair(dart.label);

            const t = (requestAt - lastMotionUpdateAt) / patchUpdate;

            const lerpX = Phaser.Math.Interpolation.Linear([positionPair[0].x, positionPair[1].x], t);
            const lerpY = Phaser.Math.Interpolation.Linear([positionPair[0].y, positionPair[1].y], t);

            setX(lerpX);
            setY(lerpY);
        }

        // If there's more frames keep going
        requestAnimationFrame(animateDartMotion);
    };

    if (itemPosFeed.getBufferDepth(dart.label) > 20 && !motionStarted) {
        setMotionStarted(true);
        requestAnimationFrame(animateDartMotion);

        console.log("Starting Dart motion");
    }

    return (
        <div>
            <div
                style={{
                    height: "50px",
                    width: "5px",
                    transition: "all 0.07s",
                    transformOrigin: "top left",
                    transform: `translate(${dart.x}px, ${dart.y}px) rotate(${dart.angle * (Math.PI / 180)}rad)`,
                    position: "absolute",
                    display: `${getDartVisibility(dart, coordinates)}`,
                }}
            ></div>
            <img
                key={`${dart.label}`}
                className={"dart"}
                style={{
                    transition: "all 0.07s",
                    transformOrigin: "top left",
                    transform: `translate(${dart.x}px, ${dart.y}px) rotate(${dart.angle * (Math.PI / 180)}rad)`,
                    position: "absolute",
                    height: "50px",
                    minWidth: "5px",
                    display: `${getDartVisibility(dart, coordinates)}`,
                }}
                src={arrow}
                alt="dart"
            />
        </div>
    );
}

export default Dart;
