import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Response } from "express";
import { logger } from "../../logger";

import Credits from "../../database/credits";
import { APIRequest } from "../../middleware";

// Returns the current credits for the user
const get = async (req: APIRequest, resp: Response) => {
    if (!req.wallet) {
        return resp.status(400).json({ err: "Invalid auth token" });
    }

    try {
        const credits = await Credits.getBalance(req.wallet);

        return resp.status(200).json(credits);
    } catch (e) {
        logger.error(` - @ getCredits: ${e}`);
        return resp.status(500).json({ err: e });
    }
};

const getHistory = async (req: APIRequest, resp: Response) => {
    if (!req.wallet) {
        return resp.status(400).json({ err: "Invalid auth token" });
    }

    try {
        const history = await Credits.getHistory(req.wallet);

        return resp.status(200).json({ history: history.history });
    } catch (e) {
        logger.error(` - @ getHistory: ${e}`);
        return resp.status(500).json({ err: e });
    }
};

const deposit = async (req: APIRequest, resp: Response) => {
    if (!req.wallet) {
        return resp.status(400).json({ err: "Invalid auth token" });
    }

    const { creditDepositAmount, tx } = req.body;
    if (!creditDepositAmount || !tx) {
        return resp.status(400).json({ err: "Invalid amount or tx" });
    }

    const depositAmount = Number(creditDepositAmount) * LAMPORTS_PER_SOL;

    try {
        const result = await Credits.deposit(
            req.wallet,
            depositAmount,
            req.body.tx
        );

        return resp.status(200).json(result);
    } catch (e: any) {
        logger.error(e.message);

        return resp.status(500).json(e);
    }
};

const withdraw = async (req: APIRequest, resp: Response) => {
    if (!req.wallet) {
        return resp.status(400).json({ err: "Invalid auth token" });
    }

    const userWallet = req.wallet;
    const withdrawAmount = Number(req.body.withdrawAmount);

    try {
        const withdrawResult = await Credits.withdraw(
            userWallet,
            withdrawAmount
        );
        return resp.status(200).json(withdrawResult);
    } catch (e: any) {
        logger.error(e.message);

        return resp.status(500).json(e);
    }
};

export default {
    get,
    deposit,
    withdraw,
    getHistory,
};
