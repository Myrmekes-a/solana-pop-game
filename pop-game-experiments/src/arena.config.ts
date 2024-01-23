import Arena from "@colyseus/arena";
import { monitor } from "@colyseus/monitor";
import cors from "cors";
import express from "express";
import { logger } from "./logger";
import path from "path";
import serveIndex from "serve-index";

// Import demo room handlers
import { PopChatRoom } from "./rooms/PopChatRoom";
import { PopGameRoom } from "./rooms/PopGameRoom";

import {
    AuthController,
    CreditsController,
    SolanaController,
    UsersController,
} from "./controllers";
import { authenticateToken } from "./middleware";

(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

export default Arena({
    getId: () => "Pop!",

    // TODO: Read about this
    // initializeTransport: (options) => new uWebSocketsTransport(options),

    initializeGameServer: (gameServer) => {
        // PopChatRoom
        gameServer.define("pop-global", PopChatRoom).enableRealtimeListing();

        // Different Pop Game rooms
        // TODO: Make some kind of game config records
        gameServer
            .define("pop_0_1a", PopGameRoom, { balloonPrice: 0.1 })
            .enableRealtimeListing();
        gameServer
            .define("pop_0_1b", PopGameRoom, { balloonPrice: 0.1 })
            .enableRealtimeListing();
        gameServer
            .define("pop_0_25a", PopGameRoom, { balloonPrice: 0.25 })
            .enableRealtimeListing();
        gameServer
            .define("pop_0_25b", PopGameRoom, { balloonPrice: 0.25 })
            .enableRealtimeListing();
        gameServer
            .define("pop_0_5", PopGameRoom, { balloonPrice: 0.5 })
            .enableRealtimeListing();
        gameServer
            .define("pop_1_0", PopGameRoom, { balloonPrice: 1.0 })
            .enableRealtimeListing();
        gameServer
            .define("pop_2_0", PopGameRoom, { balloonPrice: 2.0 })
            .enableRealtimeListing();
        gameServer
            .define("pop_5_0", PopGameRoom, { balloonPrice: 5.0 })
            .enableRealtimeListing();
        gameServer
            .define("pop_10_0", PopGameRoom, { balloonPrice: 10.0 })
            .enableRealtimeListing();

        gameServer.onShutdown(function () {
            logger.warn(`🧨 Game Server is Going down.`);
        });
    },

    initializeExpress: (app) => {
        app.use(cors({ origin: "*" }));

        /// Signin or Create empty user by wallet address to get authToken
        app.post("/api/doLogin", AuthController.doLogin);
        app.post(
            "/api/signUp",
            authenticateToken,
            UsersController.createMyProfile
        );

        app.get("/api/discord/login", AuthController.loginDiscord);
        app.get("/api/discord/callback", AuthController.handleDiscordAuth);

        // Other Stuff
        // Returns the owners wallet balance in lamports
        app.get(
            "/api/solanaBalance",
            authenticateToken,
            SolanaController.getWalletBalance
        );
        app.get(
            "/api/recentBlockhash",
            authenticateToken,
            SolanaController.getRecentBlockhash
        );

        app.get("/api/me", authenticateToken, UsersController.findMe);
        app.get(
            "/api/allUsers",
            authenticateToken,
            UsersController.getUserListForLeaderboard
        );

        /// Profile Endpoints
        // TODO: may need to change this endpoint to socket event
        // Just left as apis for testing purpose
        app.get(
            "/api/myProfile",
            authenticateToken,
            UsersController.getMyProfile
        );
        app.get("/api/profileByWallet", UsersController.getProfileByWallet);
        app.get("/api/profileByUserName", UsersController.getProfileByUserName);
        app.put(
            "/api/myProfile",
            authenticateToken,
            UsersController.updateMyProfile
        );

        /// Affiliate Endpoints
        app.post(
            "/api/inviteTo",
            authenticateToken,
            UsersController.createUserInvitation
        );
        app.delete(
            "/api/inviteTo",
            authenticateToken,
            UsersController.removeUserInvitation
        );
        app.get("/api/invitesFrom", UsersController.getUserInvitesFrom);
        app.get("/api/invitesTo", UsersController.getUserInvitesTo);

        // Credit System
        app.get("/api/credits", authenticateToken, CreditsController.get); // Get the credits for signed in user
        app.post("/api/credits", authenticateToken, CreditsController.deposit);
        app.post(
            "/api/credits/withdraw",
            authenticateToken,
            CreditsController.withdraw
        );
        app.get(
            "/api/credits/history",
            authenticateToken,
            CreditsController.getHistory
        );

        app.use(
            "/",
            serveIndex(path.join(__dirname, "static"), { icons: true })
        );
        app.use("/", express.static(path.join(__dirname, "static"))); // Probably should remove this

        // (optional) attach web monitoring panel
        app.use("/colyseus", monitor());
    },

    beforeListen: () => {
        /**
         * Before before gameServer.listen() is called.
         */
        logger.info(`🎈 Pop Game server is about to start`);
    },
});
