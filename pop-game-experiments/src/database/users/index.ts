import { UserProfile } from "@prisma/client";

import db from "..";

const updateUserName = async (wallet: string, name: string) => {
    try {
        const user = await db.user.findUnique({
            where: { wallet: wallet },
        });
        const updatedUser = await db.userProfile.update({
            where: { userId: user.id },
            data: {
                name,
            },
        });

        return {
            userWallet: wallet,
            handle: updatedUser.name,
            userId: updatedUser.userId,
        };
    } catch (e: any) {
        return { err: "Could not change handle for user", details: e.message };
    }
};

const updatePurchasedStatus = async (
    wallet: string,
    purchasedBalloonsCount: number,
    balloonPrice: number
) => {
    try {
        const user = await db.user.findUnique({
            where: { wallet: wallet },
            include: { userProfile: true },
        });

        if (!user?.userProfile)
            return { err: "Could not find user profile by wallet" };

        const updatedUser = await db.userProfile.update({
            where: { userId: user.id },
            data: {
                balloonsBought:
                    user.userProfile.balloonsBought + purchasedBalloonsCount,
                experience: Math.floor(
                    (user.userProfile.balloonsBought + purchasedBalloonsCount) /
                        100
                ),
                totalSolWagered:
                    user.userProfile.totalSolWagered +
                    BigInt(purchasedBalloonsCount) * BigInt(balloonPrice),
            },
        });

        return {
            userWallet: wallet,
            experience: updatedUser.experience,
            balloonsBought: updatedUser.balloonsBought,
            totalSolWagered: updatedUser.totalSolWagered,
            userId: updatedUser.userId,
        };
    } catch (e: any) {
        return {
            err: "Could not update balloon purchased status for player",
            details: e.message,
        };
    }
};

const updateWinnerStatus = async (wallet: string, wonSolAmount: number) => {
    try {
        const user = await db.user.findUnique({
            where: { wallet: wallet },
            include: { userProfile: true },
        });

        if (!user?.userProfile)
            return { err: "Could not find user profile by wallet" };

        const updatedUser = await db.userProfile.update({
            where: { userId: user.id },
            data: {
                totalSolWon:
                    (user.userProfile.totalSolWon ?? BigInt(0)) +
                    BigInt(wonSolAmount),
                gamesWon: user.userProfile.gamesWon + 1,
            },
        });

        return {
            userWallet: wallet,
            totalSolWon: updatedUser.totalSolWon,
            gamesWon: updatedUser.gamesWon,
            userId: updatedUser.userId,
        };
    } catch (e: any) {
        return {
            err: "Could not update total SOL won amount for winner",
            details: e.message,
        };
    }
};

const updateAffiliateWinnerStatus = async (
    wallet: string,
    affiliateSolAmount: number
) => {
    try {
        const user = await db.user.findUnique({
            where: { wallet: wallet },
            include: { userProfile: true },
        });

        if (!user?.userProfile)
            return { err: "Could not find user profile by wallet" };

        const updatedUser = await db.userProfile.update({
            where: { userId: user.id },
            data: {
                rakePaid:
                    (user.userProfile.rakePaid ?? BigInt(0)) +
                    BigInt(affiliateSolAmount),
            },
        });

        return {
            userWallet: wallet,
            rakePaid: updatedUser.rakePaid,
            userId: updatedUser.userId,
        };
    } catch (e: any) {
        return {
            err: "Could not update rake paid amount for affiliate winner",
            details: e.message,
        };
    }
};

const getUserByWallet = async (wallet: string) => {
    const user = await db.user.findUnique({
        where: { wallet: wallet },
    });
    return user ? { user } : { err: "Could not find user by wallet" };
};

const getUserById = async (userId: string) => {
    const user = await db.user.findFirst({
        where: { id: userId },
    });
    return user ? { user } : { err: "Could not find user by id" };
};

