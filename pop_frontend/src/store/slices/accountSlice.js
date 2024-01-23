import { createSlice } from "@reduxjs/toolkit";

export const appSlice = createSlice({
    name: "app",
    initialState: {
        wallet: {
            publicKey: "",
            signMessage: "",
            signTransaction: "",
            connected: false,
            connecting: false,
            disconnecting: false,
        },
        loggedIn: false,
        sessionId: "",
        name: "",
        credits: 0,
    },
    reducers: {
        setWallet: (state, action) => {
            state.wallet = action.payload;
        },
        setLoggedIn: (state, action) => {
            state.loggedIn = action.payload;
        },
        setSessionId: (state, action) => {
            state.sessionId = action.payload;
        },
        setName: (state, action) => {
            state.name = action.payload;
        },
        setCredits: (state, action) => {
            state.credits = action.payload;
        },
    },
});

export const { setWallet, setLoggedIn, setSessionId, setName, setCredits } = appSlice.actions;

export default appSlice.reducer;
