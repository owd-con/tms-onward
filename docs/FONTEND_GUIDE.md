# Frontend Development Guide - TMS Onward (Admin/Dispatcher Portal)

Panduan lengkap untuk mengembangkan aplikasi Frontend TMS Onward - Admin/Dispatcher Portal.

---

## 1. Prasyarat

Sebelum memulai development, pastikan sudah terinstall:

- **Node.js** (v20 atau lebih tinggi)
- **npm** atau **yarn** atau **pnpm**
- **Git**

---

## 2. Setup & Installation

### 2.1 Clone Repository

```bash
git clone <repository-url>
cd wms-client
```

### 2.2 Install Dependencies

```bash
npm install
```

### 2.3 Environment Variables

Copy file `.env` dan sesuaikan dengan environment Anda:

```bash
# Copy environment template
cp .env .env.local
```

**Environment Variables yang diperlukan:**

| Variable | Deskripsi | Contoh |
|----------|-----------|--------|
| `VITE_API_URL` | Base URL API backend | `https://api-dev.onward.co.id/warehouse/` |
| `VITE_APP_URL` | Base URL aplikasi | `http://localhost:5173/` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID | `921152398057-xxx.apps.googleusercontent.com` |
| `DEV` | Mode development | `false` |
| `ENABLE_DOM_LOGGER` | Enable DOM logger (optional) | `true` |

**Contoh file `.env.local`:**

```env
DEV=true
VITE_API_URL=http://localhost:8000/warehouse/
VITE_APP_URL=http://localhost:5173/
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### 2.4 Jalankan Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:5173`

---

## 3. Struktur Project (Quick Reference)

```
src/
├── components/          # Komponen UI reusable (global)
│   └── ui/             # Komponen atomic (button, input, table, dll.)
├── platforms/          # Halaman & routing
│   ├── auth/           # Authentication pages
│   └── app/            # Main application pages
│       └── components/ # Domain-specific shared components
│       └── screen/     # Halaman-halaman
│           └── {domain}/
│               ├── {page}.tsx
│               └── components/
│                   ├── detail/    # Khusus detail page
│                   ├── history/   # Khusus history/list page
│                   └── form/      # Modal forms
├── services/           # API & State Management
│   ├── [domain]/       # API slices per domain
│   │   ├── api.tsx     # RTK Query endpoints
│   │   └── hooks.tsx   # Custom hooks
│   ├── store.tsx       # Redux store configuration
│   └── baseQuery.tsx   # Base query dengan auth
├── hooks/              # Custom hooks global
├── utils/              # Utility functions
├── shared/             # Shared types & constants
└── types/              # TypeScript type definitions
```

**Contoh Struktur Domain (trip):**

```
screen/trip/
├── detail.tsx              # Trip detail page
├── history.tsx             # Trip history page
├── waypoint-detail.tsx     # Waypoint detail page
└── components/
    ├── detail/
    │   ├── TripStatsCard.tsx       # Trip stats (distance, duration, waypoints count)
    │   ├── TripInfoCard.tsx        # Trip info (status, vehicle, order, customer + Start Trip button)
    │   ├── WaypointList.tsx        # Waypoints list dengan internal hooks/handlers
    │   ├── WaypointCard.tsx        # Individual waypoint item
    │   └── index.ts
    ├── history/
    │   ├── TripHistoryCard.tsx     # Khusus history page
    │   └── index.ts
    └── form/
        ├── CompleteWaypointForm.tsx
        ├── FailWaypointForm.tsx
        └── index.ts
```

**Pattern:**
- `components/detail/` → Komponen yang hanya dipakai di detail page
- `components/history/` → Komponen yang hanya dipakai di history/list page
- `components/form/` → Modal form yang dipakai di multiple pages dalam domain tersebut

---

## 4. Coding Standards

### 4.1 Naming Conventions

| Type | Convention | Contoh |
|------|------------|--------|
| **Component** | PascalCase | `Button.tsx`, `UserProfile.tsx` |
| **Hook** | camelCase dengan prefix `use` | `usePermission.ts`, `useWarehouse.ts` |
| **Utility Function** | camelCase | `formatDate()`, `calculateTotal()` |
| **Type/Interface** | PascalCase | `ApiResponse`, `UserPermission` |
| **Constant** | UPPER_SNAKE_CASE | `API_BASE_URL`, `MAX_RETRY` |
| **File/Folder** | kebab-case | `user-profile/`, `api-client.ts` |

### 4.2 Component Structure

**Struktur dasar komponen:**

```tsx
import { memo, type ComponentProps } from "react";
import clsx from "clsx";

// 1. Type definitions
interface MyComponentProps {
  title: string;
  variant?: "primary" | "secondary";
  isLoading?: boolean;
}

// 2. Component definition dengan memo untuk performance
export const MyComponent = memo(({
  title,
  variant = "primary",
  isLoading = false,
}: MyComponentProps) => {

  // 3. Hooks (jika ada)
  // const { data } = useSomeHook();

  // 4. Event handlers
  const handleClick = () => {
    // handle click
  };

  // 5. Derived values
  const className = clsx(
    "base-class",
    variant === "primary" && "primary-class",
    isLoading && "loading-class"
  );

  // 6. Render
  return (
    <div className={className}>
      {isLoading ? "Loading..." : title}
    </div>
  );
});
```

**Catatan:**
- Tidak perlu `displayName` di modern React + TypeScript
- DevTools sudah bisa menampilkan nama component dari function name
- `memo` sudah cukup untuk performance optimization

### 4.3 Import Order

Urutkan import dalam kelompok berikut:

```tsx
// 1. React & core libraries
import { memo, useEffect } from "react";
import { useSelector } from "react-redux";

// 2. Third-party libraries
import clsx from "clsx";
import { HiUser } from "react-icons/hi2";
import dayjs from "dayjs";

// 3. Internal imports (gunakan alias @)
import { Button } from "@/components/ui/button";
import { usePermission } from "@/hooks/usePermission";
import { useWarehouse } from "@/services/warehouse/hooks";
import type { Warehouse } from "@/services/types";

// 4. Relative imports
import { LocalComponent } from "./component";
import { localHelper } from "./helper";
```

### 4.4 TypeScript Guidelines

- Selalu gunakan **type** untuk tipe primitif dan object
- Gunakan **interface** untuk object shape yang bisa di-extend
- Hindari `any`, gunakan `unknown` jika tipe tidak diketahui
- Export tipe yang akan digunakan di file lain

```typescript
// ✅ Good
type Status = "pending" | "success" | "error";

interface User {
  id: string;
  name: string;
  email: string;
}

// ❌ Bad
type Status = any;
interface User {
  [key: string]: any; // Hindari index signature jika tidak perlu
}
```

---

## 5. Patterns & Best Practices

### 5.1 API Service dengan RTK Query

**Pattern untuk API Service dengan RTK Query:**

