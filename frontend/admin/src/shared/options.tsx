export const statusOptions = [
  { label: "Active", value: "active" },
  { label: "Non Aktif", value: "non_active" },
];

export const entitiesOptions = [
  { label: "PT", value: "PT" },
  { label: "CV", value: "CV" },
  { label: "Firma", value: "Firma" },
  { label: "UD", value: "UD" },
  { label: "BUMN", value: "BUMN" },
  { label: "Koperasi", value: "Koperasi" },
  { label: "Yayasan", value: "Yayasan" },
];

/**
 * License Type Options for Driver (Indonesian SIM types)
 */
export const licenseTypeOptions = [
  { label: "Select License Type", value: "" },
  { label: "SIM A", value: "sim_a" },
  { label: "SIM B1", value: "sim_b1" },
  { label: "SIM B2", value: "sim_b2" },
  { label: "SIM C", value: "sim_c" },
];

/**
 * Vehicle Type Options
 */
export const vehicleTypeOptions = [
  { label: "Select Vehicle Type", value: "" },
  { label: "Truck", value: "Truck" },
  { label: "Van", value: "Van" },
  { label: "Pickup", value: "Pickup" },
  { label: "Container Truck", value: "Container Truck" },
  { label: "Trailer", value: "Trailer" },
];

/**
 * Order Status Options
 */
export const orderStatusOptions = [
  { label: "All Status", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Dispatched", value: "dispatched" },
  { label: "In Transit", value: "in_transit" },
  { label: "Delivered", value: "delivered" },
  { label: "Failed", value: "failed" },
  { label: "Cancelled", value: "cancelled" },
];

/**
 * Order Type Options
 */
export const orderTypeOptions = [
  { label: "All Types", value: "" },
  { label: "FTL", value: "FTL" },
  { label: "LTL", value: "LTL" },
];

/**
 * Company Type Options
 */
export const companyTypeOptions: Array<{ label: string; value: "3PL" | "Carrier" }> = [
  { value: "3PL", label: "3PL - Third Party Logistics" },
  { value: "Carrier", label: "Carrier - Transportation Company" },
];
