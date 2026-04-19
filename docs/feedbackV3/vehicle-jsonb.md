# Feedback V3 - Perbaikan: Vehicle di Trip sebagai JSON

## Ringkasan

Dokumen ini menjelaskan perbaikan untuk issue yang ditemukan setelah implementasi fitur scan order.

---

## Issue: Driver Tidak Punya Akses ke Vehicle Company

### Masalah

Ketika driver register sendiri (fitur #1 di feedback V3):
- Driver signup tanpa company (CompanyID = null)
- Saat driver scan QR code dan terima order, driver harus pilih vehicle
- Tetapi driver tidak punya akses ke vehicle master data company manapun
- Hasil: driver tidak bisa menerima order

### Alur yang Bermasalah

```
Driver Signup
    ↓
CompanyID = null
    ↓
Scan QR Code → Accept Order
    ↓
Select Vehicle → ❌ Gagal (tidak bisa fetch vehicle dari company)
```

---

## Solusi: Ubah Trip.vehicle_id ke JSONB

### Konsep

Ubah field `vehicle_id` (uuid, notnull) di Trip entity menjadi `vehicle` (jsonb, nullable) yang langsung menyimpan data vehicle sebagai JSON tanpa perlu reference ke master data.

### Sebelum vs Sesudah

**Sebelum (Trip entity):**
```go
VehicleID uuid.UUID `bun:"vehicle_id,notnull" json:"vehicle_id"`
```

**Sesudah (Trip entity):**
```go
Vehicle *Vehicle `bun:"vehicle,type:jsonb" json:"vehicle"`
```

### Benefit

1. Driver tidak perlu akses ke vehicle master data company
2. Driver input vehicle info langsung saat terima order (type + plate number)
3. Tidak perlu create vehicle di master data
4. Trip tetap punya informasi vehicle untuk tracking
5. Gunakan struct Vehicle yang sudah ada (tidak perlu TripVehicle baru)

---

## Files yang Perlu Diubah

### Backend

| File | Perubahan |
|------|-----------|
| `entity/trip.go` | Replace `VehicleID uuid.UUID` dengan `Vehicle *Vehicle` (jsonb), hapus relation Vehicle |
| `src/usecase/trip.go` | Update query filter - hapus vehicle_id, add vehicle filter via JSON column; Update - replace vehicle_id dengan vehicle |
| `src/handler/rest/trip/request_create.go` | Request tetap vehicle_id (validasi), di toEntity assign ke trip.Vehicle |
| `src/handler/rest/trip/request_update.go` | Request tetap vehicle_id (validasi), di toEntity assign ke trip.Vehicle |
| `src/handler/rest/driver_web/request_receive_order.go` | Update request body - accept vehicle_type dan plate_number |
| `src/repository/trip.go` | Hapus relation Vehicle dari relation list dan eager load |

### Frontend Driver

| File | Perubahan |
|------|-----------|
| `frontend/driver/src/platforms/app/screen/scan/ScanPage.tsx` | Ubah input dari select vehicle ke text input (vehicle_type, plate_number) |
| `frontend/driver/src/services/types.ts` | Update trip response type |

---

## Detail Perubahan

### Backend - Request Body

**Request create/update trip (Admin Dashboard):**
- Request body tetap `vehicle_id` untuk validasi
- toEntity lookup vehicle, assign ke trip.Vehicle

**Driver receive order:**
```json
{
  "order_id": "uuid-order",
  "vehicle_type": "Pickup",
  "plate_number": "B 1234 XYZ"
}
```

- `vehicle_type` - wajib, string
- `plate_number` - wajib, string

### Frontend Driver - Scan Page

Driver input:
1. **Vehicle Type** - dropdown menggunakan `vehicleTypeOptions` dari `@/shared/options.tsx`
   - Truck, Van, Pickup, Container Truck, Trailer
2. **Plate Number** - text input (B 1234 XYZ)

Tidak perlu fetch vehicle list dari API.

---

## Tasklist

- [x] Backend: Create migration:
  1. Add column vehicle (jsonb) nullable
  2. Update existing data: convert vehicle_id ke vehicle JSON menggunakan JOIN ke vehicles table
  3. Drop column vehicle_id (setelah data berhasil migrate)
- [x] Backend: Update Trip entity - replace vehicle_id dengan vehicle jsonb, hapus relation Vehicle
- [x] Backend: Update repository trip.go - hapus relation Vehicle dari eager load
- [x] Backend: Update TripUsecase - update query filter dan update logic
- [x] Backend: Update trip create request toEntity - lookup vehicle, assign ke trip.Vehicle
- [x] Backend: Update trip update request toEntity - lookup vehicle, assign ke trip.Vehicle
- [x] Backend: Update driver receive order handler - accept vehicle_type dan plate_number
- [x] Frontend Driver: Update ScanPage - input vehicle info (type + plate) bukan select
- [x] Frontend Driver: Update trip types

---

## Catatan

- Struct Vehicle yang digunakan sama dengan entity Vehicle yang sudah ada
- Tidak perlu buat struct TripVehicle baru
- vehicle_id di-replace dengan vehicle jsonb
- **Request tetap vehicle_id** - untuk validasi (cek vehicle exists & belong to company)
- **toEntity** - lookup vehicle, assign ke trip.Vehicle (bukan trip.VehicleID)
- Driver receive order - langsung accept vehicle object tanpa validasi vehicle_id