```typescript
// src/services/[domain]/api.tsx
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/services/baseQuery";

export const myDomainApi = createApi({
  reducerPath: "myDomainApi",
  baseQuery,
  endpoints: (builder) => ({
    // GET - List data (params fleksibel)
    getList: builder.query({
      query: (params) => ({   // params - tanpa type definition
        url: `/my-domain`,
        method: "GET",
        params,
      }),
    }),

    // GET - Detail data (extract id, sisanya params)
    getDetail: builder.query({
      query: ({ id, ...params }) => ({
        url: `/my-domain/${id}`,
        method: "GET",
        params,
      }),
    }),

    // POST - Create data
    create: builder.mutation({
      query: (payload) => ({      // payload - tanpa type definition
        url: "/my-domain",
        method: "POST",
        body: payload,
      }),
    }),

    // PUT - Update data (extract id, sisanya payload)
    update: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/my-domain/${id}`,
        method: "PUT",
        body: payload,
      }),
    }),

    // DELETE - Remove data
    remove: builder.mutation({
      query: ({ id, ...payload }) => ({  // extract id, sisanya payload (biasanya kosong)
        url: `/my-domain/${id}`,
        method: "DELETE",
        body: payload,
      }),
    }),
  }),
});

// Export hooks
export const {
  useLazyGetListQuery,
  useLazyGetDetailQuery,
  useCreateMutation,
  useUpdateMutation,
  useRemoveMutation,
} = myDomainApi;
```

**API Pattern Summary:**

| Endpoint Type | Pattern | Penjelasan |
|---------------|---------|-----------|
| **GET List** | `query: (params) => ({ url, params })` | Params fleksibel, tanpa type definition |
| **GET Detail** | `query: ({ id, ...params })` | Extract id untuk URL, sisanya jadi query params |
| **POST Create** | `query: (payload) => body: payload` | Payload langsung jadi body |
| **PUT Update** | `query: ({ id, ...payload }) => body: payload` | Extract id untuk URL, sisanya jadi body |
| **DELETE Remove** | `query: ({ id, ...payload }) => body: payload` | Extract id untuk URL, payload biasanya kosong |

**Kenapa pattern ini?**

| Keuntungan | Penjelasan |
|-----------|-----------|
| ✅ **Fleksibel** | Tidak perlu update type definition saat field berubah |
| ✅ **Konsisten** | Semua endpoint follow pattern yang sama |
| ✅ **Clean Code** | Less boilerplate, lebih ringkas |
| ✅ **Form-Driven** | Validation di form layer, bukan di API |

**JANGAN lakukan:**

| ❌ Don't | ✅ Do |
|----------|--------|
| Jangan define type spesifik untuk params/payload | Gunakan tanpa type definition |
| Jangan use type yang terlalu ketat | Biarkan form yang handle validation |
| Jangan gunakan `data` sebagai nama variable | Gunakan `payload` atau `params` |
| Jangan gunakan generic type `<T>` di createCrudHook | Gunakan `createCrudHook()` tanpa parameter |

### 5.2 Custom Hooks Pattern

**Hook CRUD sederhana:**

```typescript
// src/services/[domain]/hooks.tsx
import { createCrudHook } from "@/services/hooks/createCrudHook";
import {
  useLazyGetListQuery,
  useCreateMutation,
  // ... imports lainnya
} from "./api";

export const useMyDomain = createCrudHook({
  useLazyGetQuery: useLazyGetListQuery,
  useLazyShowQuery: useLazyGetDetailQuery,
  useCreateMutation: useCreateMutation,
  useUpdateMutation: useUpdateMutation,
  useRemoveMutation: useRemoveMutation,
  entityName: "myDomain",
});
```

**Menggunakan hooks di component:**

```tsx
import { useMyDomain } from "@/services/myDomain/hooks";
import { useEffect } from "react";

