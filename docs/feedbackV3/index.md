# Feedback V3 - Perbaikan dan Penambahan Fitur

## Ringkasan

Dokumen ini mendeskripsikan perbaikan dan penambahan fitur berdasarkan feedback V3.

---

## 1. Frontend Driver - Signup dengan Role Driver

### Deskripsi
Tambahkan halaman signup baru di frontend driver untuk registrasi driver baru dengan role "driver".

### Fields yang Diperlukan
- `username` - Username unik untuk login
- `name` - Nama lengkap driver
- `phone` - Nomor telephone
- `password` - Password
- `confirm_password` - Konfirmasi password
- `role` - Set value "driver" (hidden/tidak ditampilkan di form)

### Lokasi File
- **Page**: `frontend/driver/src/platforms/auth/screen/signup.tsx`
- **Router**: `frontend/driver/src/platforms/auth/screen/_subrouter.tsx`
- **API**: `frontend/driver/src/services/auth/api.tsx` (tambah endpoint signup)

### Endpoint Backend
- Modifikasi endpoint `/auth/register` yang sudah ada untuk support role driver
- Tambahkan field `role` di request body (optional, default: "admin")
- Jika `role=driver`:
  - Tidak membuat company baru
  - Membuat user dengan role "driver"
  - CompanyID diset null (nantinya bisa di-assign oleh admin)

### Catatan
- Endpoint signup sekarang (`/auth/register`) membuat company baru dan user dengan role "admin"
- Untuk driver signup, endpoint yang sama akan di-modifikasi:
  - Jika request body berisi `role: "driver"`, maka:
    - Tidak membuat company baru
    - Membuat user dengan role "driver"
    - CompanyID diset null (nantinya admin bisa assign driver ke company)

---

## 2. Frontend Admin - Update User Driver

### Deskripsi
Master data driver sudah memiliki form untuk update data driver (DriverFormModal). Namun perlu component baru `DriverUserFormModal` untuk update user account driver (username, password).

### Perbedaan
- **DriverFormModal**: Update data driver (name, phone, license)
- **DriverUserFormModal**: Update user account (username, password) - untuk driver yang sudah memiliki login

### Lokasi File
- `frontend/admin/src/platforms/app/screen/master-data/driver/components/form/DriverUserFormModal.tsx` (create baru)

### Fields untuk DriverUserFormModal
- `username` - Username untuk login
- `password` - Password baru
- `confirm_password` - Konfirmasi password

### Backend
- Update via endpoint `/user/:id` (update user entity)

---

## 3. Frontend Admin - Params Exclude Role Driver

### Deskripsi
Tambahkan params `not_role=driver` di user list (Team Directory) untuk exclude role driver dari list.

### Lokasi File
- `frontend/admin/src/platforms/app/screen/management/team.tsx`
- `frontend/admin/src/platforms/app/screen/management/components/table/table.config.team.tsx`

### Perubahan
Di `team.tsx`, tambahkan filter params di tableConfig:

```typescript
const tableConfig = useMemo(() => {
  return createTableConfig({
    canManage: canManage("user"),
    // ... other config
    filter: {
      not_role: "driver",  // tambahkan ini
    },
    // ...
  });
}, []);
```

### Endpoint Backend
- Backend `/user` endpoint sudah support query parameter `role` dan `not_role`
- Tidak perlu perubahan di backend

---

## 4. Frontend Admin - QR Code di Print Order

### Deskripsi
Tambahkan QR code di halaman print order yang bisa discan oleh driver. Ketika discan, driver akan menerima order tersebut dan trip dibuat otomatis.

### QR Code Content
QR code berisi URL untuk open di driver web:

```text
https://driver.tms-onward.com/scan?order_id={order_uuid}
```

Atau untuk local development:
```text
http://localhost:5173/scan?order_id={order_uuid}
```

Ketika discan:
1. Open URL di browser driver app `/scan?order_id=xxx`
2. Tampilkan halaman konfirmasi dengan order details
3. Driver klik "Terima Order" → call API `/driver/receive-order`
4. Buat trip dan redirect ke trip detail

### Lokasi File
- `frontend/admin/src/platforms/app/screen/print/PrintOrderScreen.tsx`

### Penempatan
QR code ditampilkan di:
1. Header - disamping logo atau order number
2. Atau footer - sebelum tanda tangan

### Library
- Gunakan `react-qr-code` yang sudah tersedia di package.json
- Atau `qrcode` untuk generate ke canvas/image

---

## 5. Backend - API Scan Order untuk Driver

### Deskripsi
Endpoint baru untuk driver menerima order dan buat trip.

### Get Order Details & Waypoints
Dua endpoint yang sudah ada:
```
GET /order/:id           # Detail order
GET /orders/:id/waypoint-preview  # Waypoints dari shipments (auto-generated)
```

