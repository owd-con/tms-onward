import { combineReducers } from "@reduxjs/toolkit";
import type { Reducer, UnknownAction } from "redux";

import storage from "redux-persist/lib/storage";

import { authApi } from "./auth/api";
import { authReducer, signout } from "./auth/slice";
import { formReducer } from "./form/slice";
import { driverApi } from "./driver/api";
import { uploadApi } from "./upload/api";

// ==============================
// API Reducers
// ==============================
const apiReducers = {
  [authApi.reducerPath]: authApi.reducer,
  [driverApi.reducerPath]: driverApi.reducer,
  [uploadApi.reducerPath]: uploadApi.reducer,
};

// ==============================
// Slice Reducers
// ==============================
const sliceReducers = {
  form: formReducer,
  auth: authReducer,
};

// ==============================
// Root Reducer
// ==============================
const appReducer = combineReducers({
  ...apiReducers,
  ...sliceReducers,
});

export type AppState = ReturnType<typeof appReducer>;

const rootReducer: Reducer<AppState, UnknownAction> = (state, action) => {
  if (action.type === signout.type) {
    if (typeof window !== "undefined") {
      window.localStorage.clear();
      window.sessionStorage?.clear?.();
    }
    if (
      "clear" in storage &&
      typeof (storage as unknown as Storage).clear === "function"
    ) {
      ((storage as unknown) as Storage).clear();
    } else {
      storage.removeItem("persist:root");
    }
    state = undefined;
  }
  return appReducer(state, action);
};

export default rootReducer;
