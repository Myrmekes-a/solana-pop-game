import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { logger } from "../../logger";
import nacl from "tweetnacl";
import { request } from "undici";
import {
    CLIENT_ID,
    CLIENT_SECRET,
    CONNECTION_URL,
    JWT_SECRET,
    message,
    redirect,
    REDIRECT_URL,
} from "../../config";

import db from "../../database";

const doLogin = async (req: Request, resp: Response) => {
    let { publicKey, signature } = req.body;
    if (!publicKey || !signature) {
        return resp
            .status(400)
            .json({ err: "wallet or signature not provided" });
    }

    try {
        publicKey = new PublicKey(publicKey);
        const verified = nacl.sign.detached.verify(
            new TextEncoder().encode(message),
            bs58.decode(signature),
            publicKey.toBytes()
        );
        if (!verified) {
            return resp.status(400).json({ err: "Could not login" });
        }
    } catch (e) {
        logger.error(e);
        return resp.status(400).json({ err: e });
    }

    try {
        let userRecord = await db.user.findFirst({
            where: { wallet: publicKey.toBase58() },
        });

        if (!userRecord) {
            logger.info(
                `User ${publicKey.toBase58()} does not have a record yet. Creating`
            );

            userRecord = await db.user.create({
                data: {
                    wallet: publicKey.toBase58(),
                    balance: {
                        create: {
                            amount: 0,
                            type: "solana",
                            updatedAt: new Date(),
                        },
                    },
                },
            });
        }

        const accessToken = jwt.sign(
            { publicKey: publicKey.toBase58() },
            JWT_SECRET
        );

        return resp.status(200).json({ accessToken });
    } catch (e) {
        logger.error(e);
        return resp.status(500).json({ err: e });
    }
};

const loginDiscord = async (req: Request, resp: Response) => {
    resp.redirect(
        `https://discordapp.com/api/oauth2/authorize?client_id=${CLIENT_ID}&scope=identify&response_type=code&redirect_uri=${redirect}`
    );
};

const handleDiscordAuth = async (req: Request, resp: Response) => {
    const { code } = req.query;

    if (!code) {
        logger.error("NoCodeProvided");
        resp.status(500).json({ err: "NoCodeProvided" });
        return;
    }
    try {
        const tokenResponseData = await request(
            "https://discord.com/api/oauth2/token",
            {
                method: "POST",
                body: new URLSearchParams({
                    client_id: CLIENT_ID,
                    client_secret: CLIENT_SECRET,
                    code: code as string,
                    grant_type: "authorization_code",
                    redirect_uri: REDIRECT_URL,
                    scope: "identify",
                }).toString(),
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );

        const oauthData = await tokenResponseData.body.json();
        // logger.log(oauthData);
        //         const userResult = await request('https://discord.com/api/users/@me', {
        //             headers: {
        //                 authorization: `${oauthData.token_type} ${oauthData.access_token}`,
        //             },
        //         });

        //         const resData =await userResult.body.json();
        //         logger.log(resData)

        resp.redirect(
            `${CONNECTION_URL}?discord_token=${oauthData.access_token}`
        );
    } catch (error) {
        // NOTE: An unauthorized token will not throw an error
        // tokenResponseData.statusCode will be 401
        logger.error(error);
        resp.status(500).json({ err: error });
    }
};

export default {
    doLogin,
    loginDiscord,
    handleDiscordAuth,
};
