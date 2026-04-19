# Feedback V3 - Shipment Tracking Updates

Dokumen ini mendeskripsikan perbaikan dan penambahan fitur untuk shipment tracking dan order updates.

---

## 1. Frontend - Order: Inhouse Company Tidak Perlu Price Input

### Deskripsi
Jika company.type = "inhouse", field price tidak perlu ditampilkan di form order.

### Perubahan
- Frontend saja: sembunykan input price jika company.type = "inhouse"
- Backend: tidak perlu perubahan

### Lokasi File
- `frontend/admin/src/platforms/app/screen/orders/components/form/formGeneral.tsx` - input Price untuk FTL (baris ~197)
- `frontend/admin/src/platforms/app/screen/orders/components/form/formShipment.tsx` - input Delivery Price untuk LTL (baris ~526)

### Flow
1. Cek company.type dari session/user context
2. Jika company.type = "inhouse" → sembunyikan input Price (FTL) dan Delivery Price (LTL)
3. Jika company.type IN ("3pl", "carrier") → tampilkan input price

---

## 2. Backend - Trip Waypoint Report: Tambah Reference Number

### Deskripsi
Tambahkan field reference_number dari order di TripWaypointReport MongoDB.

### Fields Baru
- `ReferenceCode` - dari order.reference_code

### Lokasi File
- `backend/entity/trip_waypoint_report.go` - tambah field ReferenceCode
- `backend/src/repository/trip_waypoint_report.go` - saat insert/update report

---

## 3. Backend - Trip Waypoint Report: Link POD Delivered untuk CSV Export

### Deskripsi
Trip waypoint report perlu ada link ke POD (Proof of Delivery) untuk shipments yang sudah delivered.

### Fields Baru
- `PODURL` - URL ke foto tanda tangan / bukti delivery
- Tambahkan di TripWaypointReport entity

### Lokasi File
- `backend/entity/trip_waypoint_report.go` - tambah field PODURL
- `backend/src/usecase/waypoint.go` - saat create TripWaypointReport (baris ~309)

### Catatan
- POD disimpan di WaypointImage.SignatureURL, bukan di shipment
- Saat sync ke MongoDB, include dari waypoint_image table jika ada

---

## 4. Backend - Order filter: Start Date dan End Date

### Deskripsi
Tambahkan filter start_date dan end_date di order list endpoint.

### Query Parameters
- `start_date` - Format YYYY-MM-DD
- `end_date` - Format YYYY-MM-DD

### Lokasi File
- `backend/src/usecase/order.go` - update OrderQueryOptions untuk query filter

### Filtering
- Filter berdasarkan order.created_at
- Inclusive range: start_date <= created_at < end_date + 1 day

---

## 5. Frontend Admin - Order: Date Range Filter

### Deskripsi
Tambahkan date range picker di order list untuk filtering berdasarkan order date.

### Lokasi File
- `frontend/admin/src/platforms/app/screen/orders/components/table/filter.tsx` - tambahkan DatePicker

### Referensi
- Lihat contoh di `frontend/admin/src/platforms/app/screen/reports/components/order-trip-table/filter.tsx`

### Perubahan
- Import `DatePicker` dari `@/components/ui`
- Import `dayjs` untuk date handling
- Tambah state `dateRange` dan handler `handleDateChange`
- Pass params `start_date`, `end_date` ke table.filter()

---

## 6. Backend + Frontend - Shipment: Tambah Reference Number

### Deskripsi
Tambahkan field reference_number di shipment entity dan form input.

### Backend
- `backend/entity/shipment.go` - tambah field ReferenceNumber
- `backend/src/handler/rest/order/request_shipment.go` - tambah field di ShipmentRequest (baris ~21)
- `backend/migrations/` - migration jika perlu

### Frontend
- **FTL**: `frontend/admin/src/platforms/app/screen/orders/components/form/formGeneral.tsx` - input Reference Number
- **LTL**: `frontend/admin/src/platforms/app/screen/orders/components/form/formShipment.tsx` - input di ShipmentFormData (baris ~18), tambah field `reference_number?: string`

### Catatan
- Sama dengan order.reference_code tapi di level shipment

---

## 7. Frontend - Tracking: Support Filter Shipment + Reference Number

### Deskripsi
Tracking page ganti `order_number` menjadi `code` yang bisa mencari di level order atau shipment.

### Perubahan Frontend
- **Frontend Tracking form**: Ubah placeholder "Enter your order number" → "Enter your order or shipment number"
- **Route**: `/tracking/:orderNumber` → `/tracking/:code`
- **TrackingForm** dan **TrackingResultPage**: Ganti parameter `orderNumber` → `code`

### Perubahan Backend API
- Endpoint `/public/tracking/:code` - Ganti orderNumber menjadi code. Support cari:
  1. order_number → return order + shipments
  2. order.reference_code → return order + shipments
  3. shipment_number → return shipment tertentu
  4. shipment.reference_number → return shipments yang match

### Lokasi File
- Frontend:
  - `frontend/tracking/src/components/tracking/TrackingForm.tsx`
  - `frontend/tracking/src/platforms/public/screen/TrackingResultPage.tsx`
- Backend:
  - `backend/src/handler/rest/tracking/request_get.go` - update request
  - `backend/src/handler/rest/tracking/handler.go` - update route

---

## Tasklist

- [x] ##1 - Frontend: Inhouse Hide Price Input
  - Sembunyikan input price di formGeneral.tsx (FTL) dan formShipment.tsx (LTL)
  - Cek company.type dari Redux: (state: RootState) => state.userProfile.user.company.type

- [x] ##2 - Backend: Trip Waypoint Report Tambah Reference Number
  - Tambah field OrderReferenceCode dan ShipmentReferenceNumber di entity
  - Include di waypoint.go saat create TripWaypointReport (baris ~309)

- [x] ##3 - Backend: Trip Waypoint Report Link POD Delivered
  - Tambah field PODURL di entity
  - Include di waypoint.go saat create jika shipment delivered

- [x] ##4 - Backend: Order Filter Start Date End Date
  - Tambah query params di order list
  - Update usecase filter

- [x] ##5 - Frontend Admin: Order Date Range Filter
  - Tambah date picker UI
  - Pass params ke API

- [x] ##6 - Backend + Frontend: Shipment Reference Number
  - Backend: tambah field ReferenceNumber di entity dan request
  - Frontend: input di formGeneral.tsx (FTL) dan formShipment.tsx (LTL)

- [x] ##7 - Frontend + Backend: Tracking Ganti orderNumber ke code
  - Frontend: ubah route dan placeholder
  - Backend: update /public/tracking/:code support cari order_number, reference_code, shipment_number, reference_number