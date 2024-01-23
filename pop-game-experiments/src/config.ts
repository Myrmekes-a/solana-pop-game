import { Keypair } from "@solana/web3.js";

export const PORT = process.env.PORT;

/// Auth
export const JWT_SECRET = process.env.SECRET;

export const DEFAULT_USER_COUNT_PER_PAGE = 25;

/// Signup
export const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
export const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
export const REDIRECT_URL = process.env.DISCORD_REDIRECT_URL;
export const CONNECTION_URL = process.env.DISCORD_SIGNUP_URL;
export const redirect = encodeURIComponent(REDIRECT_URL);

/// Solana
export const SOLANA_PRC_URL = process.env.RPC_URL;
export const popKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(process.env.TEST_WALLET!))
);

/// Gameconfig record/object
export const GAME_WORLD_WIDTH = 832;
export const GAME_WORLD_HEIGHT = 832;
export const GAME_WALL_WIDTH = 55;
export const GAME_PATCH_RATE = 16;

/// Game Room
export const BALLOON_SPEED = 3;
export const BALLOON_POSITION_DELTA = 50;
export const BALLOON_COLLISION_RADIUS = 17;
export const MAX_PLAYER_BALLOON_COUNT = 10;

export const DART_FIRE_TIME = 3000; // Launch darts every 3s

export const MAX_INACTIVE_ROUNDS_FOR_PLAYER = 2; // The maximum number of rounds a user can sit out, without getting kicked from the game
export const INCREASING_TIME = 1000; // Add more Seconds everytime somebody bets
export const START_INCREASING_TIME = 20000; // Add 20 Seconds when the 2nd player place bet
export const WINNER_SCREEN_PAUSE_TIME = 7000; // Winner result pause time

export const HOUSE_CUT = 0.05;
export const AFFILIATE_RAKE = 0.1;

/// Chat Room
export const MAX_CHAT_HISTORY_LEN = 20;
export const CHAT_HANDLE_SLICE_COUNT = 5;

// TODO: Add salt at some point
export const message = "pop!012345678901234567890123456789";
export const maxPlayerClients = 10; // Change this
export const leaderCount = 10; // Total to take for the leader boards
