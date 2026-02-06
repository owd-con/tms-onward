# BottomNav Component Documentation

## Overview

The BottomNav component provides a mobile-friendly bottom navigation bar for the TMS Driver application. It follows native mobile app patterns with touch-friendly targets and clear active state indicators.

## Location

```
/home/naufal/Workspaces/tms-onward/frontend/driver/src/platforms/app/components/layout/bottom-nav.tsx
```

## Features

### Navigation Items

| Item | Route | Icon | Description |
|------|-------|------|-------------|
| Active Trips | `/` | `HiTruck` | Main screen showing active driver trips |
| History | `/history` | `HiClock` | Trip history and past deliveries |
| Profile | `/profile` | `HiUser` | Driver profile and settings |

### Key Features

1. **Touch-Friendly Targets**: All navigation items meet the 44x44px minimum touch target size for better mobile usability
2. **Active State Indication**: Active route is highlighted with:
   - Primary color text (from DaisyUI theme)
   - Slightly larger icon scale (scale-110)
   - Semibold font weight
3. **Smart Route Matching**: Uses custom `matchPattern` function to correctly identify active routes
4. **Auto-Hide on Detail Pages**: Automatically hides on trip detail and waypoint pages
5. **Accessibility**: Includes proper ARIA labels and roles
6. **DaisyUI Integration**: Uses DaisyUI color tokens for consistent theming

## Styling

### DaisyUI Classes Used

- `bg-base-100`: Primary background color
- `border-base-300`: Border color
- `text-primary`: Active state color (from theme)
- `text-base-content/60`: Inactive state color with 60% opacity
- `hover:text-base-content/80`: Hover state with 80% opacity

### Dimensions

- Height: 64px (h-16)
- Icon size: 24px
- Label font size: 12px (text-xs)
- Minimum touch target: 44x44px

## Usage

The BottomNav is automatically integrated into the `MobileLayout` component:

```tsx
import { MobileLayout } from "@/platforms/app/components/layout";

// In router configuration
<Route element={<MobileLayout />}>
  <Route index element={<ActiveTrips />} />
  <Route path="history" element={<TripHistory />} />
  <Route path="profile" element={<Profile />} />
</Route>
```

### Hide Navigation on Specific Pages

If you need to hide the bottom navigation on certain pages:

```tsx
<MobileLayout hideNavigation={true}>
  <SomePage />
</MobileLayout>
```

## Route Configuration

The component automatically hides on these routes:
- `/trips/:id` - Trip detail pages
- `/trips/:id/waypoints/:waypointId` - Waypoint detail pages
- `/login` - Login page

## Customization

### Adding New Navigation Items

Edit the `navItems` array in `bottom-nav.tsx`:

```tsx
const navItems: NavItem[] = [
  {
    path: "/new-route",
    label: "New Page",
    icon: HiIconName,
    matchPattern: (pathname) => pathname.startsWith("/new-route"),
  },
  // ... existing items
];
```

### Changing Active State Logic

Modify the `matchPattern` function for each nav item to control when it shows as active:

```tsx
matchPattern: (pathname) => {
  // Custom logic to determine active state
  return pathname === "/exact-path" || pathname.startsWith("/prefix");
}
```

## Accessibility

The component includes the following accessibility features:

- `role="navigation"` - Identifies the element as a navigation landmark
- `aria-label="Bottom navigation"` - Provides a descriptive label
- `aria-current="page"` - Indicates the current page to screen readers
- `aria-hidden="true"` on icons - Prevents icons from being read by screen readers
- Proper color contrast ratios following WCAG guidelines

## Integration with MobileLayout

The `MobileLayout` component reserves bottom padding (`pb-20`) to ensure content doesn't get hidden behind the fixed BottomNav:

```tsx
<main className="flex-1 pb-20">
  <Outlet />
</main>
```

This creates a 80px (5rem) bottom padding to prevent content overlap.

## Browser Support

- Modern browsers with CSS Grid/Flexbox support
- iOS Safari (with safe-area-inset support via `pb-safe`)
- Chrome Mobile
- Firefox Mobile

## Future Enhancements

Possible improvements:
1. Badge notifications on nav items (e.g., "3 new trips")
2. Animation on route change
3. Haptic feedback on touch
4. Keyboard navigation support for desktop testing
5. Long-press actions for quick access

## Related Files

- `/home/naufal/Workspaces/tms-onward/frontend/driver/src/platforms/app/components/layout/mobile.tsx` - Layout wrapper
- `/home/naufal/Workspaces/tms-onward/frontend/driver/src/platforms/app/router.tsx` - Route configuration
- `/home/naufal/Workspaces/tms-onward/frontend/driver/src/theme/style.css` - Theme configuration
