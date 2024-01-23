import db from "..";

const insufficientAmountError =
    "Could not debit account because of insuffient funds";

const getSumAmountByGameId = async (gameId: number) =>
    db.debit.aggregate({
        _sum: { amount: true },
        where: { gameId },
    });

// Attempts to debit the user balance
const debit = async (
    userWallet: string,
    debitAmount: number,
    gameId?: number
) => {
    const remainingAmount = await db.$transaction(async (tx) => {
        const user = await db.user.findFirst({
            where: { wallet: userWallet },
            include: { balance: true },
        });

        // Do some checks
        if (!user) return { err: "Could not find user" };
        if (!user.balance)
            return {
                err: insufficientAmountError,
            };
        if (user.balance.amount < debitAmount)
            return { err: insufficientAmountError };

        // Update the balance amount and create a debit record
        const remainingBalance = Number(user.balance.amount) - debitAmount;
        const debitRecord = await db.debit.create({
            data: {
                amount: BigInt(Math.floor(debitAmount)),
                user: {
                    connect: { id: user.id },
                },
                balance: {
                    connect: { id: user.balance.id },
                },
                ...((gameId == 0 || gameId) && {
                    game: {
                        connect: { id: gameId },
                    },
                }),
            },
        });
        const updatedBalance = await db.balance.update({
            where: { id: user.balance.id },
            data: {
                amount: BigInt(Math.floor(remainingBalance)),
                updatedAt: new Date(),
            },
        });

        return { err: null, balance: updatedBalance.amount };
    });

    return { balance: remainingAmount.balance };
};

// Remove all game debits and refund balance for that
const cancelPlayerAllGameDebitsByGameId = async (
    userWallet: string,
    refundBalance: number,
    gameId: number
) => {
    const user = await db.user.findFirst({
        where: { wallet: userWallet },
        include: { balance: true },
    });
    if (!user.balance) {
        // Create default balance record
        await db.balance.create({
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

    // Return zero if not found user wallet
    if (!user) {
        return { count: 0, balance: BigInt(0) };
    }

    // Update the balance amount for cancel debits
    const remainingBalance = Number(user.balance.amount) + refundBalance;
    const updatedBalance = await db.balance.update({
        where: { id: user.balance.id },
        data: {
            amount: BigInt(Math.floor(remainingBalance)),
            updatedAt: new Date(),
        },
    });

    const { count } = await db.debit.deleteMany({
        where: { userId: user.id, gameId },
    });
    return { count, balance: updatedBalance.amount };
};

// Convenience method to return the most recent deposits for a user
const getWithdrawsForUser = async (userWallet: string, take: number = 5) => {
    const userRecord = await db.user.findFirst({
        where: { wallet: userWallet },
    });

    if (!userRecord) {
        return { withdraws: [] };
    }

    const withdraws = await db.withdraw.findMany({
        where: { userId: userRecord.id },
        orderBy: { createdAt: "desc" },
        take: take,
    });
    return { withdraws };
};

// Retuns the debits for a specific user
const getDebitsForUser = async (userWallet: string) => {
    const userRecord = await db.user.findFirst({
        where: { wallet: userWallet },
    });

    if (!userRecord) {
        return { err: "Could not find User", debits: null };
    }

    const debits = await db.debit.findMany({
        where: { user: userRecord },
        orderBy: { createdAt: "desc" },
        take: 10,
    });

    return { err: null, debits };
};

export default {
    cancelPlayerAllGameDebitsByGameId,
    debit,
    getDebitsForUser,
    getSumAmountByGameId,
    getWithdrawsForUser,
};
