import { createHttp } from "./http.common";

class UserService {
    getUser() {
        return createHttp().get("/me");
    }

    getMyProfile() {
        return createHttp().get("/myProfile");
    }

    getProfileByWallet(wallet) {
        return createHttp().get(`/profileByWallet?wallet=${wallet}`);
    }

    getProfileByUserName(name) {
        return createHttp().get(`/profileByUserName?name=${name}`);
    }

    getAllUsers() {
        return createHttp().get("/allUsers");
    }

    createProfile(name, affiliateCode, discord) {
        return createHttp().post("/signUp", { name, affiliateCode, discord, twitter: "" });
    }

    updateProfile(name) {
        return createHttp().put("/myProfile", { name });
    }
}

export default new UserService();
