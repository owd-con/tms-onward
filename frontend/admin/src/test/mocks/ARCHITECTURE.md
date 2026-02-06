# MSW Architecture & Integration

## How MSW Works in TMS Onward Frontend

```
┌─────────────────────────────────────────────────────────────────┐
│                         Test Execution                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  src/test/setup.ts                                              │
│                                                                 │
│  ✓ Import MSW server from './mocks'                            │
│  ✓ server.listen() - Start MSW before all tests                │
│  ✓ server.resetHandlers() - Reset after each test              │
│  ✓ server.close() - Close after all tests                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  src/test/mocks/server.ts                                       │
│                                                                 │
│  export const server = setupServer(...handlers)                │
│  - Node.js request interception for Vitest/Jest                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  src/test/mocks/handlers.ts                                     │
│                                                                 │
│  export const handlers = [                                      │
│    http.post('/api/auth/login', ...),                          │
│    http.get('/api/dashboard', ...),                            │
│    http.get('/api/customers', ...),                            │
│    // ... more handlers                                        │
│  ]                                                              │
│                                                                 │
│  - Defines all API mock handlers                               │
│  - Returns mocked HttpResponse for each endpoint               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  During Test Execution                                          │
│                                                                 │
│  1. Test calls fetch('/api/customers')                         │
│  2. MSW intercepts the request                                 │
│  3. MSW matches request to handler                             │
│  4. Handler returns mocked response                            │
│  5. Test receives mocked data                                  │
└─────────────────────────────────────────────────────────────────┘
```

## File Structure

```
src/test/
├── setup.ts                    # Test setup file (integrates MSW)
├── mocks/
│   ├── handlers.ts            # API request/response handlers
│   ├── server.ts              # Node.js server setup (Vitest/Jest)
│   ├── browser.ts             # Browser worker setup (dev/testing)
│   ├── index.ts               # Main exports
│   ├── example.test.ts        # Example tests demonstrating MSW
│   ├── services.ts            # Existing service mocks
│   ├── README.md              # Full documentation
│   ├── QUICK_START.md         # Quick reference guide
│   └── ARCHITECTURE.md        # This file
```

## Data Flow

### Test Without MSW
```
Test → fetch('/api/customers') → Network → Real Backend API
                                                ↑
                                            (Needs backend running)
```

### Test With MSW
```
Test → fetch('/api/customers') → MSW Interception → Mocked Response
                                          ↑
                                  (No backend needed!)
```

## Handler Matching

MSW matches requests to handlers based on:

1. **HTTP Method** (GET, POST, PUT, DELETE, etc.)
2. **URL Path** (`/api/customers`, `/api/customers/:id`, etc.)

Example:
```typescript
http.get('/api/customers/:id', ({ params }) => {
  // Matches: GET /api/customers/123
  // Matches: GET /api/customers/abc
  // Does NOT match: POST /api/customers/123
  // Does NOT match: GET /api/orders/123
})
```

## Lifecycle Hooks

```typescript
// src/test/setup.ts

beforeAll(() => {
  server.listen();  // ✅ Start MSW server
});

afterEach(() => {
  server.resetHandlers();  // ✅ Reset to default handlers
  cleanup();  // ✅ Cleanup React components
});

afterAll(() => {
  server.close();  // ✅ Shutdown MSW server
});
```

## Handler Override Flow

```
Test File
   │
   ├── Default handlers (from handlers.ts)
   │    └── http.get('/api/customers', ...) → Returns default data
   │
   └── Override with server.use()
        └── http.get('/api/customers', ...) → Returns custom data
             │
             └── afterEach: server.resetHandlers()
                  └── Back to default handlers
```

## Example: Test with Handler Override

```typescript
test('shows error state', () => {
  // Override default handler
  server.use(
    http.get('/api/customers', () => {
      return HttpResponse.json(
        { error: 'Server Error' },
        { status: 500 }
      );
    })
  );

  render(<CustomerList />);

  // Test expects error UI
  expect(screen.getByText(/error/i)).toBeInTheDocument();
});

// After test: resetHandlers() restores default handler
```

## Integration Points

### 1. Vitest Configuration
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    setupFiles: ['./src/test/setup.ts'],  // ✅ MSW setup
    environment: 'jsdom',                  // ✅ Browser environment
  },
});
```

### 2. Test Files
```typescript
// src/components/__tests__/CustomerList.test.tsx
import { render, screen } from '@testing-library/react';
// ✅ MSW automatically intercepts fetch calls
// No explicit MSW imports needed unless overriding handlers

test('displays customers', async () => {
  render(<CustomerList />);
  // fetch('/api/customers') → MSW → Mocked data
});
```

### 3. Package.json
```json
{
  "devDependencies": {
    "msw": "^2.12.7"  // ✅ MSW installed
  },
  "scripts": {
    "test": "vitest"  // ✅ Runs tests with MSW
  }
}
```

## Benefits

1. **No Backend Dependency** - Tests run without real API
2. **Fast Execution** - No network latency
3. **Deterministic** - Same response every time
4. **Edge Cases** - Easy to test error states
5. **Offline Testing** - Works without internet
6. **Parallel Testing** - No shared state between tests

## Best Practices

✅ **DO:**
- Use realistic mock data matching your API schema
- Define response types for type safety
- Override handlers for specific test cases
- Reset handlers automatically in afterEach
- Test both success and error cases

❌ **DON'T:**
- Don't call server.close() in individual tests
- Don't hardcode mock data in test files (use handlers)
- Don't forget to reset handlers after overrides
- Don't use real API URLs in tests

## Next Steps

1. Read `QUICK_START.md` for usage examples
2. Read `README.md` for full documentation
3. Check `example.test.ts` for working examples
4. Add new handlers to `handlers.ts` as needed

## Support

- MSW Documentation: https://mswjs.io/
- Testing Library: https://testing-library.com/
- Vitest Documentation: https://vitest.dev/
