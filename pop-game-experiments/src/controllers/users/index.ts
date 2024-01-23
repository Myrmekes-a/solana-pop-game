import { PublicKey } from "@solana/web3.js";
import { Response } from "express";
import { logger } from "../../logger";

import AuthService from "../../popGame/auth";
import Users from "../../database/users";
import { DEFAULT_USER_COUNT_PER_PAGE } from "../../config";

const findMe = async (req: any, res: Response) => {
    if (!req.wallet) {
        return res.status(400).json({ err: "Invalid auth token" });
    }

    try {
        const wallet = new PublicKey(req.wallet);
        const user = await Users.getUserProfileByWallet(wallet.toBase58());

        // Hopefully fix user bit
        if (!user) {
            return res.status(200).json({
                user: {
                    chatHandle: wallet?.toBase58(),
                    wallet: wallet,
                },
            });
        }

        return res.status(200).json({
            user: {
                chatHandle: user?.user?.userProfile?.name || wallet.toBase58(),
                wallet: user?.user?.wallet,
            },
        });
    } catch (e) {
        logger.error(`- @ findMe: ${e}`);
        return res.status(500).json({ err: e });
    }
};

const getMyProfile = async (req: any, res: Response) => {
    if (!req.wallet) {
        return res.status(400).json({ err: "Invalid auth token" });
    }

    try {
        const wallet = new PublicKey(req.wallet);
        const user = await Users.getUserProfileByWallet(wallet.toBase58());

        if (!user) {
            return res.status(200).json({
                user: {
                    chatHandle: wallet?.toBase58(),
                    wallet: wallet,
                    userProfile: {},
                },
            });
        }

        return res.status(200).json({
            user: {
                chatHandle: user?.user.userProfile?.name || wallet.toBase58(),
                wallet: user?.user?.wallet,
                userProfile: user?.user?.userProfile,
            },
        });
    } catch (e) {
        logger.error(`- @ getMyProfile: ${e}`);
        return res.status(500).json({ err: e });
    }
};

/// Get Query: ?wallet=<wallet>
const getProfileByWallet = async (req: any, res: Response) => {
    const { wallet } = req.query;
    if (!wallet) {
        logger.error(`- @ getProfileByWallet: wallet query not provided`);
        return res.status(400).json({ err: "wallet query not provided" });
    }

    try {
        const userProfile = await Users.getUserProfileByWallet(wallet);

        if (userProfile.err) {
            logger.error(`- @ getProfileByWallet: ${userProfile}`);
            return res.status(404).json(userProfile);
        }

        return res.status(200).json({
            userProfile,
        });
    } catch (e) {
        logger.error(`- @ getProfileByWallet: ${e}`);
        return res.status(500).json({ err: e });
    }
};

/// Get Query: ?name=<username>
const getProfileByUserName = async (req: any, res: Response) => {
    const { name } = req.query;
    if (!name) {
        logger.error(`- @ getProfileByUserName: name query not provided`);
        return res.status(400).json({ err: "name query not provided" });
    }

    try {
        const userProfile = await Users.getUserProfileByUserName(name);

        if (userProfile.err) {
            return res.status(404).json({
                err: userProfile.err,
            });
        }

        return res.status(200).json({
            userProfile,
        });
    } catch (e) {
        logger.error(`- @ getProfileByUserName: ${e}`);
        return res.status(500).json({ err: e });
    }
};

const getUserListForLeaderboard = async (req: any, res: Response) => {
    try {
        let { usersPerPage, pageIndex } = req.query;

        usersPerPage = usersPerPage
            ? Number(usersPerPage)
            : DEFAULT_USER_COUNT_PER_PAGE;
        pageIndex = pageIndex ? Number(pageIndex) : 0;

        logger.info(
            ` - @ getAllUsers requested: usersPerPage=${usersPerPage}, pageIndex=${pageIndex}`
        );

        const users = await Users.getAllUsers(usersPerPage, pageIndex);

        let userlist = users.map((user) => {
            return {
                name: user.userProfile?.name,
                amount: user.balance?.amount,
                wallet: user.wallet,
                solWon: user.userProfile?.totalSolWon,
                balloonPurchased: user.userProfile?.balloonsBought,
                gameWon: user.userProfile?.gamesWon,
            };
        });

        userlist.sort((a, b) => {
            return Number(b.solWon) - Number(a.solWon);
        });

        return res.status(200).json(userlist);
    } catch (e) {
        logger.error(`- @ getAllUsers: ${e}`);
        return res.status(500).json({ err: e });
    }
};

