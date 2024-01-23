import { Schema, type, MapSchema } from "@colyseus/schema";

import { BalloonState } from "./popGameState";

export const StartingBalloonColors = [
    "red",
    "yellow",
    "purple",
    "blue",
    "pink",
    "green",
    "orange",
    "robot",
    "gradient",
    "solana",
];

const PLAYER_HEIGHT = 100;
const PLAYER_WIDTH = 100;

export class PopPlayer extends Schema {
    // The number of the balloons the player starts with at the beginning of the round
    @type("number")
    startingBalloons: number = 0;

    // The starting balloons number decremented as they get poppe
    @type("number")
    remainingBalloons: number = 0;

    @type("number")
    credits: number;

    @type("string")
    sessionId: string;

    @type("string")
    balloonColor: string;

    @type("string")
    wallet: string;

    @type("string")
    chatHandle: string;

    @type("number")
    inactiveRounds: number = 0;

    constructor(
        sessionId: string,
        balloonColor: string,
        startingBalloons: number,
        remainingBallons: number,
        chatHandle: string,
        inactiveRounds: number,
        wallet: string
    ) {
        super();

        this.sessionId = sessionId;
        this.balloonColor = balloonColor;
        this.startingBalloons = startingBalloons;
        this.remainingBalloons = remainingBallons;
        this.chatHandle = chatHandle;
        this.inactiveRounds = inactiveRounds;
        this.wallet = wallet;
    }
}

export class PopInactivePlayer extends Schema {
    @type("string")
    sessionId: string;

    @type("string")
    wallet: string;

    constructor(sessionId: string, wallet: string) {
        super();

        this.sessionId = sessionId;
        this.wallet = wallet;
    }
}

export class PopBalloon extends Schema {
    @type("number")
    x;

    @type("number")
    y;

    @type("number")
    height;

    @type("number")
    width;

    @type("number")
    angle;

    @type("number")
    balloonState;

    // @type("boolean")
    // popped: boolean = false;

    @type("string")
    label: string;

    @type(PopPlayer)
    owner: PopPlayer;

    constructor(label: string, owner: PopPlayer, x: number, y: number) {
        super();

        this.x = x;
        this.y = y;
        this.label = label;
        this.balloonState = BalloonState.unpopped;
        this.owner = owner;
    }
}