const getUserProfileByUserName = async (name: string) => {
    const profile = await db.userProfile.findUnique({
        where: { name },
    });
    return profile
        ? { profile }
        : { err: "Could not find user profile by name" };
};

const getUserProfileByWallet = async (wallet: string) => {
    const user = await db.user.findUnique({
        where: { wallet: wallet },
        include: { userProfile: true },
    });
    return user ? { user } : { err: "Could not find user profile by wallet" };
};

const getUserProfileById = async (userId: string) => {
    const userProfile = await db.userProfile.findUnique({
        where: { userId },
    });
    return userProfile
        ? { userProfile }
        : { err: "Could not find user profile by user id" };
};

const getAllUsers = async (usersPerPage: number, pageIndex: number) => {
    const users = await db.user.findMany({
        include: { balance: true, userProfile: true },
        take: usersPerPage,
        skip: pageIndex * usersPerPage,
        orderBy: [
            {
                userProfile: {
                    totalSolWon: "desc",
                },
            },
            {
                userProfile: {
                    gamesWon: "desc",
                },
            },
            {
                userProfile: {
                    balloonsBought: "desc",
                },
            },
        ],
    });

    return users;
};

const createUserProfile = async (newData: {
    userId: string;
    name: string;
    discord?: string;
    twitter?: string;
}) => {
    const profile = await db.userProfile.create({
        data: {
            userId: newData.userId,
            name: newData.name,
            discord: newData.discord,
            twitter: newData.twitter,
        },
    });
    return profile ? { profile } : { err: "Could not create user profile" };
};

const updateUserProfileById = async (
    profileId: string,
    newData: UserProfile
) => {
    const profile = await db.userProfile.update({
        where: { id: profileId },
        data: newData,
    });
    return profile ? { profile } : { err: "Could not find user profile by id" };
};

const createAffiliate = async (userId: string, invitingUserId: string) => {
    if (userId === invitingUserId)
        return {
            err: "Could not create self inviting",
        };

    const affiliateLink = await db.affiliateLink.create({
        data: { userId, invitedUserId: invitingUserId },
    });

    return affiliateLink
        ? { link: affiliateLink }
        : { err: "Could not create inviting link" };
};

const removeAffiliate = async (userId: string, invitingUserId: string) => {
    if (userId === invitingUserId)
        return {
            err: "Could not exist self inviting",
        };

    const { count } = await db.affiliateLink.deleteMany({
        where: { userId, invitedUserId: invitingUserId },
    });

    return count ? { status: "ok" } : { err: "Not found the affiliate link" };
};

const getAffiliatesFrom = async (userId: string) => {
    const inviteRecords = await db.affiliateLink.findMany({
        where: { userId },
    });

    return inviteRecords ?? [];
};

const getAffiliateUserByWallet = async (wallet: string) => {
    const user = await db.user.findUnique({
        where: { wallet: wallet },
        include: { userProfile: true, Affiliating: true },
    });
    if (!user) return { err: "Could not find user profile by wallet" };

    if (!user.Affiliating.length) return { err: "No affiliated user" };

    const affiliatedUser = await db.user.findUnique({
        where: { id: user.Affiliating[0].invitedUserId },
    });

    return affiliatedUser
        ? { affiliatedUser }
        : { err: "Not found affiliate user from id" };
};

const getAffiliatesTo = async (userId: string) => {
    const inviteRecords = await db.affiliateLink.findMany({
        where: { invitedUserId: userId },
    });

    return inviteRecords ?? [];
};

export default {
    createAffiliate,
    getAffiliatesFrom,
    getAffiliatesTo,
    getAffiliateUserByWallet,
    getUserByWallet,
    getUserById,
    getUserProfileByUserName,
    getUserProfileById,
    getUserProfileByWallet,
    getAllUsers,
    createUserProfile,
    updateAffiliateWinnerStatus,
    updatePurchasedStatus,
    updateUserName,
    updateUserProfileById,
    updateWinnerStatus,
    removeAffiliate,
};
