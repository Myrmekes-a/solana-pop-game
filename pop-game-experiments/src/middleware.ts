import jwt from "jsonwebtoken";
import { Request } from "express";
import { logger } from "./logger";
import { JWT_SECRET } from "./config";

/// Extended Request interfact which applied auth middleware
/// has wallet field from authToken
export interface APIRequest extends Request {
    wallet?: string;
}

// Express middleware
export function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token || token == "null") return res.sendStatus(401);

    try {
        jwt.verify(token, JWT_SECRET as string, (err: any, payload: any) => {
            if (!payload) return res.sendStatus(403);
            req.wallet = payload.publicKey;

            if (err) return res.sendStatus(403);

            next();
        });
    } catch (e) {
        logger.error("@authenticateToken:", "jwt verify failed");
        res.sendStatus(403);
    }
}