const MyPage = () => {
  const { get: getList, getResult } = useMyDomain();

  useEffect(() => {
    getList({ page: 1, limit: 10 });
  }, []);

  return (
    <div>
      {getResult?.data?.data?.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
};
```

**Catatan:**
- `createCrudHook` tidak memerlukan generic type parameter `<T>`
- Tipe akan di-infer otomatis dari API response
- Import entity type hanya diperlukan jika digunakan di component lain

**Custom Operations Pattern (for non-CRUD endpoints):**

```typescript
// src/services/[domain]/hooks.tsx
import { createCrudHook } from "@/services/hooks/createCrudHook";
import {
  useLazyGetQuery,
  useCustomMutation1,
  useCustomMutation2,
} from "./api";

export const useMyDomain = createCrudHook({
  useLazyGetQuery: useLazyGetQuery,
  customOperations: {
    // Mutation yang butuh id (format: { id, ...payload })
    activate: {
      hook: useActivateMutation,
      requiresId: true, // default true
    },
    // Mutation yang menerima payload langsung
    step1: {
      hook: useStep1Mutation,
      requiresId: false, // tidak butuh { id, ...payload }
    },
  },
  entityName: "myDomain",
});
```

**Usage dengan customOperations:**

```tsx
const { activate, step1 } = useMyDomain();

// requiresId: true → pass { id, ...payload }
await activate({ id: "123", status: "active" });

// requiresId: false → pass payload langsung
await step1({ name: "test", value: 123 });
```

**Additional Queries Pattern (for multiple GET endpoints):**

Untuk domain yang memiliki banyak GET endpoints tapi tidak punya standard list endpoint (seperti report, logs, images):

```typescript
// src/services/[domain]/hooks.tsx
import { createCrudHook } from "@/services/hooks/createCrudHook";
import {
  useLazyGetOrderReportQuery,
  useLazyGetTripReportQuery,
  // ... lainnya
} from "./api";

// Noop query - domain tidak punya standard list endpoint
const useNoopQuery = () => [
  async () => undefined,
  {
    data: undefined,
    isLoading: false,
    isFetching: false,
    isSuccess: false,
    isError: false,
  },
] as const;

export const useMyDomain = createCrudHook({
  useLazyGetQuery: useNoopQuery,  // Required tapi tidak dipakai
  additionalQueries: {
    getOrderReport: useLazyGetOrderReportQuery,
    getTripReport: useLazyGetTripReportQuery,
    getRevenueReport: useLazyGetRevenueReportQuery,
  },
  entityName: "myDomain",
});
```

**Usage dengan additionalQueries:**

```tsx
const { getOrderReport, getOrderReportResult } = useMyDomain();

// Result fields: {operationName}Result
const data = getOrderReportResult?.data;

await getOrderReport({ start_date: "2024-01-01", end_date: "2024-01-31" });
```

### 5.3 Form Handling Pattern

**Menggunakan form actions:**

```tsx
import { useFormActions } from "@/services/form/hooks";
import { useCreateMutation } from "@/services/myDomain/api";

const CreateForm = () => {
  const { requesting, success, failureWithTimeout } = useFormActions();
  const [create] = useCreateMutation();

  const handleSubmit = async (data: FormData) => {
    requesting();

    try {
      const result = await create(data).unwrap();

      if (result.error) {
        failureWithTimeout(result.error);
        return;
      }

      success();
      // Navigate atau show success message
    } catch (error) {
      failureWithTimeout(error);
    }
  };

  return <form onSubmit={handleSubmit}>{/* form fields */}</form>;
};
```

### 5.4 Permission Checking Pattern

```tsx
import { usePermission } from "@/hooks/usePermission";

const MyPage = () => {
  const { canManage, canRead } = usePermission();

  // Check permission untuk action
  const canCreate = canManage("warehouse");
  const canView = canRead("warehouse");

  return (
    <div>
      {canCreate && (
        <Button onClick={handleCreate}>Create New</Button>
      )}

      {canView ? (
        <DataList />
      ) : (
        <div>You don't have permission to view this page</div>
      )}
    </div>
  );
};
```

### 5.5 Table List Page Pattern

**Pattern untuk list page dengan table:**

Gunakan `useTable` hook dengan `table.config.tsx` untuk konsistensi.

**1. Buat table config:**

```typescript
// src/platforms/app/screen/my-domain/components/table.config.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components";
import config from "@/services/table/const";
import { statusBadge } from "@/shared/helper";

const createTableConfig = ({
  onReload,
  onClick,
  filter,
}: {
  onReload: () => void;
  filter?: Record<string, unknown>;
  onClick: (e: any) => void;
}) => ({
  ...config,
  url: "/my-endpoint",
  onReload,
  filter,
  columns: {
    name: {
      title: "Name",
      sortable: true,
      headerClass: "text-xs capitalize!",
      class: "p-4!",
      component: (row: { name: string }) => (
        <div className="text-xs font-normal tracking-wide capitalize cursor-pointer">
          <span className="font-semibold">{row?.name || "-"}</span>
        </div>
      ),
    },
    status: {
      title: "Status",
      sortable: false,
      headerClass: "text-xs capitalize!",
      class: "p-4!",
      component: (row: { status: string }) => (
        <div className="text-xs font-normal tracking-wide capitalize">
          {statusBadge(row?.status)}
        </div>
      ),
    },
    actions: {
      title: "Actions",
      sortable: false,
      headerClass: "text-xs capitalize!",
      class: "p-4!",
      component: (row: any) => (
        <div className="flex place-items-center gap-1">
          <Button size="xs" onClick={() => onClick(row)}>
            View
          </Button>
        </div>
      ),
    },
  },
});

export default createTableConfig;
```

**2. Gunakan di list page:**

```tsx
// src/platforms/app/screen/my-domain/MyDomainListPage.tsx
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import useTable from "@/services/table/hooks";
import type { TableConfig } from "@/services/table/const";

import { Button } from "@/components";
import { Page } from "../../../components/layout";
import createTableConfig from "./components/table.config";

const MyDomainListPage = () => {
  const navigate = useNavigate();

  const tableConfig = useMemo(() => {
    return createTableConfig({
      onReload: () => {
        Table.boot();
      },
      onClick: (e) => {
        const value = e as { id: string | "" };
        navigate(`/a/my-domain/${value?.id}`);
      },
    });
  }, []);

  const Table = useTable("myDomain", tableConfig as TableConfig<unknown>);

  return (
    <Page className="h-full flex flex-col min-h-0">
      <Page.Header
        title="My Domain"
        titleClassName="!text-2xl"
        subtitle="Manage your data"
        action={
          <Button
            variant="primary"
            onClick={() => navigate("/a/my-domain/create")}
          >
            + Add New
          </Button>
        }
      />
      <Page.Body className="flex-1 flex flex-col space-y-4 min-h-0">
        <div className="w-full flex gap-4 bg-base-100 p-2 rounded-xl">
          <div className="w-full">
            <Table.Tools>
              {/* Filter components can be added here */}
            </Table.Tools>
          </div>
        </div>
        <div className="bg-base-100 rounded-xl shadow-sm w-full">
          <Table.Render />
          <Table.Pagination />
        </div>
      </Page.Body>
    </Page>
  );
};

export default MyDomainListPage;
```

**Catatan:**
- Gunakan `action` (singular) bukan `actions` di Page.Header
- Table config harus ditaruh di `components/table.config.tsx`
- Gunakan `useMemo` untuk tableConfig
- Gunakan `useTable` hook dari `@/services/table/hooks`

### 5.6 Table Filter Pattern

**Pattern untuk filter pada table:**

Gunakan `TableFilters` component dengan `RemoteSelect` untuk filter dropdown.

**1. Buat filter component:**

```tsx
// src/platforms/app/screen/my-domain/components/filter.tsx
import { useMemo, useState } from "react";

import { RemoteSelect } from "@/components";
import TableFilters from "@/components/ui/table/filter";
import type { SelectOptionValue } from "@/shared/types";
import { statusOptions } from "@/shared/options";

type CommonFilters = {
  status?: string;
};

interface TableFilterProps {
  table: {
    filter: (params: Partial<CommonFilters>) => void;
    State: {
      loading: boolean;
      filter: Partial<CommonFilters>;
    };
  };
}

const TableFilter: React.FC<TableFilterProps> = ({ table }) => {
  const current = useMemo(
    () => table.State?.filter ?? {},
    [table.State?.filter]
  );

  // Initialize state from current filter values
  const [status, setStatus] = useState<SelectOptionValue | null>(() => {
    const value = current.status;
    return value
      ? statusOptions.find((opt) => opt.value === value) ?? null
      : null;
  });

  const handleClear = () => {
    setStatus(null);
    table.filter({ status: "" });
  };

  const handleFilter = () => {
    table.filter({
      status: status?.value ? String(status.value) : "",
    });
  };

  const isDirty = useMemo(() => {
    const currentStatus = current.status ?? "";
    const newStatus = status?.value ? String(status.value) : "";
    return newStatus !== currentStatus;
  }, [status, current.status]);

  const anyActive = !!current.status;

  return (
    <TableFilters
      isActive={anyActive}
      isDirty={isDirty}
      handleClear={handleClear}
      handleFilter={handleFilter}
    >
      <div className="grid grid-cols-1 gap-3">
        <RemoteSelect<SelectOptionValue>
          label="Status"
          placeholder="Filter Status"
          data={statusOptions}
          value={status}
          onChange={(opt) => setStatus(opt)}
          onClear={() => setStatus(null)}
          getLabel={(item) => item?.label ?? ""}
          renderItem={(item) => item?.label}
        />
      </div>
    </TableFilters>
  );
};

export default TableFilter;
```

**2. Gunakan di list page:**

```tsx
// src/platforms/app/screen/my-domain/MyDomainListPage.tsx
import { Page } from "../../../components/layout";
import createTableConfig from "./components/table.config";
import TableFilter from "./components/filter";

// ... dalam component
<Table.Tools>
  <TableFilter table={Table} />
</Table.Tools>
```

**Catatan:**
- `isDirty` - enable/disable tombol Apply (hanya enable jika nilai berubah)
- `anyActive` - menunjukkan filter aktif (tombol funnel berwarna biru)
- `handleFilter` - apply filter ke table
- `handleClear` - reset semua filter
- Gunakan `RemoteSelect` untuk dropdown filter

### 5.7 Modal Form Pattern

**Pattern untuk form modal dengan create/update mode:**

Gunakan modal untuk form dengan field sedikit (1-10 fields). Untuk form kompleks dengan banyak field, gunakan halaman terpisah.

**1. Buat modal form component:**

```tsx
// src/platforms/app/screen/my-domain/components/form/MyDomainFormModal.tsx
/* eslint-disable react-hooks/exhaustive-deps */

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import type { RootState } from "@/services/store";
import { useSelector } from "react-redux";

import { Button, Input, Modal } from "@/components";
import { useMyDomain } from "@/services/myDomain";
import type { MyEntity } from "@/services/types/entities";

// 1. Type definitions untuk ref
export interface MyDomainFormModalRef {
  buildPayload: () => {
    name: string;
    email?: string;
  };
  reset: () => void;
}

// 2. Props interface
interface MyDomainFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  mode: "create" | "update";
  data?: MyEntity;
}

// 3. Component dengan forwardRef
const MyDomainFormModal = forwardRef<MyDomainFormModalRef, MyDomainFormModalProps>(
  ({ open, onClose, onSuccess, mode = "create", data }, ref) => {
    const FormState = useSelector((state: RootState) => state.form);

    // 4. Gunakan hook untuk CRUD operations
    const { create, update, createResult, updateResult } = useMyDomain();

    // 5. State management untuk form fields
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    // 6. Build payload method
    const buildPayload = () => ({
      name,
      email: email || undefined,
    });

    // 7. Reset form method
    const reset = () => {
      setName("");
      setEmail("");
    };

    // 8. Expose methods via ref
    useImperativeHandle(ref, () => ({
      buildPayload,
      reset,
    }));

    // 9. Populate form untuk update mode
    useEffect(() => {
      if (mode === "update" && data) {
        setName(data.name ?? "");
        setEmail(data.email ?? "");
      }
    }, [data, mode]);

    // 10. Reset form saat modal open untuk create
    useEffect(() => {
      if (open && mode === "create") {
        reset();
      }
    }, [open, mode]);

    // 11. Form submission handler
    const handleSubmit = async (e: any) => {
      e.preventDefault();
      const payload = buildPayload();

      if (mode === "create") {
        await create(payload);
      } else {
        await update({ id: data!.id, ...payload });
      }
    };

    // 12. Close modal on success
    useEffect(() => {
      if (createResult?.isSuccess || updateResult?.isSuccess) {
        onSuccess?.();
        onClose();
      }
    }, [createResult?.isSuccess, updateResult?.isSuccess]);

    // 13. Handle close with reset
    const handleClose = () => {
      reset();
      onClose();
    };

    // 14. Validation
    const isFormValid = name.trim() !== "";
    const isLoading = createResult?.isLoading || updateResult?.isLoading;

    // 15. Render
    return (
      <Modal.Wrapper
        open={open}
        onClose={handleClose}
        closeOnOutsideClick={false}
        className="max-w-2xl"
      >
        <Modal.Header className="mb-2">
          <div className="text-xl font-bold">
            {mode === "create" ? "Add New" : "Edit"}
          </div>
          <div className="text-sm text-base-content/60">
            {mode === "create" ? "Fill in the form below" : "Update information"}
          </div>
        </Modal.Header>

        <form onSubmit={handleSubmit}>
          <Modal.Body className="max-h-[60vh] overflow-y-auto">
            <div className="space-y-4">
              <Input
                label="Name *"
                placeholder="Enter name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={FormState?.errors?.name as string}
                required
              />

              <Input
                label="Email"
                placeholder="email@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={FormState?.errors?.email as string}
                className="mt-3"
              />
            </div>
          </Modal.Body>

          <Modal.Footer>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                disabled={!isFormValid}
              >
                {mode === "create" ? "Create" : "Update"}
              </Button>
            </div>
          </Modal.Footer>
        </form>
      </Modal.Wrapper>
    );
  }
);

// Named export (no displayName needed in modern React)
export { MyDomainFormModal };
```

**2. Gunakan di list page:**

```tsx
// src/platforms/app/screen/my-domain/MyDomainListPage.tsx
import { useMemo } from "react";

import { Button, useEnigmaUI } from "@/components";
import useTable from "@/services/table/hooks";
import type { TableConfig } from "@/services/table/const";
import type { MyEntity } from "@/services/types/entities";

import { Page } from "../../../components/layout";
import createTableConfig from "./components/table/table.config";
import { MyDomainFormModal } from "./components/form/MyDomainFormModal";

const MyDomainListPage = () => {
  const { openModal, closeModal } = useEnigmaUI();

  const tableConfig = useMemo(() => {
    return createTableConfig({
      onReload: () => {
        Table.boot();
      },
      onClick: (e: MyEntity) => {
        openUpdate(e);
      },
    });
  }, []);

  const Table = useTable("myDomain", tableConfig as TableConfig<unknown>);

  // Open create modal
  const openCreate = () => {
    openModal({
      id: "create-my-domain",
      content: (
        <MyDomainFormModal
          open={true}
          onClose={() => closeModal("create-my-domain")}
          onSuccess={() => Table.boot()}
          mode="create"
        />
      ),
    });
  };

  // Open update modal
  const openUpdate = (entity: MyEntity) => {
    openModal({
      id: "update-my-domain",
      content: (
        <MyDomainFormModal
          open={true}
          onClose={() => closeModal("update-my-domain")}
          onSuccess={() => Table.boot()}
          mode="update"
          data={entity}
        />
      ),
    });
  };

  return (
    <Page className="h-full flex flex-col min-h-0">
      <Page.Header
        title="My Domain"
        titleClassName="!text-2xl"
        subtitle="Manage your data"
        action={
          <Button variant="primary" onClick={openCreate}>
            + Add New
          </Button>
        }
      />
      <Page.Body className="flex-1 flex flex-col space-y-4 min-h-0">
        <div className="bg-base-100 rounded-xl shadow-sm w-full">
          <Table.Render />
          <Table.Pagination />
        </div>
      </Page.Body>
    </Page>
  );
};

export default MyDomainListPage;
```

**Catatan:**
- Modal menangani submission logic secara internal menggunakan hook
- Parent hanya perlu pass `onSuccess` callback untuk refresh table
- Modal otomatis close setelah sukses
- **Tidak perlu toast notification** - modal langsung close, user tidak akan melihat toast
- Error ditampilkan via FormState di field form (bukan toast)
- Gunakan `forwardRef` pattern jika perlu expose methods
- Untuk master data, gunakan `is_active` badge (bukan `status`)
- Route create di `_subrouter.tsx` tidak perlu (comment out)

**Kapan gunakan Modal vs Halaman:**

| Scenario | Pattern |
|----------|---------|
| 1-5 fields sederhana | ✅ Modal |
| 6-10 fields dengan grouping | ✅ Modal |
| 10+ fields / kompleks | ❌ Halaman terpisah |
| Butuh banyak real-estate | ❌ Halaman terpisah |
| Multi-step wizard | ❌ Halaman terpisah |

### 5.8 FormState & Error Handling Pattern

**Pattern untuk form error handling dengan Redux state:**

Backend mengembalikan error dengan format structured yang langsung bisa di-map ke FormState di frontend.

#### 1. FormState Pattern

**Access FormState dari Redux:**

```tsx
import { useSelector } from "react-redux";
import type { RootState } from "@/services/store";

const MyFormComponent = () => {
  const FormState = useSelector((state: RootState) => state.form);

  // JANGAN gunakan local errors state untuk validation
  // GUNAKAN FormState dari Redux
};
```

**Menampilkan error pada field:**

```tsx
// Untuk form dengan array items (users, vehicles, drivers, pricing)
<Input
  label="Name"
  value={user.name}
  onChange={(e) => handleUserChange(index, "name", e.target.value)}
  error={(FormState?.errors as any)?.[`users.${index}.name`]}
/>

// Untuk form regular/single object
<Input
  label="Email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={FormState?.errors?.email as string}
/>

// Untuk select field (manual error display karena tidak ada prop error)
<select
  value={role}
  onChange={(e) => setRole(e.target.value)}
>
  <option value="staff">Staff</option>
  <option value="driver">Driver</option>
</select>
<span className="text-error text-xs mt-1 block">
  {(FormState?.errors as any)?.[`users.${index}.role`]}
</span>
```

#### 2. Backend Error Format

**Error Pattern:**
```
collection.index.field.error_type
```

| Error Type | Arti | Contoh |
|------------|------|--------|
| `required` | Field wajib diisi | `name.required` |
| `invalid` | Format tidak valid | `email.invalid`, `phone.invalid` |
| `unique` | Value sudah ada | `email.unique`, `plate_number.unique` |
| `not_found` | Data tidak ditemukan | `customer_id.not_found` |

**Contoh Error Response:**

```json
{
  "errors": {
    "users.0.name.required": "Name is required.",
    "users.0.email.unique": "Email already exists.",
    "vehicles.1.plate_number.unique": "Plate number already exists.",
    "drivers.0.phone.invalid": "Invalid phone number format."
  }
}
```

**Mapping ke FormState:**

```typescript
// Backend error: "users.0.name.required"
// Frontend key: "users.0.name"
error={(FormState?.errors as any)?.[`users.${index}.name`]}
```

#### 3. Field Naming Convention

**Backend (Go) menggunakan snake_case, Frontend (TypeScript) menggunakan camelCase:**

| Backend JSON (snake_case) | Frontend Variable (camelCase) |
|---------------------------|------------------------------|
| `plate_number` | `plateNumber` |
| `license_number` | `licenseNumber` |
| `origin_city_id` | `originCityId` |
| `dest_city_id` | `destCityId` |
| `customer_id` | `customerId` |
| `confirm_password` | `confirmPassword` |
| `vehicle_type` | `vehicleType` |
| `capacity_weight` | `capacityWeight` |
| `capacity_volume` | `capacityVolume` |

**Implementasi:**

```typescript
// 1. Frontend interface (camelCase)
interface VehicleFormData {
  plateNumber: string;
  vehicleType: string;
  capacityWeight: string;
}

// 2. Saat kirim ke backend, convert ke snake_case
const batchPayload = {
  vehicles: vehicles.map((v) => ({
    plate_number: v.plateNumber,
    vehicle_type: v.vehicleType,
    capacity_weight: Number(v.capacityWeight),
  })),
};

// 3. Error keys dari backend pakai snake_case
error={(FormState?.errors as any)?.[`vehicles.${index}.plate_number`]}
error={(FormState?.errors as any)?.[`vehicles.${index}.vehicle_type`]}
```

#### 4. Best Practices

| Do | Don't |
|-----|-------|
| ✅ Gunakan `FormState` dari Redux | ❌ JANGAN gunakan local `errors` state |
| ✅ Error key: `collection.${index}.field` (array) | ❌ JANGAN manual map error |
| ✅ Error key: `field` (single object) | ❌ JANGAN parse error message |
| ✅ Convert camelCase → snake_case saat payload | ❌ JANGAN lupa konversi field names |

---

*Yang perlu diperhatikan:*
- Error di Redux `state.form.errors` otomatis di-set oleh baseQuery saat API error
- Tidak perlu manual mapping error message → cukup akses via FormState key
- Pastikan snake_case untuk field names di FormState keys

---

### 5.9 Self-Fetching Components Pattern

**Pattern untuk component yang mengambil data sendiri (bukan diteruskan dari parent):**

Gunakan pattern ini untuk component yang membutuhkan data spesifik dan reusable across different pages.

**Hook Types:**

| Tipe Hook | Nama Properti | Contoh |
|------------|---------------|--------|
| **Standard CRUD** | Dengan alias (`show: showX`, `getResult: showXResult`) | `useOrder`, `useTrip` |
| **Custom Hook** | Nama langsung (`getX`, `getXResult`) | `useWaypointLogs`, `useWaypointImages` |

**Standard CRUD Hook (contoh `useOrder`):**

```tsx
const {
  show: showOrder,           // alias untuk operation
  showResult: showOrderResult, // alias untuk result
  cancel: cancelOrder,
  cancelResult: cancelOrderResult,
  // ... CRUD operations lain
} = useOrder();
```

**Custom Hook dengan additionalQueries (contoh `useWaypointLogs`):**

```tsx
// src/services/waypointLogs/hooks.tsx
export const useWaypointLogs = createCrudHook({
  useLazyGetQuery: useNoopQuery,
  additionalQueries: {
    getWaypointLogs: useLazyGetWaypointLogsQuery,  // nama properti langsung
  },
  entityName: "waypointLogs",
});

// Penggunaan di component:
const { getWaypointLogs, getWaypointLogsResult } = useWaypointLogs();
// ^ nama properti langsung, bukan alias
```

**Component Structure:**

```tsx
// src/platforms/app/components/waypoint/WaypointEvidence.tsx
import { memo, useEffect, useState } from "react";
import { useWaypointImages } from "@/services/waypointImages/hooks";
import { waypointEvidenceBadge } from "@/shared/helper";
import type { WaypointImage } from "@/services/types";

interface WaypointEvidenceProps {
  tripId: string;
  className?: string;
}

export const WaypointEvidence = memo<WaypointEvidenceProps>(({
  tripId,
  className,
}) => {
  // Custom hook - nama properti langsung
  const { getWaypointImages, getWaypointImagesResult } = useWaypointImages();
  const [images, setImages] = useState<WaypointImage[]>([]);

  // Fetch
  useEffect(() => {
    if (tripId) {
      getWaypointImages({ trip_id: tripId });
    }
  }, [tripId]);

  // Sync state dengan result
  useEffect(() => {
    if (getWaypointImagesResult?.isSuccess) {
      const data = (getWaypointImagesResult?.data as any)?.data;
      setImages(data || []);
    }
  }, [getWaypointImagesResult]);

  if (images.length === 0) return null;

  return (
    <div className={className}>
      {images.map((image) => (
        <div key={image.id}>
          {waypointEvidenceBadge(image.type)}
        </div>
      ))}
    </div>
  );
};
```

**Usage di Page:**

```tsx
// Parent page TIDAK perlu fetch data
const OrderDetailPage = () => {
  const { id: orderId } = useParams<{ id: string }>();

  return (
    <div>
      {/* Component fetch data sendiri */}
      <WaypointLogsTimeline orderId={orderId} className="lg:col-span-3" />
      {order?.trip?.id && (
        <WaypointEvidence tripId={order.trip.id} className="lg:col-span-3" />
      )}
    </div>
  );
};
```

**Keuntungan:**

| Keuntungan | Penjelasan |
|-----------|-----------|
| ✅ **Reusable** | Component bisa dipakai di halaman mana saja |
| ✅ **Encapsulated** | Logic data fetching terkapsul di component |
| ✅ **Cleaner Parent** | Parent page lebih sederhana, tidak perlu manage state |
| ✅ **Single Responsibility** | Component bertanggung jawab atas data sendiri |
| ✅ **Consistent** | State terpisah, re-render lebih terkontrol |

**Kapan gunakan pattern ini:**

| Scenario | Pattern |
|----------|---------|
| Component spesifik untuk satu entity (logs, images, dll) | ✅ Self-fetching component |
| Data reusable di multiple pages | ✅ Self-fetching component |
| Data hanya dipakai di satu page | ❌ Fetch di page component |
| Data dibutuhkan untuk parent logic | ❌ Fetch di page component |

**Catatan penting untuk custom hook:**
- Nama properti langsung (misal `getWaypointLogs`), bukan alias
- Didefinisikan di `hooks.tsx` menggunakan `additionalQueries`
- Tidak perlu destructure ke nama pendek

---

### 5.10 Detail Page Patterns

**Pattern untuk detail page dengan data fetching:**

```tsx
// src/platforms/app/screen/my-domain/DetailPage.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useMyDomain } from "@/services/myDomain/hooks";
import type { MyEntity } from "@/services/types";

const DetailPage = () => {
  const { id: entityId } = useParams<{ id: string }>();
  const { show: showEntity, showResult: showResult } = useMyDomain();
  const [entity, setEntity] = useState<MyEntity | null>(null);

  // Initial load - dependency array kosong
  useEffect(() => {
    if (entityId) {
      showEntity({ id: entityId });
    }
  }, []); // ✅ Kosong untuk initial load

  // Sync state dengan result
  useEffect(() => {
    if (showResult?.isSuccess) {
      const data = (showResult?.data as any)?.data;
      setEntity(data);
    }
  }, [showResult]);

  // Error & Loading handling langsung dari RTK Query
  if (!entity) {
    return (
      <Page>
        <Page.Header title='Detail' />
        <Page.Body>
          {showResult?.isError ? (
            <ErrorUI message="Failed to load data" />
          ) : (
            <LoadingUI />
          )}
        </Page.Body>
      </Page>
    );
  }

  return <Content entity={entity} />;
};
```

**Best Practices untuk Detail Page:**

| ✅ Do | ❌ Don't |
|-----|-------|
| Dependency array kosong `[]` untuk initial load | JANGAN masukkan ID atau function ke dependencies |
| Gunakan `showResult?.isError` langsung | JANGAN buat local `loadError` state |
| Gunakan `showResult?.isLoading` langsung | JANGAN buat `hasAttemptedLoad` ref |
| Render conditional: `isError ? <Error /> : isLoading ? <Loading /> : <Content />` | JANGAN pakai multiple state untuk error/loading |

---

### 5.11 Helper Functions

**Function yang tersedia di `@/shared/helper.tsx`:**

Helper functions mencakup berbagai jenis: badge formatting, date formatting, text formatting, number conversion, dll.

#### `statusBadge(status)` - Status Badge

Menampilkan badge untuk status dengan warna yang sesuai.

```tsx
import { statusBadge } from "@/shared/helper";

<statusBadge status="pending" />       // Badge kuning (warning)
<statusBadge status="completed" />     // Badge hijau (success)
<statusBadge status="failed" />        // Badge merah (error)
```

#### `waypointEvidenceBadge(type)` - Waypoint Evidence Badge (v2.10)

Menampilkan badge untuk tipe evidence waypoint (POD/Failed).

```tsx
import { waypointEvidenceBadge } from "@/shared/helper";

<waypointEvidenceBadge type="pod" />      // Badge hijau (success) - "POD"
<waypointEvidenceBadge type="failed" />   // Badge merah (error) - "Failed"
```

**Available Badge Variants:**

| Variant | Warna | Usage |
|---------|-------|-------|
| `success` | Hijau | Completed, Active, POD |
| `error` | Merah | Failed, Cancelled, Error |
| `warning` | Kuning | Pending |
| `info` | Biru | Planned, In Transit, Process |
| `primary` | Biru tua | Dispatched |
| `default` | Abu-abu | Default/New |

#### `dateFormat(value, format, nullText)` - Date Formatter

Format tanggal dengan dayjs.

```tsx
import { dateFormat } from "@/shared/helper";

dateFormat(order.created_at);                    // "06/02/2026 10:30"
dateFormat(order.created_at, "DD MMM YYYY");    // "06 Feb 2026"
dateFormat(undefined, "DD MMM YYYY", "-");      // "-"
```

#### `toNum(value)` - String/Number Converter

Convert ke number dengan null handling.

```tsx
import { toNum } from "@/shared/helper";

toNum("123")    // 123
toNum("")       // null
toNum(null)     // null
toNum("abc")    // null
```

#### `formatWaypointLogMessage(message, eventType)` - Waypoint Log Message Formatter (v2.10)

Format message waypoint log dari backend ke human-readable format.

```tsx
import { formatWaypointLogMessage } from "@/shared/helper";

formatWaypointLogMessage("Order dispatched", "order_created")
// "Order dispatched" (gunakan message jika ada)

formatWaypointLogMessage(undefined, "waypoint_arrived")
// "Waypoint Arrived" (convert event_type ke readable format)
```

---

### 5.12 Subfolder Organization Pattern

**Pattern untuk mengorganisir components berdasarkan halaman yang menggunakannya:**

Gunakan subfolder di dalam `components/` untuk mengelompokkan komponen berdasarkan halaman pengguna.

**Struktur Subfolder:**

```
screen/{domain}/
├── {page}.tsx              # Page file
└── components/
    ├── detail/             # Komponen khusus detail page
    ├── history/            # Komponen khusus history/list page
    └── form/               # Modal forms (reusable across pages)
```

**Kapan gunakan subfolder:**

| Subfolder | Gunakan ketika | Contoh |
|-----------|----------------|--------|
| `detail/` | Komponen hanya dipakai di detail page | `TripStatsCard`, `OrderDetailInfo` |
| `history/` | Komponen hanya dipakai di history/list page | `TripHistoryCard`, `OrderListCard` |
| `form/` | Modal form dipakai di multiple page dalam domain | `CreateForm`, `UpdateForm`, `CompleteWaypointForm` |

**Import Pattern:**

```tsx
// Di detail page
import { TripStatsCard } from "./components/detail/TripStatsCard";

// Di history page
import { TripHistoryCard } from "./components/history/TripHistoryCard";

// Di multiple pages
import { CompleteWaypointForm } from "./components/form/CompleteWaypointForm";
```

**Keuntungan:**

| Keuntungan | Penjelasan |
|-----------|-----------|
| ✅ **Scalable** | Mudah menambahkan komponen baru tanpa clutter |
| ✅ **Discoverable** | Lokasi komponen jelas dari namanya |
| ✅ **Maintainable** | Reusable forms di `form/`, page-specific di subfolder masing-masing |

---

### 5.13 Component with Internal Operations Pattern

**Pattern untuk component yang mengelola operations dan hooks secara internal:**

Gunakan pattern ini untuk component yang memiliki operations spesifik (CRUD, mutations) yang seharusnya tidak di-expose ke parent.

**Component Structure:**

```tsx
// src/platforms/app/screen/trip/components/detail/WaypointList.tsx
import { useEffect } from "react";
import { useTrip } from "@/services/driver/hooks";
import { WaypointCard } from "./WaypointCard";

interface WaypointListProps {
  tripId?: string;
  trip: Trip | null;
  onRefetch?: () => void;
  onViewDetails?: (waypointId: string) => void;
}

export const WaypointList = ({
  tripId,
  trip,
  onRefetch,
  onViewDetails,
}: WaypointListProps) => {
  // Hooks untuk mutations di dalam component
  const {
    startWaypoint,
    startWaypointResult,
    arriveWaypoint,
    arriveWaypointResult,
    failWaypoint,
    failWaypointResult,
  } = useTrip();

  // Auto-refetch setelah operation berhasil
  useEffect(() => {
    if (startWaypointResult?.isSuccess) {
      onRefetch?.();
    }
  }, [startWaypointResult?.isSuccess]);

  useEffect(() => {
    if (arriveWaypointResult?.isSuccess) {
      onRefetch?.();
    }
  }, [arriveWaypointResult?.isSuccess]);

  useEffect(() => {
    if (failWaypointResult?.isSuccess) {
      onRefetch?.();
    }
  }, [failWaypointResult?.isSuccess]);

  // Handlers internal
  const handleStartWaypoint = (waypointId: string) => {
    startWaypoint({ id: waypointId });
  };

  const handleArriveWaypoint = (waypointId: string) => {
    arriveWaypoint({ id: waypointId });
  };

  const handleFailWaypoint = (waypointId: string) => {
    onViewDetails?.(waypointId);
  };

  const isLoading =
    startWaypointResult?.isLoading ||
    arriveWaypointResult?.isLoading ||
    failWaypointResult?.isLoading;

  return (
    <>
      <h2>Waypoints</h2>
      {sortedWaypoints.map((waypoint) => (
        <WaypointCard
          key={waypoint.id}
          waypoint={waypoint}
          tripStatus={trip?.status || ""}
          onStartWaypoint={handleStartWaypoint}
          onArriveWaypoint={handleArriveWaypoint}
          onFailWaypoint={handleFailWaypoint}
          isLoading={isLoading}
        />
      ))}
    </>
  );
};
```

**Parent Usage (simplified):**

```tsx
// src/platforms/app/screen/trip/detail.tsx
import { WaypointList } from "./components/detail";

const TripDetailPage = () => {
  const { id } = useParams();
  const { show, showResult, startTrip, startTripResult } = useTrip();

  // Parent TIDAK perlu manage waypoint hooks/handlers
  const handleRefetch = () => {
    if (id) show({ id });
  };

  const handleWaypointClick = (waypointId: string) => {
    navigate(`/a/trips/${id}/waypoints/${waypointId}`);
  };

  return (
    <Page.Body>
      <WaypointList
        tripId={id}
        trip={trip}
        onRefetch={handleRefetch}
        onViewDetails={handleWaypointClick}
      />
    </Page.Body>
  );
};
```

**Props Pattern:**

| Prop Type | Deskripsi | Contoh |
|-----------|-----------|--------|
| **Data Props** | Data yang diperlukan component | `trip`, `tripId`, `orderId` |
| **Callback Props** | Side effects yang dikelola parent | `onRefetch`, `onViewDetails`, `onSuccess` |
| ❌ **Handler Props** | Tidak pass handler operations | `onStartWaypoint`, `onArriveWaypoint` |

**Keuntungan:**

| Keuntungan | Penjelasan |
|-----------|-----------|
| ✅ **Encapsulation** | Logic operations terkapsul di component |
| ✅ **Cleaner Parent** | Parent hanya handle data fetching dan navigation |
| ✅ **Reusable** | Component bisa dipakai di mana saja tanpa setup hooks di parent |
| ✅ **Single Responsibility** | Component bertanggung jawab atas operations sendiri |

**Kapan gunakan pattern ini:**

| Scenario | Pattern |
|----------|---------|
| Component memiliki operations spesifik untuk entity-nya | ✅ Internal hooks/handlers |
| Operations hanya dipakai di component tersebut | ✅ Internal hooks/handlers |
| Operations dipakai di multiple tempat | ❌ Extract ke custom hook di parent |
| Operations membutuhkan parent logic/business rules | ❌ Handlers dari parent |

---

## 6. Routing & Pages

### 6.1 Menambahkan Halaman Baru

**Step 1: Buat file halaman**

```tsx
// src/platforms/app/screen/my-domain/index.tsx
import { Card } from "@/components";

const MyDomainPage = () => {
  return (
    <Card>
      <h1>My Domain Page</h1>
    </Card>
  );
};

export default MyDomainPage;
```

**Step 2: Daftarkan di subrouter**

```tsx
// src/platforms/app/screen/_subrouter.tsx
import { lazy } from "react";

const MyDomainScreen = lazy(() => import("./my-domain"));

const routes = [
  // ... existing routes
  { path: "/my-domain", element: MyDomainScreen },
];

export default routes;
```

**Step 3: Tambahkan menu (opsional)**

```tsx
// src/platforms/app/router.tsx
const menuOverview: MenuItem[] = [
  // ... existing menus
  {
    label: "My Domain",
    onClick: () => navigate("/a/my-domain"),
    active: !!useMatch("/a/my-domain"),
    permission: [
      "svc-warehouse.mydomain.manage",
      "svc-warehouse.mydomain.readonly",
    ],
  },
];
```

---

## 7. Testing

### 7.1 Menjalankan Test

```bash
# Run semua test
npm test

# Run test dengan UI
npm run test:ui

# Run test dengan coverage
npm run test:coverage
```

### 7.2 Struktur Test

Setiap komponen seharusnya memiliki file test:

```
components/ui/button/
├── index.tsx
├── types.ts
└── test.tsx    ← Unit test di sini
```

**Contoh test sederhana:**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Button } from "./index";

describe("Button", () => {
  it("should render correctly", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("should show loading state", () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByText("Loading")).toBeInTheDocument();
  });
});
```

---

## 8. Build & Deployment

### 8.1 Build untuk Production

```bash
# Build untuk sandbox environment
npm run build
```

Output akan ada di folder `dist/`

### 8.2 Preview Build

```bash
npm run preview
```

### 8.3 Build Modes

Project menggunakan mode build yang berbeda:

- **sandbox**: Build untuk environment sandbox
- Tambahkan mode lain di `vite.config.ts` jika diperlukan

---

## 9. Useful Scripts

| Command | Deskripsi |
|---------|-----------|
| `npm run dev` | Jalankan development server |
| `npm run build` | Build untuk production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run test suite |
| `npm run test:ui` | Run test dengan UI |
| `npm run test:coverage` | Run test dengan coverage report |
| `npm run generate:page` | Generate template halaman baru |
| `npm run generate:api` | Generate template API baru |

---

## 10. Generators

Project menyediakan generators untuk mempercepat development:

### Generate Page

```bash
npm run generate:page
```

Akan meminta:
- Nama page
- Lokasi page

### Generate API

```bash
npm run generate:api
```

Akan meminta:
- Nama domain
- Endpoint yang diperlukan

---

## 11. Troubleshooting

### 11.1 Masalah Umum

| Masalah | Solusi |
|---------|--------|
| **Module not found** | Pastikan path alias `@` sudah benar di `tsconfig.app.json` |
| **API 401/403** | Check token di Redux DevTools, pastikan masih valid |
| **Build gagal** | Hapus `node_modules` dan `dist`, lalu `npm install` |
| **Hot reload tidak jalan** | Restart dev server |
| **Type error** | Run `npm run build` untuk melihat semua type errors |

### 11.2 Clear Cache

```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Clear build
rm -rf dist

# Reinstall dependencies
rm -rf node_modules
npm install
```

---

## 12. Tips & Tricks

### 12.1 Path Aliases

Gunakan alias `@` untuk import dari `src`:

```typescript
// ✅ Good
import { Button } from "@/components/ui/button";

// ❌ Bad
import { Button } from "../../components/ui/button";
```

### 12.2 Redux DevTools

Install Redux DevTools extension untuk debugging state:

```bash
# Chrome/Edge
https://chromewebstore.google.com/detail/redux-devtools/

# Firefox
https://addons.mozilla.org/firefox/addon/reduxdevtools/
```

### 12.3 Performance Tips

- Gunakan `memo()` untuk komponen yang sering re-render
- Gunakan `useMemo()` untuk computed values
- Gunakan `useCallback()` untuk event handlers yang di-pass ke child
- Lazy load routes dengan `lazy()` dari React

---

## 13. Resource Links

| Resource | Link |
|----------|------|
| React Documentation | https://react.dev/ |
| Redux Toolkit | https://redux-toolkit.js.org/ |
| RTK Query | https://redux-toolkit.js.org/rtk-query/overview |
| Tailwind CSS | https://tailwindcss.com/ |
| DaisyUI | https://daisyui.com/ |
| Vite | https://vite.dev/ |
| TypeScript | https://www.typescriptlang.org/ |

---

*Dokumentasi ini dibuat untuk mempermudah development TMS Onward Frontend.*

### Changelog

| Version | Date | Changes |
|---------|------|---------|
| **3.15** | 2026-02-06 | - Added **5.13 Component with Internal Operations Pattern**: component yang mengelola hooks dan handlers secara internal<br>- Updated **3. Struktur Project**: tambahkan contoh component baru (TripInfoCard, WaypointList, WaypointCard)<br>- Documented props pattern: Data Props, Callback Props, Handler Props (avoid) |
| **3.14** | 2026-02-06 | - Updated **5.7 Modal Form Pattern**: remove toast notification (modal langsung close), remove error handling useEffect, hanya check isSuccess<br>- Simplified fail reason input: gunakan text input bebas (bukan predefined options) |
| **3.13** | 2026-02-06 | - Updated **5.7 Modal Form Pattern**: gunakan `e: any` (bukan `React.FormEvent`), remove displayName, gunakan named export<br>- Added **5.12 Subfolder Organization Pattern**: detail/, history/, form/ pattern untuk mengorganisir page-specific components<br>- Updated **3. Struktur Project**: tambahkan contoh struktur domain dengan subfolder pattern |
| **3.12** | 2026-02-06 | - Updated **5.9 Self-Fetching Components** - klarifikasi perbedaan Standard CRUD hook vs Custom hook<br>- Added hook types table: Standard CRUD (alias) vs Custom hook (nama langsung)<br>- Added "Catatan penting untuk custom hook" - nama properti langsung, bukan alias |
| **3.11** | 2026-02-06 | - Updated **5.9 Self-Fetching Components** - gunakan `useState` + `useEffect` sync pattern<br>- Added **5.11 Helper Functions** - documented `waypointEvidenceBadge`, `statusBadge`, `dateFormat`, `toNum`<br>- Updated **4.2 Component Structure** - removed `displayName`, added note about modern React<br>- Added real example: WaypointEvidence & WaypointLogsTimeline implementation |
| **3.10** | 2026-02-06 | - Added **5.9 Self-Fetching Components Pattern** - component yang fetch data sendiri<br>- Added **5.10 Detail Page Patterns** - dependency array kosong & error handling simplifikasi<br>- Documented best practices: avoid local error state, use RTK Query state directly |
| **3.9** | 2026-02-06 | - Simplified API pattern: removed type definitions for params/payload in RTK Query endpoints<br>- Removed generic type parameter from `createCrudHook<T>()` → `createCrudHook()`<br>- Added "logs, images" to Additional Queries Pattern examples |
| **3.8** | Januari 2026 | Initial documentation for Frontend Admin patterns
