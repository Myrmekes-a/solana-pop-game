import { createSlice } from "@reduxjs/toolkit";

export const appSlice = createSlice({
    name: "app",
    initialState: {
        musicVolume: 20,
        soundVolume: 50,
        players: {},
        balloons: {},
        darts: {},
        ballistas: {
            topLeftCorner: 0,
            topRightCorner: 0,
            bottomRightCorner: 0,
            bottomLeftCorner: 0,
        },
        popRoomClient: null,
        popRoomKey: "",
        gameState: "purgatory",
        balloonPrice: 0,
        bettingEndsAt: 0,
        gameStarted: false,
        winningPlayer: "",
        winningName: "",
        winningWallet: "",
    },
    reducers: {
        setMusicVolume: (state, action) => {
            state.musicVolume = action.payload;
        },
        setSoundVolume: (state, action) => {
            state.soundVolume = action.payload;
        },
        setPlayers: (state, action) => {
            state.players = action.payload;
        },
        updatePlayer: (state, action) => {
            if (state.players[action.payload.key]) {
                state.players[action.payload.key] = action.payload.value;
            }
        },
        removePlayer: (state, action) => {
            if (state.players[action.payload]) {
                delete state.players[action.payload];
            }
        },
        setBalloons: (state, action) => {
            state.balloons = action.payload;
        },
        updateBalloon: (state, action) => {
            if (state.balloons[action.payload.key]) {
                state.balloons[action.payload.key].update(action.payload.value);
            }
        },
        removeBalloon: (state, action) => {
            if (state.balloons[action.payload]) {
                state.balloons[action.payload].stop();
                delete state.balloons[action.payload];
            }
        },
        clearBalloons: (state, action) => {
            Object.keys(state.balloons).forEach(key => {
                state.balloons[key].stop();
                delete state.balloons[key];
            });
        },
        setDarts: (state, action) => {
            state.darts = action.payload;
        },
        updateDart: (state, action) => {
            if (state.darts[action.payload.key]) {
                state.darts[action.payload.key].update(action.payload.value);
            }
        },
        removeDart: (state, action) => {
            if (state.darts[action.payload]) {
                state.darts[action.payload].stop();
                delete state.darts[action.payload];
            }
        },
        clearDarts: (state, action) => {
            Object.keys(state.darts).forEach(key => {
                state.darts[key].stop();
                delete state.darts[key];
            });
        },
        setBallista: (state, action) => {
            if (state.ballistas[action.payload.key]) {
                state.ballistas[action.payload.key] = action.payload.value;
            }
        },
        setPopRoomClient: (state, action) => {
            state.popRoomClient = action.payload;
        },
        setPopRoomKey: (state, action) => {
            state.popRoomKey = action.payload;
        },
        setGameState: (state, action) => {
            state.gameState = action.payload;
        },
        setBalloonPrice: (state, action) => {
            state.balloonPrice = action.payload;
        },
        setBettingEndsAt: (state, action) => {
            state.bettingEndsAt = action.payload;
        },
        setGameStarted: (state, action) => {
            state.gameStarted = action.payload;
        },
        setWinningPlayer: (state, action) => {
            state.winningPlayer = action.payload;
        },
        setWinningName: (state, action) => {
            state.winningName = action.payload;
        },
        setWinningWallet: (state, action) => {
            state.winningWallet = action.payload;
        },
    },
});

export const {
    setMusicVolume,
    setSoundVolume,
    setPlayers,
    updatePlayer,
    removePlayer,
    setBalloons,
    updateBalloon,
    removeBalloon,
    clearBalloons,
    setDarts,
    updateDart,
    removeDart,
    clearDarts,
    setBallista,
    setPopRoomClient,
    setPopRoomKey,
    setGameState,
    setBalloonPrice,
    setBettingEndsAt,
    setGameStarted,
    setWinningPlayer,
    setWinningName,
    setWinningWallet,
} = appSlice.actions;

export default appSlice.reducer;
