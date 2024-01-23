import {
    PublicKey,
    SystemProgram,
    Transaction,
    LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { orderBy, compact } from "lodash";
import { logger } from "../../logger";

import db from "..";
import Debits from "../debits";
import solana from "../../solana";
import { popKeypair } from "../../config";

const insufficientAmountError =
    "Could not debit account because of insuffient funds";

// Processes some deposit transaction
const deposit = async (
    userWallet: string,
    amount: number,
    encodedTx: string // Encoded transaction
) => {
    const userRecord = await db.user.findFirst({
        where: { wallet: userWallet },
        include: { balance: true },
    });

    // Create the Credit Record and set the tx sig
    const txSignature = await solana.sendEncodedTransaction(encodedTx);
    const pendingCredit = await db.credit.create({
        data: {
            amount,
            user: { connect: { id: userRecord.id } },
            balance: { connect: { id: userRecord.balance.id } },
            type: "deposit",
            txSignature: txSignature,
        },
    });

    // Attempt to send deposit transaction
    let attempts = 2;
    let confirmed = false;
    do {
        try {
            // If we can confirm the transaction, set the record to confirmed
            const result = await solana.confirmTransaction(
                txSignature,
                "processed"
            );

            // console.log("HERERELRKIJLJKD", result);

            if (result.value.err) {
                return { err: "Could not confirm transaction " };
            }

            confirmed = true;
        } catch (e) {
            logger.error("Failed to Deposit Transaction");
            attempts = attempts - 1;

            logger.error(e);
            logger.error("Attempts", attempts);

            if (attempts == 0) {
                // console.log("Could not confirm");
                return { err: "Could not confirm transaction " };
            }
        }
    } while (!confirmed && attempts > 0);

    // TODO: Fetch Transaction and make sure it says what it should
    // Fetch the Transaction and double check amout etc
    // Update the balance record
    const updatedBalance = await db.$transaction(async (tx) => {
        const user = await tx.user.findFirst({
            where: { wallet: userWallet },
            include: { balance: true },
        });
        let userBalance = user.balance;

        if (!user) {
            return { err: "Could not find user by wallet Address" };
        }

        if (!userBalance) {
            logger.info(
                `Balance does not exist for user ${userWallet}. Creating`
            );

            userBalance = await tx.balance.create({
                data: {
                    amount: 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    type: "solana",
                    user: {
                        connect: {
                            id: user.id,
                        },
                    },
                },
            });
        }

        const newBalance = Number(userBalance.amount) + amount;

        const updatedBalance = await tx.balance.update({
            where: { id: userBalance.id },
            data: { amount: newBalance, updatedAt: new Date() },
        });

        await db.credit.update({
            where: { id: pendingCredit.id },
            data: { confirmed: true, updatedAt: new Date() },
        });

        return { err: null, updatedBalance };
    });
    if (updatedBalance.err) return { err: updatedBalance.err };

    return { balance: updatedBalance.updatedBalance.amount };
};

// TODO: Refactor Deposti and Credit because they're pretty much the same
// thing
// This just straight updates the user balance in the database
const credit = async (
    // Deposit vs Credit terminology
    userWallet: string,
    amount: number,
    type: string = "credit",
    gameId?: number
) => {
    const userRecord = await db.user.findFirst({
        where: { wallet: userWallet },
        include: { balance: true },
    });

    // Update the balance record
    const updatedBalance = await db.$transaction(async (tx) => {
        const user = await tx.user.findFirst({
            where: { wallet: userWallet },
            include: { balance: true },
        });
        let userBalance = user.balance;

        if (!user) return { err: "Could not find user by wallet Address" };

        if (!userBalance) {
            logger.info(`Balance does not exist for user ${userWallet}`);
            userBalance = await tx.balance.create({
                data: {
                    amount: 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    type: "solana",
                    user: {
                        connect: {
                            id: user.id,
                        },
                    },
                },
            });

            const creditRecord = await db.credit.create({
                data: {
                    amount,
                    user: { connect: { id: userRecord.id } },
                    balance: { connect: { id: userBalance.id } },
                    type: type,
                    game: { connect: { id: gameId } },
                },
            });
        }

        const newBalance = Number(userBalance.amount) + amount;

        const updatedBalance = await tx.balance.update({
            where: { id: userBalance.id },
            data: { amount: newBalance, updatedAt: new Date() },
        });

        return { err: null, updatedBalance };
    });

    return { balance: updatedBalance.updatedBalance.amount };
};

// Withdraw a certain number of credits for a user
// TODO: Async job hook up stuff for this
// TODO: Set a minimum to withdraw
const withdraw = async (userWallet: string, withdrawAmount: number) => {
    if (typeof withdrawAmount !== "number") {
        return { err: "Withdraw amount is not a number!" };
    }
    let withdrawCreditAmount = Math.floor(withdrawAmount * LAMPORTS_PER_SOL);
    const userRecord = await db.user.findFirst({
        where: { wallet: userWallet },
        include: { balance: true },
    });

    if (!userRecord)
        return { err: `Could not find user Record for ${userWallet}` };

    const amount = await db.$transaction(async (tx) => {
        // Check Balance
        const userBalance = await getBalance(userWallet);
        if (userBalance.balance < withdrawCreditAmount) {
            // logger.debug(
            //     insufficientAmountError,
            //     userBalance,
            //     withdrawCreditAmount
            // );
            return { err: insufficientAmountError };
        }

        // Update the balance amount and create a debit record
        const remainingBalance =
            Number(userRecord.balance.amount) - withdrawCreditAmount;

        const userHasEnough = remainingBalance > 0;

        // User does not have enough to withdraw
        if (!userHasEnough) {
            logger.warn(
                `User does not have enough credits to withdraw`,
                userWallet,
                withdrawCreditAmount
            );
            return { err: "User does not have enough credits to withdraw" };
        }

        // Check Play Wallet Balance
        const vaultBalance = await solana.getBalance(popKeypair.publicKey);
        if (vaultBalance < withdrawCreditAmount)
            return { err: "Insufficient play wallet balance" };

        // Create the withdraw Record
        const withdrawRecord = await db.withdraw.create({
            data: {
                amount: BigInt(withdrawCreditAmount),
                // amount: { set: withdrawCreditAmount },
                user: { connect: { id: userRecord.id } },
                balance: { connect: { id: userRecord.balance.id } },
            },
        });
        // Update the Balance
        const updatedBalance = await db.balance.update({
            where: { id: userRecord.balance.id },
            data: {
                amount: remainingBalance,
                updatedAt: new Date(),
            },
        });

        return {
            err: null,
            withdrawCreditAmount,
            record: withdrawRecord,
            remainingBalance,
        };
    });

    // Do not transfer SOL if there is error while debit
    if (amount.err) return { err: amount.err };

    try {
        // Actually Send Sol
        const withdrawTx = new Transaction();
        const userPubkey = new PublicKey(userWallet);
        const transferIx = SystemProgram.transfer({
            fromPubkey: popKeypair.publicKey,
            toPubkey: userPubkey,
            lamports: withdrawCreditAmount,
        });
        withdrawTx.add(transferIx);

        const txSignature = await solana.sendTransaction(withdrawTx, [
            popKeypair,
        ]);
        await db.withdraw.update({
            where: { id: amount.record.id },
            data: { txSignature: txSignature, updatedAt: new Date() },
        });

        // Might want to add retries or soemthing on this one
        const result = await solana.confirmTransaction(
            txSignature,
            "processed"
        );
        if (!result.value.err) {
            await db.withdraw.update({
                where: { id: amount.record.id },
                data: {
                    txSignature: txSignature,
                    updatedAt: new Date(),
                    confirmed: true,
                },
            });
        }

        return {
            txSignature,
            withdrawCreditAmount,
            solAmount: withdrawCreditAmount,
            remainingBalance: amount.remainingBalance,
        };
    } catch (e) {
        return { err: e };
    }
};

// Get the credit balance for a user
// Right now since we're only dealing with solan, the type will always be sol
const getBalance = async (userWallet: string) => {
    logger.info(`Fetching credit balance for ${userWallet}`);

    const userRecord = await db.user.findFirst({
        where: { wallet: userWallet },
    });

    if (!userRecord)
        return { err: `Could not find user Record for ${userWallet}` };

    const creditBalance = await db.balance.findFirst({
        where: { user: userRecord, type: "solana" },
    });

    if (!creditBalance) {
        logger.warn("No Balance exists for", userWallet);
        return { balance: 0 }; // Record hasn't been created yet?
    }

    return { balance: creditBalance.amount };
};

// Convenience method to return the most recent deposits for a user
const getDepositsForUser = async (userWallet: string, take: number = 5) => {
    const userRecord = await db.user.findFirst({
        where: { wallet: userWallet },
    });

    if (!userRecord) {
        return { deposits: [] };
    }

    const deposits = await db.credit.findMany({
        where: { userId: userRecord.id, type: "deposit" },
        orderBy: { createdAt: "desc" },
        take: take,
    });

    return { deposits };
};

// TODO: Implement this
const getHistory = async (userWallet) => {
    const [deposits, withdraws] = await Promise.all([
        getDepositsForUser(userWallet),
        Debits.getWithdrawsForUser(userWallet),
    ]);

    // Format this history a little...
    const history = [
        ...deposits.deposits.map((w) => {
            return {
                amount: w.amount,
                createdAt: w.createdAt,
                type: "deposit",
            };
        }),
        ,
        ...withdraws.withdraws.map((w) => {
            return {
                amount: w.amount,
                createdAt: w.createdAt,
                type: "withdraw",
            };
        }),
    ];
    const orderedHistory = compact(orderBy(history, "createdAt", "desc"));

    return { err: null, history: orderedHistory };
};

// Returns Individual records for tall of the credits
const getCreditsForUser = async (userWallet: string) => {
    const userRecord = await db.user.findFirst({
        where: { wallet: userWallet },
    });

    if (!userRecord) {
        return { err: "Could not find User", debits: null };
    }

    const credits = await db.credit.findMany({
        where: { user: userRecord },
        orderBy: { createdAt: "desc" },
        take: 10,
    });

    return { err: null, credits };
};

// Retuns all of the bets in the system
const getAll = () => {};

export default {
    credit,
    deposit,
    withdraw,
    getAll,
    getBalance,
    getHistory,
    getCreditsForUser,
};
