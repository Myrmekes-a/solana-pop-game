import { useState, useRef, useEffect } from "react";
import Phaser from "phaser";
import balloonAssets from "../data/balloons";
import { ItemPositionFeed } from "../utils/ItemPositionFeed";

const msPerFrame = 20;

function Balloon({ balloon }) {
    const balloonEle = useRef();
    const [animationStarted, setAnimationStarted] = useState();
    const [motionStarted, setMotionStarted] = useState();
    const [x, setX] = useState();
    const [y, setY] = useState();

    const loadedImages = [];

    let imageUrls = [
        balloonAssets[`${balloon.color}Balloon`].poppingFrames.frame1,
        balloonAssets[`${balloon.color}Balloon`].poppingFrames.frame2,
        balloonAssets[`${balloon.color}Balloon`].poppingFrames.frame3,
        balloonAssets[`${balloon.color}Balloon`].poppingFrames.frame4,
        balloonAssets[`${balloon.color}Balloon`].poppingFrames.frame5,
        balloonAssets[`${balloon.color}Balloon`].poppingFrames.frame6,
        balloonAssets[`${balloon.color}Balloon`].poppingFrames.frame7,
        balloonAssets[`${balloon.color}Balloon`].poppingFrames.frame8,
        balloonAssets[`${balloon.color}Balloon`].poppingFrames.frame9,
        balloonAssets[`${balloon.color}Balloon`].poppingFrames.frame10,
    ];

    preloadImages(imageUrls, function (images) {
        // do something with the loaded images
        for (let i = 0; i < images.length; i++) {
            loadedImages[i] = images[i];
        }
    });

    function preloadImages(imageUrls, callback) {
        var loaded = 0;
        var images = [];

        function imageLoaded() {
            loaded++;
            if (loaded === imageUrls.length) {
                callback(images);
            }
        }

        for (var i = 0; i < imageUrls.length; i++) {
            var img = new Image();
            img.onload = imageLoaded;
            img.onerror = imageLoaded;
            img.src = imageUrls[i];
            images.push(img);
        }
    }

    const getBalloonImage = balloon => {
        return balloon.color === "red"
            ? balloonAssets.redBalloon.img
            : balloon.color === "blue"
            ? balloonAssets.blueBalloon.img
            : balloon.color === "pink"
            ? balloonAssets.pinkBalloon.img
            : balloon.color === "yellow"
            ? balloonAssets.yellowBalloon.img
            : balloon.color === "purple"
            ? balloonAssets.purpleBalloon.img
            : balloon.color === "green"
            ? balloonAssets.greenBalloon.img
            : balloon.color === "orange"
            ? balloonAssets.orangeBalloon.img
            : balloon.color === "robot"
            ? balloonAssets.robotBalloon.img
            : balloon.color === "solana"
            ? balloonAssets.solanaBalloon.img
            : balloonAssets.gradientBalloon.img;
    };

    const getPoppingFrame = (balloonColor, currentPoppingFrame) => {
        if (typeof balloonColor !== "string") return;
        if (loadedImages.length === 0) return;

        const coloredBalloonAssets = balloonAssets[`${balloonColor}Balloon`];
        const poppingFrames = coloredBalloonAssets.poppingFrames;

        return loadedImages[currentPoppingFrame - 1].src;
    };

    const itemPosFeed = ItemPositionFeed.getItemPositionFeed();

    // Popping
    let lastUpdatedAt;
    let timeSinceLastUpdate;
    let poppingFrame = 1;

    const runBalloonPopAnimation = requestAt => {
        if (!balloonEle.current || poppingFrame > imageUrls.length) return;

        if (!lastUpdatedAt) lastUpdatedAt = requestAt;

        timeSinceLastUpdate = requestAt - lastUpdatedAt;

        if (timeSinceLastUpdate > msPerFrame) {
            const balloonPoppingFrame = getPoppingFrame(balloon.color, poppingFrame);
            balloonEle.current.src = balloonPoppingFrame;

            poppingFrame += 1;
            lastUpdatedAt = requestAt;
        }

        if (poppingFrame <= imageUrls.length) {
            requestAnimationFrame(runBalloonPopAnimation);
        }
    };

    if (balloon.balloonState !== "unpopped" && !animationStarted) {
        console.log("popping:", balloon.label);
        setAnimationStarted(true);
        requestAnimationFrame(runBalloonPopAnimation);
    }

    useEffect(() => {
        document.addEventListener("visibilitychange", () => {});
    }, [x, y]);

    // Motion
    let lastMotionUpdateAt;
    const patchUpdate = 50; // 50 ms????

    const animateBalloonMotion = requestAt => {
        if (!lastMotionUpdateAt) lastMotionUpdateAt = requestAt;

        const timeSinceLastUpdate = requestAt - lastMotionUpdateAt;

        if (timeSinceLastUpdate > patchUpdate) {
            const positionUpdate = itemPosFeed.consumePositionDelta(balloon.label);

            // Was getting the wrong update?

            lastMotionUpdateAt = requestAt;
        } else {
            // Should interpolate
            const positionPair = itemPosFeed.getLastPositionPair(balloon.label);

            const t = (requestAt - lastMotionUpdateAt) / patchUpdate;

            const lerpX = Phaser.Math.Interpolation.Linear([positionPair[0].x, positionPair[1].x], t);
            const lerpY = Phaser.Math.Interpolation.Linear([positionPair[0].y, positionPair[1].y], t);

            setX(lerpX);
            setY(lerpY);
        }

        // If there's more frames keep going
        requestAnimationFrame(animateBalloonMotion);
    };

    if (itemPosFeed.getBufferDepth(balloon.label) > 20 && !motionStarted) {
        setMotionStarted(true);
        requestAnimationFrame(animateBalloonMotion);
        console.log("Starting balloon motion");
    }

    return (
        <div>
            <div
                style={{
                    height: "34px",
                    width: "34px",
                    borderRadius: "17px",
                    translate: `${balloon.x - 17}px ${balloon.y - 17}px`,
                    transition: "all 0.07s",
                    zIndex: 1000000,
                    position: "absolute",
                }}
            ></div>
            <img
                ref={balloonEle}
                key={`${balloon.label}`}
                id={`${balloon.label}`}
                className={"balloon"}
                alt=""
                style={{
                    transition: "all 0.07s",
                    position: "absolute",
                    height: "102px",
                    translate: `${balloon.x - 50}px ${balloon.y - 43}px`,
                }}
                src={balloon.balloonState !== "unpopped" ? getPoppingFrame(balloon.color, 1) : getBalloonImage(balloon)}
            ></img>
        </div>
    );
}

export default Balloon;
