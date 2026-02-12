// Simplified reducer for public tracking
// No auth, no persistence needed for public tracking page

import { combineReducers } from "@reduxjs/toolkit";
import type { Reducer, UnknownAction } from "redux";
import { trackingApi } from "./tracking/api";

// Re-export tracking API reducer for type inference
export { trackingApi } from './tracking/api';

// Export the reducer path for store configuration
export const trackingReducerPath = trackingApi.reducerPath;

// Combine API reducers
const apiReducers = {
  [trackingApi.reducerPath]: trackingApi.reducer,
};

const appReducer = combineReducers(apiReducers);

export type AppState = ReturnType<typeof appReducer>;

// Root reducer - no signout handling for public tracking
const rootReducer: Reducer<AppState, UnknownAction> = (state, action) => {
  return appReducer(state, action);
};

export default rootReducer;
