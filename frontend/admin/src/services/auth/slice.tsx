import { createSlice } from "@reduxjs/toolkit";
import type { User } from "../types";

interface authState {
  authenticated: boolean;
  session: {
    access_token: string;
    user: User;
  } | null;
}

const defineInitialState = (): authState => ({
  authenticated: false,
  session: null,
});

export const authSlice = createSlice({
  name: "auth",
  initialState: defineInitialState(),
  reducers: {
    signin: (state, action) => {
      state.session = action.payload;
      state.authenticated = true;
    },
    signout: (state) => {
      state.session = null;
      state.authenticated = false;
    },
    session: (state, action) => {
      state.session = action.payload;
    },
  },
});

export const { signin, signout, session } = authSlice.actions;
export const authReducer = authSlice.reducer;
