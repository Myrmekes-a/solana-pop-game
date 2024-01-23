import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

import { PopBalloon, PopInactivePlayer, PopPlayer } from "./popPlayer";

export const PopGameStates = {
    initializing: "initializing",
    starting: "starting",
    betting: "betting",
    running: "running", // The round is running
    intermission: "intermission", // The summary time after a round has run
    gameOver: "game-over",
};

export class Velocity extends Schema {
    @type("number")
    x: number;
    @type("number")
    y: number;

    constructor(x: number, y: number) {
        super();

        this.x = x;
        this.y = y;
    }
}

export const BalloonState = {
    unpopped: 1,
    popping: 2,
    popped: 3,
};

export class Dart extends Schema {
    @type("number")
    x: number = 0;
    @type("number")
    y: number = 0;
    @type("string")
    label: string;

    @type("number")
    angle: number;

    @type(Velocity)
    velocity: Velocity;

    constructor(
        label: string,
        x: number,
        y: number,
        vectorX: number,
        vectorY: number,
        angle: number
    ) {
        super();

        this.label = label;
        this.x = x;
        this.y = y;

        this.velocity = new Velocity(vectorX, vectorY);
        this.angle = angle;
    }
}

export class WorldDimensions extends Schema {
    @type("number")
    width: number;

    @type("number")
    height: number;

    constructor(width: number, height: number) {
        super();

        this.width = width;
        this.height = height;
    }
}

// This class is a colyseus thing and automagically sends info to the client
export class PopGameState extends Schema {
    @type("string")
    currentGameState: string = PopGameStates.initializing;

    @type({ map: PopPlayer })
    players = new MapSchema<PopPlayer>();

    @type({ array: PopInactivePlayer })
    inactivePlayers = new ArraySchema<PopInactivePlayer>();

    @type({ map: PopBalloon })
    balloons = new MapSchema<PopBalloon>();

    @type("boolean")
    pauseGame: boolean = false;

    @type({ map: Dart })
    darts = new MapSchema<Dart>();

    @type("string")
    winningPlayer;

    @type("number")
    pricePerBalloon: number;

    @type(WorldDimensions)
    worldDimensions;

    @type("number")
    bettingEndsAt: number; // When betting is over

    @type("number")
    balloonPrice: number;

    @type("boolean")
    locked: boolean = false;
}
