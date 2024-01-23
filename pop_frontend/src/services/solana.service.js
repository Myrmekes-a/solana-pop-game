import { createHttp } from "./http.common";

class SolanaService {
    getRecentBlockhash() {
        return createHttp().get("/recentBlockhash");
    }
}

export default new SolanaService();
