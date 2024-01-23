import db from "..";

const createEmptyGame = async () => db.game.create({ data: {} });

export default {
    createEmptyGame,
};
