# TMS Onward - Frontend Admin/Dispatcher Portal

> Transportation Management System for Small Logistics Companies in Indonesia

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development](#development)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Environment Variables](#environment-variables)
- [Common Issues](#common-issues)

---

## Prerequisites

Before starting, make sure you have installed:

- **Node.js** v20 or higher
- **npm** (comes with Node.js)
- **Git**

Check your versions:

```bash
node --version  # should be v20+
npm --version
```

---

## Quick Start

### 1. Install Dependencies

```bash
cd frontend/admin
npm install
```

### 2. Setup Environment Variables

Create `.env.local` file:

```bash
cp .env .env.local
```

Update the values:

```env
VITE_API_URL=http://localhost:8080/api
VITE_APP_URL=http://localhost:5173/
VITE_APP_NAME=TMS Onward
DEV=true
```

### 3. Start Development Server

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Development

### Running the App

```bash
# Development server (with HMR)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

---

## Project Structure

```
frontend/admin/
├── src/
│   ├── components/          # UI Components
│   │   ├── ui/             # Atomic components (Button, Input, Table, etc.)
│   │   ├── form/           # Form components (GeoLocationSelect, etc.)
│   │   ├── order/          # Order-specific components
│   │   │   ├── WaypointBuilder.tsx
│   │   │   ├── WaypointTimeline.tsx
│   │   │   └── AddressSelector.tsx
│   │   ├── trip/           # Trip-specific components
│   │   │   ├── WaypointSequenceEditor.tsx
│   │   │   └── DriverVehicleSelector.tsx
│   │   └── ...             # Other feature components
│   ├── platforms/          # Pages & Routing
│   │   ├── auth/           # Authentication pages
│   │   └── app/            # Main application pages
│   │       ├── screen/     # Feature pages
│   │       │   ├── dashboard/
│   │       │   ├── orders/
│   │       │   ├── trips/
│   │       │   ├── master-data/
│   │       │   ├── exceptions/
│   │       │   ├── reports/
│   │       │   └── management/
│   │       ├── onboarding/ # Onboarding wizard
│   │       └── router.tsx  # Route configuration
│   ├── services/           # API & State Management
│   │   ├── [domain]/       # Per-domain API slices & hooks
│   │   │   ├── auth/
│   │   │   ├── customer/
│   │   │   ├── vehicle/
│   │   │   ├── driver/
│   │   │   ├── order/
│   │   │   ├── trip/
│   │   │   ├── exception/
│   │   │   ├── report/
│   │   │   └── ...
│   │   ├── baseQuery.tsx   # RTK Query base config
│   │   ├── store.tsx       # Redux store
│   │   └── types.ts        # TypeScript types
│   ├── shared/             # Shared utilities
│   │   ├── helper.ts       # Helper functions
│   │   ├── constants/      # Constants (status, options)
│   │   └── utils/          # Utility functions
│   └── hooks/              # Custom hooks
├── public/                 # Static assets
├── index.html              # HTML entry point
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies & scripts
```

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests |
| `npm run test:ui` | Run tests with UI |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run generate:page` | Generate template page |
| `npm run generate:api` | Generate template API |

---

## Environment Variables

| Variable | Description | Example |
|----------|-----------|--------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:8080/api` |
| `VITE_APP_URL` | Frontend application URL | `http://localhost:5173/` |
| `VITE_APP_NAME` | Application name | `TMS Onward` |
| `DEV` | Development mode flag | `true` |
| `ENABLE_DOM_LOGGER` | Enable DOM logger (optional) | `true` |

**Note:** Environment variables must be prefixed with `VITE_` to be accessible in the code.

---

## Common Issues

### Issue: Module not found

**Error:** `Cannot find module '@/components/...'`

**Solution:** Make sure you're running the dev server from the `frontend/admin` directory.

### Issue: API 401/403 Errors

**Error:** API calls returning 401/403

**Solution:**
- Check that backend is running
- Check that `VITE_API_URL` is correct
- Check that you're logged in (token valid)

### Issue: Hot reload not working

**Error:** Changes not reflecting in browser

**Solution:** Restart the dev server:
```bash
# Stop the server (Ctrl+C)
npm run dev
```

### Issue: Build errors

**Error:** TypeScript errors during build

**Solution:**
- Run `npm run build` to see full error list
- Fix TypeScript errors in your files
- Try clearing cache:
  ```bash
  rm -rf node_modules/.vite
  rm -rf dist
  npm install
  npm run dev
  ```

---

## Key Features

- **Authentication:** JWT-based authentication with role-based access
- **Dashboard:** Overview of orders, trips, and key metrics
- **Master Data Management:** Customer, Vehicle, Driver, Pricing, Addresses
- **Order Management:** Create and manage orders with waypoints
- **Trip Management:** Assign drivers/vehicles, track progress
- **Exception Handling:** Reschedule failed orders
- **Reports:** Generate and export reports
- **Onboarding:** Guided setup for new companies

---

## Tech Stack

- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **State Management:** Redux Toolkit + RTK Query
- **UI Framework:** Tailwind CSS + DaisyUI
- **Icons:** React Icons (Heroicons)
- **Forms:** React Hook Form
- **Routing:** React Router v6
- **Testing:** Vitest + React Testing Library

---

## Development Workflow

1. **Create new feature page:** Use `npm run generate:page`
2. **Create new API service:** Use `npm run generate:api`
3. **Follow patterns:** Check existing implementations in `src/`
4. **Use shared components:** Before creating new components, check `src/components/`
5. **Test changes:** Run `npm test` before committing

---

## Need Help?

- **Backend API Docs:** Check `docs/blueprint.md`
- **Frontend Guide:** Check `docs/FONTEND_GUIDE.md`
- **Task Tracking:** Check `docs/tasklist-frontend.md`

---

**Last Updated:** 2026-01-28
