export const pickingOptions = [
  { label: "FIFO (First In, First Out)", value: "fifo" },
  { label: "FEFO (First Expired, First Out)", value: "fefo" },
  { label: "LIFO (Last In, First Out)", value: "lifo" },
  { label: "Manual", value: "manual" },
];

export const statusOptions = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

export const documentStatusOptions = [
  { label: "New", value: "new" },
  { label: "Published", value: "published" },
  { label: "Process", value: "process" },
  { label: "Completed", value: "completed" },
];

export const fulfillmentStatusOptions = [
  { label: "New", value: "new" },
  { label: "Disputed", value: "disputed" },
  { label: "Completed", value: "completed" },
];

export const taskStatusOptions = [
  { label: "New", value: "new" },
  { label: "Process", value: "process" },
  { label: "Completed", value: "completed" },
];

export const adjustTypeOptions = [
  { label: "Adjustment", value: "adjustment" },
  { label: "Opname", value: "opname" },
];

export const taskTypeOptions = [
  { label: "Picking", value: "picking" },
  { label: "Putaway", value: "putaway" },
  { label: "Defect", value: "defect" },
];

export const fractionOptions = [
  { value: "PCS", label: "Pcs (Piece)" },
  { value: "DUS", label: "Dus (Box)" },
  { value: "PACK", label: "Pack" },
  { value: "KG", label: "Kilogram" },
  { value: "GRAM", label: "Gram" },
  { value: "LITER", label: "Liter" },
  { value: "ML", label: "Milliliter" },
  { value: "METER", label: "Meter" },
  { value: "CM", label: "Centimeter" },
  { value: "ROLL", label: "Roll" },
  { value: "SHEET", label: "Sheet / Lembar" },
  { value: "PACKET", label: "Packet" },
  { value: "BUNDLE", label: "Bundle" },
  { value: "SET", label: "Set" },
  { value: "BAG", label: "Bag / Karung" },
  { value: "DRUM", label: "Drum" },
];

export const deliveryTypeOptions = [
  { label: "Shipment", value: "shipment" },
  { label: "Defect", value: "defect" },
  { label: "Transfer", value: "transfer" },
];

export const stockTypeOptions = [
  { label: "Opname", value: "opname" },
  { label: "Adjustment", value: "adjustment" },
];

export const areaTypeOptions = [
  { label: "Receiving", value: "receiving" },
  { label: "Storage", value: "storage" },
  { label: "Preparation", value: "preparation" },
  { label: "Quarantine", value: "quarantine" },
  { label: "Other", value: "other" },
];

export const orientationOptions = [
  { label: "Horizontal", value: "horizontal" },
  { label: "Vertical", value: "vertical" },
];

export const elementTypeOptions = [
  { label: "Area", value: "area" },
  { label: "Location", value: "location" },
];

export const locationTypeOptions = [
  { label: "Palette", value: "palette" },
  { label: "Rack Palette", value: "rack_palette" },
  { label: "Rack", value: "rack" },
];

export const warehouseTypeOptions = [
  { label: "Inhouse", value: "inhouse" },
  { label: "Logistic", value: "logistic" },
];

export const vehicleTypeOptions = [
  { label: "Select Vehicle Type", value: "" },
  { label: "Truck", value: "Truck" },
  { label: "Van", value: "Van" },
  { label: "Pickup", value: "Pickup" },
  { label: "Container Truck", value: "Container Truck" },
  { label: "Trailer", value: "Trailer" },
  { label: "Motor", value: "Motor" },
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
