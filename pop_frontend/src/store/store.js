import { configureStore } from "@reduxjs/toolkit";
import appReducer from "./slices/appSlice";
import accountReducer from "./slices/accountSlice";

export default configureStore({
    reducer: {
        app: appReducer,
        account: accountReducer,
    },
    middleware: getDefaultMiddleware => getDefaultMiddleware({ serializableCheck: false }),
});
