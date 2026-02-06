import { configureStore, type Middleware } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";
import rootReducer from "./reducer";

import { authApi } from "./auth/api";
import { driverApi } from "./driver/api";
import { uploadApi } from "./upload/api";

const persistConfig = {
  key: "root",
  storage,
  blacklist: ["_persist"],
  debug: true,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const apiMiddleware: Middleware[] = [
  authApi.middleware,
  driverApi.middleware,
  uploadApi.middleware,
];

const store = configureStore({
  reducer: persistedReducer,
  devTools: import.meta.env.DEV,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      immutableCheck: false,
      serializableCheck: false,
    }).concat(apiMiddleware),
});

const persistor = persistStore(store);

export { persistor, store };

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
