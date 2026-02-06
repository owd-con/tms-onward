import { createCrudHook } from "../hooks/createCrudHook";
import { useLazyGetDashboardQuery } from "./api";

export const useDashboard = createCrudHook<any>({
  useLazyGetQuery: useLazyGetDashboardQuery,
  entityName: "dashboard",
});