/** Sample body input
{
    discord?: string
    twitter?: string
    affiliateCode?: string
}
**/
const createMyProfile = async (req: any, res: Response) => {
    if (!req.wallet) {
        logger.error(`- @ createMyProfile: Invalid auth token`);
        return res.status(400).json({ err: "Invalid auth token" });
    }

    let { name, discord, twitter, affiliateCode } = req.body;
    if (!name) {
        logger.error(`- @ createMyProfile: name value not provided`);
        return res.status(400).json({ err: "name value not provided" });
    }

    try {
        const wallet = new PublicKey(req.wallet);
        const user = await Users.getUserByWallet(wallet.toBase58());

        if (!user) {
            logger.error(`- @ createMyProfile: Not found the user profile`);
            return res.status(404).json({ err: "Not found the user profile" });
        }

        if (discord) {
            const discordRes = await AuthService.getDiscordInfoByToken(discord);
            if (!discordRes.err) {
                discord = discordRes.userName;
            }
        }

        const profile = await Users.createUserProfile({
            userId: user?.user?.id,
            name,
            discord,
            twitter,
        });

        if (profile.err) {
            logger.error(`- @ createMyProfile: ${profile}`);
            return res.status(500).json(profile);
        }

        if (affiliateCode) {
            const invitingUserProfile = await Users.getUserProfileByUserName(
                affiliateCode
            );

            if (invitingUserProfile.err) {
                logger.error(`- @ createMyProfile: ${invitingUserProfile}`);
                return res.status(500).json(invitingUserProfile);
            }

            const link = await Users.createAffiliate(
                user?.user?.id,
                invitingUserProfile.profile.userId
            );

            if (link.err) {
                logger.error(`- @ createMyProfile: ${link}`);
                res.status(500).json(link);
                return;
            }
        }

        return res.status(200).json({
            user: {
                chatHandle: profile?.profile.name || wallet.toBase58(),
                wallet: user?.user?.wallet,
                userProfile: profile?.profile,
                affiliateCode,
            },
        });
    } catch (e) {
        logger.error(`- @ createMyProfile: ${e}`);
        return res.status(500).json({ err: e });
    }
};
/// TODO: currently made only one name updates
/// may need to add other fields too
const updateMyProfile = async (req: any, res: Response) => {
    if (!req.wallet) {
        logger.error(`- @ updateMyProfile: Invalid auth token`);
        return res.status(400).json({ err: "Invalid auth token" });
    }

    const { name } = req.body;
    if (!name) {
        logger.error(`- @ updateMyProfile: name value not provided`);
        return res.status(400).json({ err: "name value not provided" });
    }

    try {
        const wallet = new PublicKey(req.wallet);
        const user = await Users.getUserProfileByWallet(wallet.toBase58());

        if (user.err) {
            logger.error(`- @ updateMyProfile: ${user}`);
            return res.status(404).json(user);
        }

        const profile = await Users.updateUserProfileById(
            user?.user?.userProfile?.id,
            {
                ...user?.user?.userProfile,
                name,
            }
        );

        return res.status(200).json({
            user: {
                chatHandle: user?.user?.userProfile.name || wallet.toBase58(),
                wallet: user?.user?.wallet,
                userProfile: profile?.profile,
            },
        });
    } catch (e) {
        logger.error(`- @ updateMyProfile: ${e}`);
        return res.status(500).json({ err: e });
    }
};

/** Sample body input
 * {
 *  "inviteTo": <userId>
 * }
 * **/
