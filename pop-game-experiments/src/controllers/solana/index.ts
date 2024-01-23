import { PublicKey } from "@solana/web3.js";
import { Response } from "express";
import { logger } from "../../logger";

import solana from "../../solana";

const getWalletBalance = async (req: any, res: Response) => {
    if (!req.wallet) {
        return res.status(400).json({ err: "Invalid auth token" });
    }

    try {
        const wallet = new PublicKey(req.wallet);
        const walletBalance = await solana.getBalance(wallet);

        return res.status(200).json({ solanaBalance: { walletBalance } });
    } catch (e) {
        logger.error(` - @ getRecentBlockhash: ${e}`);
        return res.status(500).json({ err: e });
    }
};

const getRecentBlockhash = async (req: any, res: Response) => {
    if (!req.wallet) {
        return res.status(400).json({ err: "Invalid auth token" });
    }

    try {
        const recentBlockash = await solana.getLatestBlockhash();

        return res.status(200).json(recentBlockash);
    } catch (e) {
        logger.error(` - @ getRecentBlockhash: ${e}`);
        return res.status(500).json({ err: e });
    }
};

export default {
    getWalletBalance,
    getRecentBlockhash,
};
