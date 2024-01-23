import { createHttp } from "./http.common";

class AuthService {
    login(publicKey, signature) {
        return createHttp().post("/doLogin", { publicKey, signature });
    }
}

export default new AuthService();
