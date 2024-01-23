import { range } from "lodash";
import Matter, { Engine } from "matter-js";
import { logger } from "../logger";

import { PopGame } from "./popGame";
import { Dart } from "./popGameState";
import { DART_FIRE_TIME } from "../config";

const timeBetweenFires = DART_FIRE_TIME; // Time between when darts are fired

// Probably should go in their own file
// const rightWallOneDart = [180];
// const rightWallTwoDarts = [225, 315];
// const rightWallThreeDarts =
const topRightDartAngles = [225, 205, 245];

// const topWallOneDart = [90];
// const topWallTwoDarts = [135, 225];
// const topWallThreeDarts = [80, 135, 225];
const topLeftDartAngles = [135, 115, 155];

// const bottomWallOneDart = [0];
// const bottomWallTwoDarts = [315, 45];
// const bottomWallThreeDarts = [0, 315, 45];
const bottomLeftDartAngles = [45, 25, 65];

// const leftWallOneDart = [90];
// const leftWallTwoDarts = [135, 45];
// const leftWallThreeDarts = [90, 45, 135];
const bottomRightDartAngles = [315, 295, 335];

class DartManager {
    worldHeight: number;
    worldWidth: number;
    wallWidth: number;

    popGame: PopGame;

    completed = false;
    playingStartedAt: number;
    lastFiredAt: number;

    // This is not very elegant. But works for now
    singlesRound: number;
    doublesRound: number;
    tripplesRound: number;

    spikes = false;

    dartNumber: number = 0;

    constructor(
        popGame: PopGame,
        worldHeight: number,
        worldWidth: number,
        wallWidth: number,
        xOffset = 0,
        yOffset = 0
    ) {
        this.popGame = popGame;

        this.singlesRound = 6; // Fire four times
        this.doublesRound = 4;
        this.tripplesRound = 9999999999;

        this.worldHeight = worldHeight;
        this.worldWidth = worldWidth;
        this.wallWidth = wallWidth;
    }

    // Update state of the dart manager. Do anything you have to
    private update() {}

    run() {
        const now = new Date().getTime();
        const timeSinceLastFiring = this.lastFiredAt
            ? now - this.lastFiredAt
            : timeBetweenFires;

        // Time to fire
        if (timeSinceLastFiring >= timeBetweenFires) {
            // Fire singles
            if (this.singlesRound > 0) {
                this.singlesRound--;
                this.fireRandomWall(1);
            }

            if (this.doublesRound > 0 && this.singlesRound == 0) {
                this.doublesRound--;
                this.fireRandomWall(2);
            }

            if (
                this.tripplesRound > 0 && // Not elegant lol
                this.singlesRound == 0 &&
                this.doublesRound == 0
            ) {
                this.tripplesRound--;
                this.fireRandomWall(3);
            }

            this.lastFiredAt = now;
        }
    }

    isCompleted() {
        return this.completed;
    }

    getSetFiringPositions() {}

    // Hard coded stuff for walls
    getTopLeftCorner() {
        return {
            label: "topLeftCorner",
            x: this.wallWidth + 5,
            y: this.wallWidth + 5,
            angles: topLeftDartAngles,
        };
    }

    getTopRightCorner() {
        return {
            label: "topRightCorner",
            x: this.wallWidth + this.worldWidth - 5,
            y: this.wallWidth + 5,
            angles: topRightDartAngles,
        };
    }

    getBottomRightCorner() {
        return {
            label: "bottomRightCorner",
            x: this.wallWidth + this.worldWidth - 5,
            y: this.wallWidth + this.worldHeight - 5,
            angles: bottomRightDartAngles,
        };
    }

    getBottomLeftCorner() {
        return {
            label: "bottomLeftCorner",
            x: this.wallWidth - 5,
            y: this.wallWidth + this.worldHeight - 5,
            angles: bottomLeftDartAngles,
        };
    }

    fireRandomWall(numberOfDarts: number) {
        const wall = this.getRandomWallPosition();

        const angles =
            numberOfDarts == 2 ? [...wall.angles.slice(1)] : [...wall.angles];
        const darts = range(numberOfDarts).map((idx) => {
            return {
                x: wall.x,
                y: wall.y,
                angle: angles.shift(),
                originLabel: wall.label,
            };
        });

        this.fireDarts(darts);
    }

    fireDarts(
        darts: { x: number; y: number; angle: number; originLabel: string }[]
    ) {
        const dartBodies = darts.map((dart) => {
            return this.fireDart(
                dart.x,
                dart.y,
                dart.angle,
                false,
                dart.originLabel
            );
        });
        Matter.Composite.add(this.popGame.world, dartBodies);
    }

    getVectorsFromUnitAngle(angle: number) {
        let xCorrection = 1;
        let yCorrection = -1;

        // Second Quadrant
        if (angle > 90 && angle < 180) {
            // adjustedAngle = angle - 45;
        } else if (angle >= 180 && angle < 270) {
            // Third Quad
            // adjustedAngle = angle - 180;
            yCorrection = -1;
        } else if (angle > 270) {
            // adjustedAngle = angle - 270;
        } else {
            // adjustedAngle = angle;
        }
        return {
            x: Math.sin(angle * (Math.PI / 180)) * xCorrection,
            y: Math.cos(angle * (Math.PI / 180)) * yCorrection,
        };
    }

    // TODO: Refactor for less parameters
    fireDart(
        x: number,
        y: number,
        angle: number,
        single = false,
        origin = null
    ) {
        const vectors = this.getVectorsFromUnitAngle(angle);

        const dartLabel = `dart_${this.dartNumber}_${origin}`;
        const dart = Matter.Bodies.rectangle(x, y, 5, 50, {
            isStatic: false,
            restitution: 0,
            force: { x: vectors.x * 10, y: vectors.y * 10 },
            mass: 1000,
            friction: 0,
            frictionAir: 0,
            frictionStatic: 0,
            label: dartLabel,
            collisionFilter: {
                category: 0b100,
                mask: 0b1,
                group: 0,
            },
        });

        // TODO: Combine classes that have a matterjs body
        // and also have a schema
        this.popGame.darts[dart.label] = dart; // These are the Matter JS bodies.
        this.popGame.state.darts[dart.label] = new Dart(
            dartLabel,
            x,
            y,
            dart.velocity.x,
            dart.velocity.y,
            angle
        );

        this.dartNumber++;

        Matter.Body.rotate(dart, angle);
        if (single) Matter.Composite.add(this.popGame.world, dart);

        return dart;
    }

    // Returns one of the four predefined wall positions
    getRandomWallPosition() {
        const roll = Math.floor(Math.random() * 4);

        switch (roll) {
            case 0: {
                return this.getTopLeftCorner();
            }
            case 1: {
                return this.getTopRightCorner();
            }
            case 2: {
                return this.getBottomRightCorner();
            }
            case 3: {
                return this.getBottomLeftCorner();
            }
        }
    }

    removeDart(label: string) {
        const dartBody = this.popGame.darts[label]; // These are the Matter JS bodies.
        if (!dartBody) return;

        Matter.Composite.remove(this.popGame.world, dartBody);

        delete this.popGame.darts[label];
        this.popGame.state.darts.delete(label);
    }

    reset() {
        // logger.info("Resetting dart manager");

        this.singlesRound = 6;
        this.doublesRound = 4;
        this.tripplesRound = 9999999999;
    }
}
export default DartManager;
