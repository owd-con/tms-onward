import { lazy } from "react";

// Lazy load screen components for code splitting

// Dashboard
const DashboardScreen = lazy(() => import("./dashboard"));

// Management screens
const TeamScreen = lazy(() => import("./management/team"));
const CompanyDetailPage = lazy(() => import("./management/company/CompanyDetailPage"));

// Master Data screens (Phase 6-10)
const CustomerListScreen = lazy(
  () => import("./master-data/customer/CustomerListPage"),
);
// Using modal for create - CustomerCreateScreen no longer needed
// const CustomerCreateScreen = lazy(
//   () => import("./master-data/customer/CustomerCreatePage"),
// );
const CustomerDetailScreen = lazy(
  () => import("./master-data/customer/CustomerDetailPage"),
);
// CustomerAddresses now integrated into CustomerDetailPage - no separate page needed
// const CustomerAddressesScreen = lazy(
//   () => import("./master-data/customer/CustomerAddressesPage"),
// );
const VehicleListScreen = lazy(
  () => import("./master-data/vehicle/VehicleListPage"),
);
// Using modal for create - VehicleCreateScreen no longer needed
// const VehicleCreateScreen = lazy(
//   () => import("./master-data/vehicle/VehicleCreatePage"),
// );
const DriverListScreen = lazy(
  () => import("./master-data/driver/DriverListPage"),
);
// Using modal for create - DriverCreateScreen no longer needed
// const DriverCreateScreen = lazy(
//   () => import("./master-data/driver/DriverCreatePage"),
// );
// Pricing Matrix pages removed - managed via Customer detail page (Customer-Specific Pricing)
// const PricingMatrixListScreen = lazy(
//   () => import("./master-data/pricing-matrix/PricingMatrixListPage"),
// );
// const PricingMatrixCreateScreen = lazy(
//   () => import("./master-data/pricing-matrix/PricingMatrixCreatePage"),
// );
// const PricingMatrixDetailScreen = lazy(
//   () => import("./master-data/pricing-matrix/PricingMatrixDetailPage"),
// );
// AddressListScreen removed - addresses now managed via Customer Addresses (Phase 9.5)

// Order Management (Phase 11)
const OrderListScreen = lazy(() => import("./orders/OrderListPage"));
const OrderCreateScreen = lazy(() => import("./orders/OrderCreatePage"));
const OrderDetailScreen = lazy(() => import("./orders/OrderDetailPage"));
const OrderEditScreen = lazy(() => import("./orders/OrderEditPage"));

// Trip Management (Phase 12)
const TripListScreen = lazy(() => import("./trips/TripListPage"));
const TripCreateScreen = lazy(() => import("./trips/TripCreatePage"));
const TripEditScreen = lazy(() => import("./trips/TripEditPage"));
const TripDetailScreen = lazy(() => import("./trips/TripDetailPage"));

// Exception Management (Phase 16)
const ExceptionListScreen = lazy(() => import("./exceptions/ExceptionListPage"));

// Reports (Phase 17)
const OrderTripReportPage = lazy(() => import("./reports/OrderTripReportPage"));
const DriverPerformanceReportPage = lazy(() => import("./reports/DriverPerformanceReportPage"));
const CustomerReportPage = lazy(() => import("./reports/CustomerReportPage"));

// Onboarding
const OnboardingWizard = lazy(() =>
  import("../onboarding/OnboardingWizard")
);
const OnboardingCompletePage = lazy(() =>
  import("../onboarding/OnboardingCompletePage")
);

// TMS Onward - Route Registry
// Uncomment routes as screens are implemented in respective phases

// React Router v6: Use relative paths for nested Routes (no leading slash)
// Parent route is /a/* so these paths are relative to the remaining path after /a/
const routes = [
  // Onboarding (should be checked before other routes)
  { path: "onboarding", element: OnboardingWizard },
  { path: "onboarding/complete", element: OnboardingCompletePage },

  // Dashboard
  { path: "dashboard", element: DashboardScreen },

  // Master Data
  { path: "master-data/customers", element: CustomerListScreen },
  // Using modal for create - route no longer needed
  // { path: "master-data/customers/create", element: CustomerCreateScreen },
  { path: "master-data/customers/:id", element: CustomerDetailScreen },
  // Customer addresses now integrated into CustomerDetailPage
  // { path: "master-data/customers/:customerId/addresses", element: CustomerAddressesScreen },
  { path: "master-data/vehicles", element: VehicleListScreen },
  { path: "master-data/drivers", element: DriverListScreen },
  // Pricing Matrix removed - managed via Customer detail page (Customer-Specific Pricing)
  // { path: "master-data/pricing", element: PricingMatrixListScreen },
  // { path: "master-data/pricing/create", element: PricingMatrixCreateScreen },
  // { path: "master-data/pricing/:id", element: PricingMatrixDetailScreen },
  // Addresses removed - managed via Customer Addresses (/a/master-data/customer/:customerId/addresses)

  // Orders
  { path: "orders", element: OrderListScreen },
  { path: "orders/create", element: OrderCreateScreen },
  { path: "orders/:id/edit", element: OrderEditScreen },
  { path: "orders/:id", element: OrderDetailScreen },

  // Trips
  { path: "trips", element: TripListScreen },
  { path: "trips/create", element: TripCreateScreen },
  { path: "trips/:id/edit", element: TripEditScreen },
  { path: "trips/:id", element: TripDetailScreen },

  // Exceptions
  { path: "exceptions", element: ExceptionListScreen },

  // Reports
  { path: "reports/order-trip", element: OrderTripReportPage },
  { path: "reports/driver-performance", element: DriverPerformanceReportPage },
  { path: "reports/customer", element: CustomerReportPage },

  // Management (TMS-specific screens)
  { path: "management/company", element: CompanyDetailPage },
  { path: "management/team", element: TeamScreen },
];

export default routes;
