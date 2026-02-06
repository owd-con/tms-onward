# WMS Client

A modern Warehouse Management System (WMS) client application built with React, TypeScript, and Vite.

## Overview

This application provides a comprehensive solution for managing warehouse operations including inventory management, receiving, delivery, stock adjustments, and master data management.

## Features

- **Dashboard**: Overview metrics and summary statistics
- **Inventory & Items**: Item master data and stock lookup
- **Operations**:
  - Receiving Plan management
  - Delivery Plan management
  - Stock Adjustment (Stock Opname)
  - Task List (Picking, Putaway, etc.)
- **Warehouse**: Warehouse settings and layout management
- **Master Data**: Tenant and Client management
- **Management**: User groups and team management
- **Print**: Document printing for receiving, delivery, and stock opname

## Tech Stack

- **Frontend Framework**: React 19.2.0
- **Language**: TypeScript 5.9.3
- **Build Tool**: Vite 7.2.2
- **State Management**: Redux Toolkit 2.10.1 + RTK Query
- **Routing**: React Router DOM 7.9.6
- **Styling**: Tailwind CSS 4.1.17 + DaisyUI 5.5.5
- **Charts**: ApexCharts 5.3.6
- **Canvas**: React Konva 19.2.1 + Fabric.js 6.9.0
- **Date Handling**: Day.js 1.11.19
- **File Operations**: File-saver 2.0.5 + XLSX 0.18.5

## Prerequisites

