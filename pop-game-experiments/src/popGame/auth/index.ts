// TODO: should take out this helper func out of popGame
import jwt from "jsonwebtoken";
import { request } from "undici";

const getDiscordInfoByToken = async (token: string) => {
    try {
        const userResult = await request("https://discord.com/api/users/@me", {
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        const resData = await userResult.body.json();
        console.log(resData);
        return {
            userId: resData.id,
            userName: resData.name,
        };
    } catch (e) {
        console.error(e);
        return { err: e };
    }
};

const login = () => {};

export default {
    getDiscordInfoByToken,
};
