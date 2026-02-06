import type { User } from "@/services/types";
import { createSlice } from "@reduxjs/toolkit";

interface userProfileState {
  user: User | null;
}

const defineInitialState = (): userProfileState => ({
  user: null,
});

export const userProfileSlice = createSlice({
  name: "userProfile",
  initialState: defineInitialState(),
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
  },
});

export const { setUser } = userProfileSlice.actions;
export const userProfileReducer = userProfileSlice.reducer;
