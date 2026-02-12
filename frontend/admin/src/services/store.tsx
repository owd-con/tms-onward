import { dashboardApi } from './dashboard/api';
import { userApi } from "./user/api";
import { authApi } from "./auth/api";
import { tableApi } from "./table/api";
import { profileApi } from "./profile/api";

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

// TMS Onward - Waypoint APIs (v2.10)
import { waypointLogsApi } from "./waypointLogs/api";
import { waypointImagesApi } from "./waypointImages/api";

// TMS Onward - Onboarding APIs
import { onboardingApi } from "./onboarding/api";

// TMS Onward - Report APIs
import { reportApi } from "./report/api";

import { configureStore, type Middleware } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";
import rootReducer from "./reducer";

const persistConfig = {
  key: "root",
  storage,
  blacklist: ["_persist"],
  debug: true,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// TMS Onward - Removed WMS-specific middleware (area, batch, delivery, fulfillment, item, receiving, receivingPlan, stock, stockopname, task, warehouse)
// TMS Onward - Removed additional WMS middleware (client, layout, location, region)
const apiMiddleware: Middleware[] = [
  authApi.middleware,
  tableApi.middleware,
  profileApi.middleware,
  dashboardApi.middleware,
  userApi.middleware,
  // TMS Onward - Master Data APIs
  customerApi.middleware,
  vehicleApi.middleware,
  driverApi.middleware,
  pricingMatrixApi.middleware,
  addressApi.middleware,
  regionApi.middleware,
  // TMS Onward - Order APIs
  orderApi.middleware,
  // TMS Onward - Trip APIs
  tripApi.middleware,
  // TMS Onward - Exception APIs
  exceptionApi.middleware,
  // TMS Onward - Company APIs
  companyApi.middleware,
  // TMS Onward - Waypoint APIs (v2.10)
  waypointLogsApi.middleware,
  waypointImagesApi.middleware,
  // TMS Onward - Onboarding APIs
  onboardingApi.middleware,
  // TMS Onward - Report APIs
  reportApi.middleware,
];

const store = configureStore({
  reducer: persistedReducer,
  devTools: import.meta.env.DEV,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      immutableCheck: false,
      serializableCheck: false,
    }).concat(apiMiddleware),
});

const persistor = persistStore(store);

export { persistor, store };

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
