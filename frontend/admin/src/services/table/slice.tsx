import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { $reset } from "./api";
import { type TableState } from "./const";

interface TableSliceState {
  data: Record<string, TableState<unknown>>;
}

const defineInitialState = (): TableSliceState => ({
  data: {},
});

const tableSlice = createSlice({
  name: "table",
  initialState: defineInitialState(),
  reducers: {
    initialized: (
      state,
      action: PayloadAction<{ name: string; config: TableState<unknown> }>
    ) => {
      const { name, config } = action.payload;
      state.data[name] = config;
    },
    setTable: (
      state,
      action: PayloadAction<{ name: string; table: TableState<unknown> }>
    ) => {
      const { name, table } = action.payload;
      state.data[name] = table;
    },
    setPage: (state, action: PayloadAction<{ name: string; page: number }>) => {
      const { name, page } = action.payload;
      if (state.data[name]) {
        state.data[name].page = page;
      }
    },
    setLimit: (
      state,
      action: PayloadAction<{ name: string; limit: number }>
    ) => {
      const { name, limit } = action.payload;
      if (state.data[name]) {
        state.data[name].limit = limit;
        state.data[name].page = 1;
      }
    },
    setSearch: (
      state,
      action: PayloadAction<{ name: string; text: string }>
    ) => {
      const { name, text } = action.payload;
      if (state.data[name]) {
        state.data[name].textSearch = text;
        state.data[name].page = 1;
      }
    },
    setSorting: (
      state,
      action: PayloadAction<{ name: string; sorting: string }>
    ) => {
      const { name, sorting } = action.payload;
      if (state.data[name]) {
        state.data[name].sorting = sorting;
      }
    },
    setFilter: (
      state,
      action: PayloadAction<{
        name: string;
        field: string | Record<string, unknown> | null;
        value?: unknown;
      }>
    ) => {
      const { name, field, value } = action.payload;
      if (!state.data[name]) return;

      if (typeof field === "object" && field !== null) {
        state.data[name].filter = {
          ...state.data[name].filter,
          ...field,
        };
      } else if (typeof field === "string") {
        state.data[name].filter = {
          ...state.data[name].filter,
          [field]: value,
        };
      }

      state.data[name].page = 1;
    },
  },
  extraReducers: (builder) => {
    builder.addCase($reset, () => defineInitialState());
  },
});

export const {
  initialized,
  setTable,
  setPage,
  setLimit,
  setSearch,
  setSorting,
  setFilter,
} = tableSlice.actions;

export const tableReducer = tableSlice.reducer;
