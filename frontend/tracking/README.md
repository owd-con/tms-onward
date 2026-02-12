# TMS Onward - Public Tracking Frontend

Halaman tracking publik untuk TMS Onward - memungkinkan customer melacak status pengiriman tanpa perlu login.

## Quick Setup

### Prerequisites

- **Node.js** 20.0 or higher
- **npm** 10.0 or higher
- **Backend API** running on `http://localhost:8080` (or configure via `VITE_API_URL`)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

### Environment Variables

Create `.env.local` in the project root:

```bash
# API Backend URL (default: http://localhost:8080/api)
VITE_API_URL=http://localhost:8080/api

# App Name (default: TMS Tracking)
VITE_APP_NAME=TMS Tracking
```

### Template .env.local

```bash
# Development
VITE_API_URL=http://localhost:8080/api
VITE_APP_NAME=TMS Tracking

# Production (example)
# VITE_API_URL=https://api.onward.example.com/api
# VITE_APP_NAME=TMS Onward Tracking
```

## Available NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production (minified, optimized) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint to check code quality |

## Folder Structure

```
frontend/tracking/
├── public/                    # Static assets
│   ├── favicon.svg           # Site favicon
│   └── apple-touch-icon.svg  # iOS icon
├── src/
│   ├── assets/               # Asset files (images, icons)
│   │   └── icons/            # Custom SVG icons
│   ├── components/           # React components
│   │   ├── layout/           # Layout components (Header, Footer, etc.)
│   │   ├── tracking/         # Tracking-specific components
│   │   └── ui/               # Reusable UI components
│   ├── platforms/            # Pages & Routing
│   │   └── public/           # Public tracking pages
│   │       ├── screen/       # Page components
│   │       └── router.tsx    # Route configuration
│   ├── services/             # API & State management
│   │   ├── tracking/         # Tracking API (RTK Query)
│   │   ├── types/            # TypeScript type definitions
│   │   ├── baseQuery.tsx     # RTK Query base config
│   │   └── store.tsx         # Redux store
│   ├── shared/               # Shared utilities
│   │   ├── constants/        # Constants (status, etc.)
│   │   ├── utils/            # Helper functions
│   │   └── i18n/             # Internationalization
│   ├── theme/                # Theme & styles
│   │   ├── style.css         # Global styles
│   │   └── animations.css    # Animation utilities
│   ├── App.tsx               # Root component
│   └── main.tsx              # Entry point
├── index.html                # HTML template
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
├── tailwind.config.js        # Tailwind CSS configuration
└── package.json              # Dependencies & scripts
```

## Development Workflow

### 1. Start Development Server

```bash
npm run dev
```

The dev server will start at `http://localhost:5173`

### 2. Make Changes

- Edit component files in `src/components/`
- Styles are handled via Tailwind CSS classes
- Hot module reload (HMR) will refresh the browser automatically

### 3. Test Changes

- Test tracking with valid order numbers
- Test error handling with invalid order numbers
- Test language switching (ID/EN)
- Test on different screen sizes (mobile, tablet, desktop)

### 4. Build for Production

```bash
npm run build
```

Output will be in `dist/` directory.

## Build & Deployment Guide

### Build Commands

```bash
# Production build
npm run build

# Preview build locally
npm run preview
```

### Deployment Options

#### Option A: Standalone Deployment (Recommended)

Deploy as a separate static site:

1. Build the project: `npm run build`
2. Upload `dist/` contents to:
   - Netlify
   - Vercel
   - AWS S3 + CloudFront
   - Nginx/Apache server

3. Configure `VITE_API_URL` to point to production API

#### Option B: Embedded in Admin

Serve from admin application at `/tracking` path:

1. Build the project
2. Copy `dist/` contents to admin's public folder
3. Configure routing in admin app

### Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name tracking.onward.example.com;
    root /var/www/tracking/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:8080;
    }
}
```

## Key Features

- **Public Access**: No authentication required
- **Multi-Language**: Indonesian (default) and English support
- **Mobile-First Design**: Responsive layout for all devices
- **Real-Time Updates**: Polling support for live tracking
- **SEO Optimized**: Meta tags, Open Graph, Twitter Cards, JSON-LD
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Privacy-Focused**: Driver first name only, no sensitive data exposed
- **Offline Support**: PWA-ready (manifest available)

## Tech Stack

| Technology | Version | Description |
|------------|---------|-------------|
| **React** | 18.x | UI framework |
| **TypeScript** | 5.x | Type safety |
| **Vite** | 6.x | Build tool & dev server |
| **Tailwind CSS** | 4.x | Utility-first CSS |
| **React Router** | 7.x | Client-side routing |
| **RTK Query** | 2.x | API state management |
| **i18n** | Custom | Multi-language support |

## API Integration

### Public Tracking Endpoint

```
GET /public/tracking/:orderNumber
```

**Response:**

```typescript
{
  order: Order;
  waypoints: OrderWaypoint[];
  waypoint_logs: WaypointLog[];
  waypoint_images: WaypointImage[];
  trip?: Trip;
}
```

### Type Definitions

See `src/services/types/` for complete type definitions:
- `entities.ts` - Order, Waypoint, Trip, Driver, Vehicle
- `api.ts` - API response structures

## SEO Optimization

### Meta Tags

Dynamic meta tags are handled via `react-helmet-async`:

```tsx
<Helmet>
  <title>TMS Onward - Track Order #{orderNumber}</title>
  <meta name="description" content="Track your shipment..." />
  <meta property="og:title" content="..." />
  <meta property="og:type" content="website" />
  {/* ... */}
</Helmet>
```

### Open Graph Support

- og:title, og:description, og:image, og:url
- Twitter Card tags
- Canonical URLs
- JSON-LD structured data (ParcelDelivery)

### Sitemap & Robots

Create `public/sitemap.xml` and `public/robots.txt` for production.

## Component Reference

### TrackingForm

Order number input form with validation.

```tsx
<TrackingForm />
```

### TrackingResult

Main tracking result display with error handling.

```tsx
<TrackingResult orderNumber="ORD-001" />
```

### WaypointTimeline

Timeline of tracking events.

```tsx
<WaypointTimeline waypointLogs={logs} waypointImages={images} />
```

### WaypointCard

Individual waypoint card with location and status.

```tsx
<WaypointCard waypoint={waypoint} />
```

### PODGallery

Proof of delivery image gallery with lightbox.

```tsx
<PODGallery images={podImages} />
```

### TripInfo

Driver and vehicle information.

```tsx
<TripInfo trip={trip} />
```

## Internationalization

### Available Languages

- **Indonesian (ID)** - Default
- **English (EN)**

### Adding Translations

Edit `src/shared/i18n/translations.ts`:

```typescript
export const translations = {
  id: {
    // Add new keys
  },
  en: {
    // Add corresponding translations
  },
};
```

### Using Translations

```tsx
import { useTranslation } from '@/shared/i18n';

function Component() {
  const { t, language } = useTranslation();
  return <h1>{t('app.title')}</h1>;
}
```

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |
| Chrome Mobile | Latest |
| Safari iOS | 14+ |

## Performance

### Optimization Techniques

- **Code Splitting**: Lazy-loaded routes with React.lazy()
- **Tree Shaking**: Unused code eliminated in production
- **Asset Optimization**: Images compressed, fonts optimized
- **API Caching**: RTK Query with configurable cache duration
- **CSS Purging**: Tailwind purges unused styles

### Bundle Size

Target bundle size: `< 200KB` (gzipped)

## Help & Reference

### Project Documentation

- **Main Tasklist**: `docs/tasklist-public-tracking-frontend.md`
- **Blueprint**: `docs/blueprint.md` - Section 3.12: Public Tracking Endpoints
- **Requirements**: `docs/requirements.md` - Section 2.14: Module 14

### External Resources

- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Vite Documentation](https://vite.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [RTK Query Documentation](https://redux-toolkit.js.org/rtk-query/overview)

### Troubleshooting

**Dev server won't start?**
- Ensure Node.js 20+ is installed: `node --version`
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

**Build fails?**
- Check TypeScript errors: `npm run lint`
- Verify all imports are correct

**API calls failing?**
- Check `VITE_API_URL` in `.env.local`
- Verify backend is running on the configured port
- Check browser console for CORS errors

**Images not loading?**
- Verify S3 URLs are accessible
- Check image format (SVG, PNG, JPG supported)

## License

Copyright © 2026 TMS Onward. All rights reserved.
