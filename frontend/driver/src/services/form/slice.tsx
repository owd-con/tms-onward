import { createSlice } from "@reduxjs/toolkit";

interface FormState {
  errors: Record<string, unknown>;
  success: boolean;
  loading: boolean;
}

const defineInitialState = (): FormState => ({
  errors: {},
  success: false,
  loading: false,
});

const formSlice = createSlice({
  name: "Form",
  initialState: defineInitialState(),
  reducers: {
    reset: () => defineInitialState(),
    failure: (state, action) => {
      state.errors = action.payload?.data?.errors;
      state.success = false;
      state.loading = false;
    },
    success: (state) => {
      state.errors = {};
      state.success = true;
      state.loading = false;
    },
    requesting: (state) => {
      state.errors = {};
      state.success = false;
      state.loading = true;
    },
  },
});
export const { reset, requesting, success, failure } = formSlice.actions;
export const formReducer = formSlice.reducer;
