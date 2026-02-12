import { configureStore } from "@reduxjs/toolkit";
import { trackingApi } from "./tracking/api";

const apiMiddleware = [
  trackingApi.middleware,
];

const store = configureStore({
  reducer: {
    [trackingApi.reducerPath]: trackingApi.reducer,
  },
  devTools: import.meta.env.DEV,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      immutableCheck: false,
      serializableCheck: false,
    }).concat(apiMiddleware),
});

export { store };

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