- Node.js 18+ and npm
- Access to the WMS API backend

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd wms-client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory:
   ```env
   VITE_API_URL=https://your-api-url.com/api
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production (sandbox mode)
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run generate:page` - Generate new page scaffold
- `npm run generate:api` - Generate API service scaffold

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Base URL for the API backend | Yes |

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── enigma/       # Enigma UI context (modal, drawer, toast)
│   └── ui/           # Base UI components
├── platforms/        # Platform-specific code
│   ├── app/          # Main application (protected routes)
│   └── auth/         # Authentication screens
├── services/         # API services & state management
│   ├── [feature]/    # Feature-specific services
│   ├── store.tsx     # Redux store configuration
│   └── baseQuery.tsx # RTK Query base configuration
├── shared/           # Shared utilities & helpers
├── utils/            # Utility functions
└── theme/            # Global styles
```

## Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow React best practices and hooks patterns
- Use functional components with hooks
- Prefer named exports over default exports
- Use meaningful variable and function names

### Component Development

- Keep components small and focused
- Extract reusable logic into custom hooks
- Use TypeScript interfaces for props
- Follow the existing component structure

### API Integration

- Use RTK Query for all API calls
- Create service hooks in `src/services/[feature]/hooks.tsx`
- Define API endpoints in `src/services/[feature]/api.tsx`
- Use the standardized error handling pattern

### State Management

- Use Redux Toolkit for global state
- Use RTK Query for server state
- Use local state (useState) for component-specific state
- Use Redux Persist for persisting auth state

---

## Architecture Blueprint

This document defines the technical foundation and structural standards of the Enigma WMS client.

### Core Technology Stack

- **Framework**: React 18+ with Vite
- **State Management**: Redux Toolkit (RTK)
- **Data Fetching**: RTK Query
- **Styling**: Vanilla CSS + TailwindCSS + DaisyUI
- **Icons**: React Icons (Hi, Fa, etc.) & Custom SVG Icons
- **Logging**: Internal `logger` utility

### Directory Structure Standards

```text
src/
├── assets/          # Static assets
├── components/      # Global reusable UI components
│   └── ui/          # Low-level primitives
├── platforms/       # Platform-specific layouts and screens
│   ├── app/         # Main application logic
│   └── auth/        # Authentication screens
├── services/        # Business logic and data layer
│   ├── [feature]/   # Feature-specific services
│   ├── hooks/       # Service factories (e.g., createCrudHook.ts)
│   └── types/       # Global TypeScript interfaces
└── utils/           # Utility functions
```

### Service Layer (Standardized CRUD)

Entities should use the `createCrudHook` factory to ensures all operations follow a predictable pattern.

**Pattern:**
```typescript
export const useEntity = createCrudHook<EntityType>({
  useLazyGetQuery: useLazyGetEntityQuery,
  useLazyShowQuery: useLazyShowEntityQuery,
  useCreateMutation: useCreateEntityMutation,
  useUpdateMutation: useUpdateEntityMutation,
  useRemoveMutation: useRemoveEntityMutation,
  entityName: "entity",
});
```

---

## Project Requirements

High-level functional requirements for the Warehouse Management System (WMS).

### Core Modules

- **Dashboard**: Real-time monitoring of warehouse activities and SLA metrics.
- **Inventory Management**: Tracking items, batches, and locations.
- **Inbound (Receiving)**: Managing receiving plans and document completion.
- **Outbound (Delivery)**: Managing fulfillment, picking accuracy, and shipping.
- **Stock Management**: Stockopname (adjustments) and stock logs.

### System Features

- **Multi-Warehouse Support**: Capability to switch between different warehouse contexts.
- **User Management**: Role-based access control and user groups.
- **Layout Mapping**: Visual representation of warehouse storage areas.

---

## Development Rules & Standards

Guidelines for maintaining code quality and consistency across the project.

### 1. Type Safety

- **No `any`**: Always define interfaces for API responses and component props.
- **Centralized Types**: Entity types belong in `src/services/types/`.

### 2. Component Organization

- **Screen Structure**: Complex screens must be broken down into sub-components.
- **Prop Drilling**: Use Redux for global state (e.g., `warehouse_id`).

### 3. Error Handling

- **Technical Errors**: Use the `logger` utility.
- **User Feedback**: Use `showToast` or `failureWithTimeout`.

### 4. UI/UX Standards

- **Aesthetics**: Use gradients, smooth transitions, and premium typography.
- **Loading States**: Handle `isLoading` and `isFetching` with skeletons/spinners.
- **Responsiveness**: Mobile-first approach using Tailwind grid/flex.

---

## Future Planning & Recommendations

Roadmap for architecture improvements and technical debt reduction.

### 1. Performance Optimizations

- **Hook Memoization**: Wrap `createCrudHook` return values in `useMemo` to prevent unnecessary re-renders.
- **Lazy Loading**: Implement React.lazy for heavy route segments.

### 2. Code Quality

- **Logic Separation**: Move heavy data processing from screens to dedicated selector functions or hook-level logic.
- **Testing**:
  - Unit tests for `createCrudHook`.
  - Integration tests for "Warehouse Switching" flow.

### 3. Scalability

- **Alias Consistency**: Enforce a strict naming convention for hook aliasing (`getSomething`, `getSomethingResult`).

## Build & Deployment

### Production Build

```bash
npm run build
```

The build output will be in the `dist/` directory.

### Deployment

The application is configured to deploy to AWS S3 + CloudFront. The GitHub Actions workflow (`.github/workflows/sandbox.yml`) handles automatic deployment on push to the main branch.

## Authentication

The application uses JWT-based authentication. Tokens are stored in Redux state (persisted to localStorage). The application automatically handles:
- Token refresh on 401/403 errors
- Automatic logout on authentication failures
- Protected routes with route guards

## Error Handling

- All errors are logged using the centralized logger utility
- User-friendly error messages are displayed via toast notifications
- React Error Boundary catches and displays component errors
- API errors are automatically handled and formatted

## Testing

Testing infrastructure is being set up. See `docs/DEVELOPMENT.md` for testing guidelines.

## Contributing

1. Create a feature branch from `main`
2. Make your changes following the code style guidelines
3. Ensure all linting passes (`npm run lint`)
4. Submit a pull request

## License

[Add your license information here]

## Blueprint Documentation

The project follows a structured blueprint approach documented in the `blueprint/` directory:

- **ARCHITECTURE.md**: Technical foundation and structural standards
- **REQUIREMENTS.md**: High-level functional requirements
- **RULES.md**: Development rules and standards
- **PLANNING.md**: Future planning and recommendations

These documents serve as the foundation for all development decisions and should be referenced when:
- Creating new features or modules
- Making architectural decisions
- Establishing coding standards
- Planning future improvements

## Support

For issues and questions, please contact the development team or create an issue in the repository.
