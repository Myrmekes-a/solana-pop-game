import { createHttp } from "./http.common";

class BalanceService {
    getWalletBalance() {
        return createHttp().get("/solanaBalance");
    }
}

export default new BalanceService();
