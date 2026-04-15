# Feedback V2 - Company Type Inhouse

## Tanggal: 2026-04-14

## Latar Belakang

Discussion tentang penambahan company type `inhouse` yang tidak memiliki customer dan membutuhkan address di level company untuk origin/destination saat order creation.

---

## Design Final

### 1. Company Type

Menambahkan opsi `inhouse` pada field `type` di entity Company.

| Value | Deskripsi |
|-------|-----------|
| `3pl` | Third Party Logistics - memiliki customer |
| `carrier` | Carrier - memiliki customer |
| `inhouse` | Perusahaan internal - tidak memiliki customer |

**Lokasi Perubahan:**
- `backend/entity/company.go` - field `Type` sudah ada
- `backend/src/handler/rest/onboarding/request_step1.go` - validasi `in:3pl,carrier` → `in:3pl,carrier,inhouse`

---

### 2. Address untuk Inhouse

Address entity perlu diperbarui agar bisa digunakan oleh company (inhouse) maupun customer (3pl/carrier).

#### Entity Changes

**File:** `backend/entity/address.go`

```go
type Address struct {
    // ... existing fields ...

    // Untuk inhouse company
    CompanyID uuid.UUID `bun:"company_id,type:uuid" json:"company_id"`
    // Type: pickup_point, drop_point (untuk inhouse)
    // Untuk customer: tidak perlu type (karena sudah relasi ke customer)
    Type      string    `bun:"type" json:"type"`

    // ... existing relations ...
}
```

#### Nullable Fields

| Company Type | CustomerID | CompanyID | Type |
|-------------|------------|-----------|------|
| 3pl/Carrier | Required | Null | (tidak perlu) |
| Inhouse | Null | Required | `pickup_point` / `drop_point` |

#### Address Type Values

| Value | Deskripsi |
|-------|-----------|
| `pickup_point` | Origin address - gudang/hub tempat pickup |
| `drop_point` | Destination address - titik penurunan barang |

---

### 3. Order Creation untuk Inhouse

#### Logic Flow

| Company Type | customer_id | Origin Address | Destination Address |
|-------------|-------------|----------------|---------------------|
| 3pl/Carrier | ✅ Required | Customer addresses | Customer addresses |
| Inhouse | ❌ Optional/Null | Company (type=`pickup_point`) | Company (type=`drop_point`) |

#### Request Changes

**File:** `backend/src/handler/rest/order/request_create.go`

- `customer_id` menjadi optional (tidak required)
- Validasi: jika company type = `inhouse`, origin/destination harus dari company addresses dengan type yang sesuai

#### Validation Logic

```
IF company_type == "inhouse":
    - customer_id is optional
    - origin_address_id must be from company addresses with type="pickup_point"
    - destination_address_id must be from company addresses with type="drop_point"
ELSE (3pl/carrier):
    - customer_id is required
    - origin_address_id must be from customer addresses
    - destination_address_id must be from customer addresses
```

---

## Implementation Plan

### Step 1: Update Company Type Validation
- File: `backend/src/handler/rest/onboarding/request_step1.go`
- Ubah validasi dari `in:3pl,carrier` menjadi `in:3pl,carrier,inhouse`

### Step 2: Update Address Entity
- File: `backend/entity/address.go`
- Tambahkan field `CompanyID` (uuid, nullable)
- Tambahkan field `Type` (string, untuk classify pickup_point/drop_point)

### Step 3: Create Address Migration
- File: `backend/migrations/xxxxxx_alter_address_add_company_id_and_type.sql`
- Tambahkan kolom `company_id` (nullable)
- Tambahkan kolom `type`

### Step 4: Update Address Usecase (Get Addresses)
- File: `backend/src/usecase/address.go`
- Tambahkan filter `company_id` dan `type` di method get addresses
- Jika company type = `inhouse`, query berdasarkan company_id dan type
- Jika company type = `3pl`/`carrier`, query berdasarkan customer_id (existing)

### Step 5: Update Order Creation Request
- File: `backend/src/handler/rest/order/request_create.go`
- Buat customer_id optional
- Tambahkan validasi berdasarkan company type
- Validasi origin/destination address sesuai type untuk inhouse

### Step 6: Update Address Handler (Create)
- File: `backend/src/handler/rest/address/request_create.go`
- customer_id menjadi optional
- Tambahkan field `type` untuk inhouse
- Validasi berdasarkan company type
- Set company_id atau customer_id berdasarkan company type

---

## Implementation Status

| Step | Status | File |
|------|--------|------|
| Step 1 | ✅ Done | `backend/src/handler/rest/onboarding/request_step1.go` |
| Step 2 | ✅ Done | `backend/entity/address.go` |
| Step 3 | ✅ Done | `backend/migrations/20260414000000_alter_address_add_company_id_and_type.up.sql` |
| Step 4 | ✅ Done | `backend/src/usecase/address.go` |
| Step 5 | ✅ Done | `backend/src/handler/rest/order/request_create.go`, `request_shipment.go` |
| Step 6 | ✅ Done | `backend/src/handler/rest/address/request_create.go` |

---

## Notes

1. **Inhouse company tetap membutuhkan vehicle dan driver** untuk operasional
2. **Customer tidak diperlukan** - operasi internal tanpa pihak ketiga
3. **Address di level company** - tidak perlu create customer terlebih dahulu
4. **Multiple addresses** tetap support - company bisa punya banyak pickup_point dan drop_point