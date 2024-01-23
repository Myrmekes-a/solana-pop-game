import { createHttp } from "./http.common";

class CreditService {
    getCreditsHistory() {
        return createHttp().get("/credits/history");
    }

    getCreditBalance() {
        return createHttp().get("/credits");
    }

    deposit(creditDepositAmount, tx) {
        return createHttp().post("/credits", { creditDepositAmount, tx });
    }

    withdraw(withdrawAmount) {
        return createHttp().post("/credits/withdraw", { withdrawAmount });
    }
}

export default new CreditService();