const createUserInvitation = async (req: any, res: Response) => {
    if (!req.wallet) {
        logger.error(`- @ createUserInvitation: Invalid auth token`);
        return res.status(400).json({ err: "Invalid auth token" });
    }

    const inviteUserId = req.body.inviteTo;

    if (!inviteUserId) {
        logger.error(`- @ createUserInvitation: inviteTo value not provided`);
        return res.status(400).json({ err: "inviteTo value not provided" });
    }

    try {
        const wallet = new PublicKey(req.wallet);
        const user = await Users.getUserProfileByWallet(wallet.toBase58());
        if (user.err) {
            logger.error(`- @ createUserInvitation: ${user}`);
            return res.status(404).json(user);
        }

        const inviteUser = await Users.getUserById(inviteUserId);
        if (inviteUser.err) {
            logger.error(`- @ createUserInvitation: ${inviteUser}`);
            return res.status(404).json(inviteUser);
        }

        const link = await Users.createAffiliate(user?.user?.id, inviteUserId);

        if (link.err) {
            logger.error(`- @ createUserInvitation: ${link}`);
            res.status(500).json(link);
            return;
        }

        return res.status(200).json({
            user: {
                chatHandle: user?.user?.userProfile.name || wallet.toBase58(),
                wallet: user?.user?.wallet,
                userProfile: user?.user?.userProfile,
                newAffiliateLink: link.link,
            },
        });
    } catch (e) {
        logger.error(`- @ createUserInvitation: ${e}`);
        return res.status(500).json({ err: e });
    }
};

/** Sample body input
 * {
 *  "inviteTo": <userId>
 * }
 * **/
const removeUserInvitation = async (req: any, res: Response) => {
    if (!req.wallet) {
        logger.error(`- @ removeUserInvitation: Invalid auth token`);
        return res.status(400).json({ err: "Invalid auth token" });
    }

    const inviteUserId = req.body.inviteTo;

    if (!inviteUserId) {
        logger.error(`- @ removeUserInvitation: inviteTo value not provided`);
        return res.status(400).json({ err: "inviteTo value not provided" });
    }

    try {
        const wallet = new PublicKey(req.wallet);
        const user = await Users.getUserProfileByWallet(wallet.toBase58());
        if (user.err) {
            logger.error(`- @ removeUserInvitation: ${user}`);
            return res.status(404).json(user);
        }

        const inviteUser = await Users.getUserById(inviteUserId);
        if (inviteUser.err) {
            logger.error(`- @ removeUserInvitation: ${inviteUser}`);
            return res.status(404).json(inviteUser);
        }

        const status = await Users.removeAffiliate(
            user?.user?.id,
            inviteUserId
        );

        if (status.err) {
            logger.error(`- @ removeUserInvitation: ${status}`);
            res.status(500).json(status);
            return;
        }

        return res.status(200).json(status);
    } catch (e) {
        logger.error(`- @ removeUserInvitation: ${e}`);
        return res.status(500).json({ err: e });
    }
};

/** Sample body input
 * {
 *  "wallet": <wallet address>
 * }
 * **/
const getUserInvitesFrom = async (req: any, res: Response) => {
    const { wallet } = req.query;
    if (!wallet) {
        logger.error(`- @ getUserInvitesFrom: wallet query not provided`);
        return res.status(400).json({ err: "wallet query not provided" });
    }

    try {
        const wallet = new PublicKey(req.query.wallet);
        const user = await Users.getUserProfileByWallet(wallet.toBase58());
        if (user.err) {
            logger.error(`- @ getUserInvitationFrom: ${user}`);
            return res.status(404).json(user);
        }

        const invites = await Users.getAffiliatesFrom(user?.user?.id);

        return res.status(200).json(invites);
    } catch (e) {
        logger.error(`- @ getUserInvitationFrom: ${e}`);
        return res.status(500).json({ err: e });
    }
};

/** Sample body input
 * {
 *  "wallet": <wallet address>
 * }
 * **/
const getUserInvitesTo = async (req: any, res: Response) => {
    const { wallet } = req.query;
    if (!wallet) {
        logger.error(`- @ getUsernInvitesTo: wallet query not provided`);
        return res.status(400).json({ err: "wallet query not provided" });
    }

    try {
        const wallet = new PublicKey(req.query.wallet);
        const user = await Users.getUserProfileByWallet(wallet.toBase58());
        if (user.err) {
            logger.error(`- @ getUsernInvitesTo: ${user}`);
            return res.status(404).json(user);
        }

        const invites = await Users.getAffiliatesTo(user?.user?.id);

        return res.status(200).json(invites);
    } catch (e) {
        logger.error(`- @ getUsernInvitesTo: ${e}`);
        return res.status(500).json({ err: e });
    }
};

export default {
    createUserInvitation,
    createMyProfile,
    findMe,
    getMyProfile,
    getProfileByWallet,
    getProfileByUserName,
    getUserListForLeaderboard,
    getUserInvitesFrom,
    getUserInvitesTo,
    updateMyProfile,
    removeUserInvitation,
};
