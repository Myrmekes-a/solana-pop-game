// Most Balloons Popped
// -Most SOL Bet
// -Longest Win Streak
// -Most Balloons Purchased
import db from "..";
import { leaderCount } from "../../config";

const getMostBalloonsPopped = () => {};

// const mostSolBet = () => {}; // Same as most balloons

// Returns users with the most balloons purchased
const mostBalloonsPurchased = async () => {
    const mostBalloons = await db.gamePlay.groupBy({
        by: ["userId"],
        _sum: { balloonsBought: true },
        orderBy: {
            _sum: { balloonsBought: "desc" },
        },
        take: leaderCount,
    });

    return mostBalloons;
};

// Returns users with biggest payouts
const biggestWins = () => {};

const mostWins = () => {};

export default {
    mostBalloonsPurchased,
};
