# Feedback V2 - Company Type Inhouse (Frontend Admin)

## Tanggal: 2026-04-14

---

## Overview

Penambahan company type `inhouse` yang tidak memiliki customer dan menggunakan address di level company untuk origin/destination order.

---

## Perubahan di Backend

### 1. Company Type Options

| Value | Label | Deskripsi |
|-------|-------|-----------|
| `3pl` | 3PL | Third Party Logistics - memiliki customer |
| `carrier` | Carrier | Carrier - memiliki customer |
| `inhouse` | Inhouse | Perusahaan internal - tidak memiliki customer |

### 2. Address Entity

Address sekarang bisa milik customer atau company (inhouse).

**Schema:**
```typescript
interface Address {
  id: string;
  customer_id: string | null;      // Untuk 3pl/carrier
  company_id: string | null;       // Untuk inhouse
  type: 'pickup_point' | 'drop_point' | null;  // Untuk inhouse saja
  name: string;
  address: string;
  region_id: string;
  contact_name: string;
  contact_phone: string;
  is_active: boolean;
}
```

**Address Association:**
| Company Type | customer_id | company_id | type |
|-------------|-------------|------------|------|
| 3pl/Carrier | ✅ Required | ❌ Null | null |
| Inhouse | ❌ Null | ✅ Required | `pickup_point` / `drop_point` |

---

## Implikasi di Frontend

### 1. Onboarding - Step 1 (Company Profile)

**Page:** `/onboarding/step-1`

**Perubahan:**
- Tambahkan opsi `inhouse` di dropdown company type
- Jika `inhouse` selected, sembunyikan/hidden step terkait customer creation

**UI Components:**
- Company Type Dropdown: `['3pl', 'carrier', 'inhouse']` → labels: `['3PL', 'Carrier', 'Inhouse']`

---

### 2. Address Management

**Page:** `/settings/addresses` atau `/settings/customers/:customerId/addresses`

**Perubahan:**

#### A. Untuk 3pl/Carrier (existing):
- Address dibuat di dalam context customer
- Tidak ada perubahan UI

#### B. Untuk Inhouse Company:
- Address dibuat di level company (tidak ada customer)
- Tambahkan field `type` dropdown: `pickup_point`, `drop_point`

**UI Components:**

```
Address Form:
├── Name (text)
├── Address (textarea)
├── Region (dropdown - existing)
├── Contact Name (text)
├── Contact Phone (text)
├── Type (dropdown) ← NEW - only for inhouse
│   ├── pickup_point → "Pickup Point"
│   └── drop_point → "Drop Point"
└── Status (toggle - active/inactive)
```

**List View:**
- Untuk inhouse company: tampilkan column "Type" dengan badge:
  - `pickup_point` → 🏭 Badge "Pickup Point"
  - `drop_point` → 📍 Badge "Drop Point"

---

### 3. Order Creation

**Page:** `/orders/new` atau `/orders/create`

**Perubahan:**

#### Customer Field (Conditional)

| Company Type | customer_id Required | Notes |
|-------------|---------------------|-------|
| 3pl/Carrier | ✅ Yes | Select existing customer |
| Inhouse | ❌ No | Hidden/disabled, order tanpa customer |

#### Address Selection (Conditional)

**3pl/Carrier:**
- Origin: dropdown dari customer addresses
- Destination: dropdown dari customer addresses

**Inhouse:**
- Origin: dropdown dari company addresses (filter: type=`pickup_point`)
- Destination: dropdown dari company addresses (filter: type=`drop_point`)

**UI Components:**

```
Origin Address:
├── Label: "Pickup Address"
├── For 3pl/Carrier: Select from customer addresses
└── For Inhouse: Select from company addresses (type=pickup_point)

Destination Address:
├── Label: "Delivery Address"
├── For 3pl/Carrier: Select from customer addresses
└── For Inhouse: Select from company addresses (type=drop_point)
```

---

### 4. Filter/Validation Messages

**Perubahan di order form:**

- Jika company type = `inhouse` dan user mencoba select customer:
  - Show info: "Customer tidak diperlukan untuk company inhouse"

- Jika company type = `inhouse` dan origin address bukan pickup_point:
  - Show error: "Origin harus menggunakan address dengan type Pickup Point"

- Jika company type = `inhouse` dan destination address bukan drop_point:
  - Show error: "Destination harus menggunakan address dengan type Drop Point"

---

## User Flow Summary

### Inhouse Company Flow

```
1. Onboarding → Select "Inhouse" as company type
2. Settings → Create Company Addresses (pickup_point, drop_point)
3. Orders → Create Order
   - customer_id: hidden/optional
   - origin: select from company addresses (pickup_point only)
   - destination: select from company addresses (drop_point only)
```

### 3pl/Carrier Company Flow (Existing)

```
1. Onboarding → Select "3PL" or "Carrier" as company type
2. Settings → Create Customers → Create Customer Addresses
3. Orders → Create Order
   - customer_id: required
   - origin: select from customer addresses
   - destination: select from customer addresses
```

---

## API Endpoints

### GET /addresses
**Query Params:**
- `customer_id` (optional) - untuk 3pl/carrier
- `type` (optional) - filter by type: `pickup_point`, `drop_point` (untuk inhouse)

> **Note**: Filtering dilakukan di **usecase layer** berdasarkan company type:
> - **Inhouse**: Filter berdasarkan `company_id` (dari session) dan `type` (dari query params)
> - **3pl/Carrier**: Filter berdasarkan `customer_id` (dari query params)

### POST /addresses
**Request Body:**
```json
{
  "name": "Gudang Surabaya",
  "address": "Jl. ...",
  "region_id": "...",
  "contact_name": "...",
  "contact_phone": "...",
  "type": "pickup_point"  // hanya untuk inhouse
}
```

---

## Implementation Status (Frontend Admin)

| Component | Status | Notes |
|-----------|--------|-------|
| Company Type Options | ✅ Done | Added `inhouse` option in `options.tsx` |
| Address Type Options | ✅ Done | Added `addressTypeOptions` for pickup_point/drop_point |
| CompanyType Type | ✅ Done | Updated in `services/types.ts` |
| Address Interface | ✅ Done | Added `company_id`, `customer_id`, `type` fields |
| Onboarding Wizard | ✅ Done | Skip customer step for inhouse (4 steps) |

### Remaining Implementation:

1. **Company Detail Page** - Add company-level address management for inhouse
2. **Address Form** - Add type dropdown for inhouse
3. **Address List** - Show type column
4. **Order Form** - Conditional customer/address selection based on company type

---

## Notes

1. **Backward Compatibility**: Untuk company type `3pl` dan `carrier`, behavior tetap sama seperti sekarang
2. **Validation**: Tambahkan validasi di frontend untuk prevent user memilih address yang salah berdasarkan company type
3. **Empty States**:
   - Inhouse: Jika belum ada pickup_point/drop_point → show message "Silakan buat address terlebih dahulu di Settings"
   - Order: Jika company type = inhouse dan tidak ada addresses → disable order creation