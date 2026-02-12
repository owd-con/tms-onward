import { dashboardApi } from "./dashboard/api";
import { userApi } from "./user/api";

// TMS Onward - Master Data APIs
import { customerApi } from "./customer/api";
import { vehicleApi } from "./vehicle/api";
import { driverApi } from "./driver/api";
import { pricingMatrixApi } from "./pricingMatrix/api";
import { addressApi } from "./address/api";
import { regionApi } from "./region/api";

// TMS Onward - Order APIs
import { orderApi } from "./order/api";
import { tripApi } from "./trip/api";
import { exceptionApi } from "./exception/api";
import { companyApi } from "./company/api";

// TMS Onward - Waypoint Management APIs (v2.10)
import { waypointLogsApi } from "./waypointLogs/api";
import { waypointImagesApi } from "./waypointImages/api";

// TMS Onward - Onboarding APIs
import { onboardingApi } from "./onboarding/api";

// TMS Onward - Report APIs
import { reportApi } from "./report/api";

import { combineReducers } from "@reduxjs/toolkit";
import type { Reducer, UnknownAction } from "redux";

import storage from "redux-persist/lib/storage";

import { authApi } from "./auth/api";
import { authReducer, signout } from "./auth/slice";
import { formReducer } from "./form/slice";
import { tableApi } from "./table/api";
import { tableReducer } from "./table/slice";
import { profileApi } from "./profile/api";
import { userProfileReducer } from "./profile/slice";

// TMS Onward - Removed WMS-specific modules (area, batch, delivery, fulfillment, item, receiving, receivingPlan, stock, stockopname, task, warehouse)

// gabungkan semua API slice reducers
const apiReducers = {
  [tableApi.reducerPath]: tableApi.reducer,
  [authApi.reducerPath]: authApi.reducer,
  [profileApi.reducerPath]: profileApi.reducer,
  [dashboardApi.reducerPath]: dashboardApi.reducer,
  [userApi.reducerPath]: userApi.reducer,
  // TMS Onward - Master Data APIs
  [customerApi.reducerPath]: customerApi.reducer,
  [vehicleApi.reducerPath]: vehicleApi.reducer,
  [driverApi.reducerPath]: driverApi.reducer,
  [pricingMatrixApi.reducerPath]: pricingMatrixApi.reducer,
  [addressApi.reducerPath]: addressApi.reducer,
  [regionApi.reducerPath]: regionApi.reducer,
  // TMS Onward - Order APIs
  [orderApi.reducerPath]: orderApi.reducer,
  // TMS Onward - Trip APIs
  [tripApi.reducerPath]: tripApi.reducer,
  // TMS Onward - Exception APIs
  [exceptionApi.reducerPath]: exceptionApi.reducer,
  // TMS Onward - Company APIs
  [companyApi.reducerPath]: companyApi.reducer,
  // TMS Onward - Waypoint Management APIs (v2.10)
  [waypointLogsApi.reducerPath]: waypointLogsApi.reducer,
  [waypointImagesApi.reducerPath]: waypointImagesApi.reducer,
  // TMS Onward - Onboarding APIs
  [onboardingApi.reducerPath]: onboardingApi.reducer,
  // TMS Onward - Report APIs
  [reportApi.reducerPath]: reportApi.reducer,
};

const sliceReducers = {
  form: formReducer,
  table: tableReducer,
  auth: authReducer,
  userProfile: userProfileReducer,
};

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
