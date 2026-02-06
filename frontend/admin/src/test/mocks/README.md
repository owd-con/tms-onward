# MSW (Mock Service Worker) Setup

This directory contains MSW handlers for mocking API responses in tests.

## Files

- `handlers.ts` - Main API request/response handlers
- `browser.ts` - Browser worker setup (for development/testing in browser)
- `server.ts` - Node.js server setup (for Vitest/Jest tests)
- `index.ts` - Main exports
- `example.test.ts` - Example tests demonstrating MSW usage

## Usage

### In Tests

MSW is automatically set up in `src/test/setup.ts` and will intercept all HTTP requests in your tests.

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should fetch and display data', async () => {
    render(<MyComponent />);

    // MSW will automatically intercept the fetch('/api/customers') call
    // and return the mocked data from handlers.ts
    await waitFor(() => {
      expect(screen.getByText('PT ABC Logistics')).toBeInTheDocument();
    });
  });

  it('should handle errors', async () => {
    // Override handlers for this specific test
    server.use(
      http.get('/api/customers', () => {
        return HttpResponse.json(
          { error: 'Internal Server Error' },
          { status: 500 }
        );
      })
    );

    render(<MyComponent />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

### Adding New Handlers

Edit `handlers.ts` to add new API endpoints:

```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Add your new handler
  http.get('/api/your-endpoint', () => {
    return HttpResponse.json({
      data: {
        // Your response data
      },
    });
  }),

  // ... existing handlers
];
```

### Handler Patterns

#### GET Request with Query Params

```typescript
http.get('/api/orders', ({ request }) => {
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const page = url.searchParams.get('page') || '1';

  return HttpResponse.json({
    data: /* your data based on params */,
    meta: { page, total: 100 },
  });
});
```

#### POST Request with Body

```typescript
http.post('/api/customers', async ({ request }) => {
  const body = await request.json();

  // Validate and create customer
  return HttpResponse.json({
    data: {
      id: 'new-id',
      ...body,
    },
  }, { status: 201 });
});
```

#### Dynamic Route Parameters

```typescript
http.get('/api/customers/:id', ({ params }) => {
  const { id } = params;

  return HttpResponse.json({
    data: {
      id,
      name: 'Customer Name',
    },
  });
});
```

#### Error Responses

```typescript
http.get('/api/protected', () => {
  return HttpResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  );
});
```

#### Delayed Responses (for loading states)

```typescript
import { delay } from 'msw';

http.get('/api/slow-endpoint', async () => {
  await delay(1000); // Simulate network delay
  return HttpResponse.json({ data: 'response' });
});
```

## Available Mock Endpoints

### Auth
- `POST /api/auth/login` - Login with email/password

### Dashboard
- `GET /api/dashboard` - Dashboard statistics

### Customers
- `GET /api/customers` - List customers
- `GET /api/customers/:id` - Get customer detail
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Orders
- `GET /api/orders` - List orders

### Trips
- `GET /api/trips` - List trips

## Test Credentials

For login tests:
- Email: `admin@example.com`
- Password: `password123`

## Best Practices

1. **Keep handlers realistic** - Mock responses should match your actual API structure
2. **Use TypeScript types** - Define response types for better type safety
3. **Override handlers per test** - Use `server.use()` to override handlers for specific test cases
4. **Reset handlers** - Handlers are automatically reset after each test via `setup.ts`
5. **Test error states** - Don't forget to test error responses
6. **Use delay for loading states** - Import `delay` from `msw` to simulate network delays

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Troubleshooting

### Requests not being mocked

- Make sure the endpoint path matches exactly (including leading `/api/`)
- Check that MSW server is listening (see `src/test/setup.ts`)
- Verify the HTTP method matches (GET, POST, etc.)

### Type errors

- Import types from `msw`: `import { http, HttpResponse } from 'msw'`
- Define response types for better type safety

### Handler not resetting between tests

- The `afterEach` hook in `setup.ts` should call `server.resetHandlers()`
- Make sure you're not calling `server.close()` in individual tests

## Resources

- [MSW Documentation](https://mswjs.io/)
- [MSW API Reference](https://mswjs.io/docs/api)
- [Testing Library Documentation](https://testing-library.com/)