Frontend driver fetch kedua endpoint ini untuk tampilkan.

### Receive Order & Create Trip
```
POST /driver/receive-order
```

### Request Body
```json
{
  "order_id": "uuid-order",
  "vehicle_id": "uuid-vehicle"
}
```
- DriverID dari session user_id
- Ambil user_id dari session, coba get driver by user_id:
  - Jika ketemu → driver_id dari tabel driver
  - Jika tidak ketemu → tetap bisa buat trip dengan user_id
- VehicleID wajib dipilih oleh driver saat receive

### Response
```json
{
  "data": {
    "trip": {
      "id": "uuid-trip",
      "trip_number": "TRP/2024/001",
      "status": "planned",
      "total_waypoints": 2
    }
  }
}
```

### Flow
1. Driver scan QR code dari print order
2. Driver pilih vehicle
3. Driver klik "Terima Order"
4. Backend:
   - Fetch order, validasi exist dan status
   - Coba get driver by user_id:
     - Jika ketemu → driver_id dari tabel driver
     - Jika tidak ketemu → user_id (field baru di trips)
   - VehicleID dari request body
   - Buat trip baru
   - Waypoints dibuat otomatis dari shipments di order
   - Dispatch trip (trip.status: "dispatched", order.status: "dispatched")
   - Return trip info

### Validasi
- Order harus exist dan tidak deleted
- Order status harus "confirmed" (belum ada trip)

### Kondisi Driver
- driver_id → referensi ke tabel driver (nullable, untuk driver dengan driver profile)
- user_id → referensi ke tabel user (field baru, nullable untuk driver tanpa driver profile)
- Driver dengan profile → driver_id
- Driver tanpa profile → user_id

### Lokasi File
- `backend/src/handler/rest/driver_web/` - handler baru
- `backend/src/usecase/` - usecase baru atau extend trip usecase

### Frontend Driver - Scan Page

Frontend driver perlu handle URL dengan query params `?order_id=xxx`.

### Driver Trip List
Driver melihat trips mereka via endpoint yang sudah ada:
- `GET /driver/trips` - Trips aktif
- `GET /driver/trips/history` - Semua trips

#### Handle di App Mount
Di `frontend/driver/src/App.tsx` atau router:
- Cek URL query params `order_id`
- Jika ada dan user belum login → redirect ke login, simpan order_id di localStorage
-Jika ada dan user sudah login → redirect ke `/scan` page

#### Route Baru
- Route: `/scan` - Halaman konfirmasi scan
- Tampilkan order details (customer, origin, destination, weight, koli)
- Tombol "Terima Order" → call `/driver/receive-order`
- Success → redirect ke trip detail `/trip/:id`
- Error → tampilkan error

#### Response Handling
- Success → Redirect ke trip detail page `/trip/{trip_id}`
- Error → Tampilkan error message dengan retry option

#### lokasi File
- `frontend/driver/src/App.tsx` - handle query params di startup
- `frontend/driver/src/services/order/api.tsx` - Tambahkan API scanOrder

---

## Tasklist

- [x] ##1 - Backend: Modifikasi /auth/register untuk support role driver
  - Modifikasi `backend/src/handler/rest/auth/request_signup.go`
  - Jika `role=driver`, tidak buat company baru, set CompanyID null

- [x] ##1 - Frontend Driver: Signup Page
  - Buat signup page
  - Tambah route
  - Tambah API mutation

- [x] ##2 - Frontend Admin: DriverUserFormModal
  - Buat component baru untuk update user account driver
  - Integrasi di DriverListPage

- [x] ##3 - Frontend Admin: Exclude role driver di Team user list
  - Tambahkan filter `not_role: "driver"` di TeamScreen

- [x] ##4 - Frontend Admin: QR Code di Print Order
  - Tambah import QRCode library
  - Tambahkan QR code di PrintOrderScreen

- [x] ##5 - Backend: /driver/receive-order endpoint
  - Buat handler baru di driver_web
  - Buat usecase untuk scan dan buat trip

- [x] ##6 - Backend: Create Trip + Dispatch (1 langkah)
  - Ubah proses create trips agar langsung dispatch juga
  - Request sama, tidak perlu endpoints terpisah

- [x] ##7 - Frontend Admin: Reassign Driver (Fitur Baru)
  - Ganti driver yang sudah di-assign ke trip
  - Di halaman detail trip
  - Pilih driver baru

- [x] ##5 - Frontend Driver: Handle scan dari URL params
  - Tambah handle order_id di App.tsx startup
  - Tambah API scanOrder di order service

- [x] ##8 - Backend: Trip Reassign Driver
  - Endpoint untuk reassign driver
  - Validasi trip status
  - Update driver di trip
  - Redirect ke trip detail setelah success