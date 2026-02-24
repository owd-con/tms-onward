import { createSlice } from "@reduxjs/toolkit";
import type { Session } from "../types/entities";

interface AuthState {
  authenticated: boolean;
  session: Session | null;
}

const defineInitialState = (): AuthState => ({
  authenticated: false,
  session: null,
});

export const authSlice = createSlice({
  name: "auth",
  initialState: defineInitialState(),
  reducers: {
    signin: (state, action: { payload: Session }) => {
      state.session = action.payload;
      state.authenticated = true;
    },
    signout: (state) => {
      state.session = null;
      state.authenticated = false;
    },
    setSession: (state, action: { payload: Session | null }) => {
      state.session = action.payload;
      state.authenticated = action.payload !== null;
    },
  },
});

export const { signin, signout, setSession } = authSlice.actions;
export const authReducer = authSlice.reducer;
