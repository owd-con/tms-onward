# MSW Quick Start Guide

## What is MSW?

MSW (Mock Service Worker) intercepts HTTP requests in your tests and returns mocked responses, allowing you to test your frontend code without a real backend.

## Basic Usage Example

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks';

// 1. Test with default handlers
test('fetches customers', async () => {
  render(<CustomerList />);

  // MSW automatically intercepts fetch('/api/customers')
  await waitFor(() => {
    expect(screen.getByText('PT ABC Logistics')).toBeInTheDocument();
  });
});

// 2. Override handler for specific test case
test('shows error when API fails', async () => {
  server.use(
    http.get('/api/customers', () => {
      return HttpResponse.json(
        { error: 'Server Error' },
        { status: 500 }
      );
    })
  );

  render(<CustomerList />);

  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
```

## Quick Reference

### Import MSW Utilities

```typescript
import { http, HttpResponse, delay } from 'msw';
import { server } from '@/test/mocks';
```

### Override Handler in Test

```typescript
server.use(
  http.get('/api/endpoint', () => {
    return HttpResponse.json({ data: 'mocked' });
  })
);
```

### Return Error Response

```typescript
server.use(
  http.get('/api/endpoint', () => {
    return HttpResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  })
);
```

### Simulate Network Delay

```typescript
import { delay } from 'msw';

server.use(
  http.get('/api/endpoint', async () => {
    await delay(1000); // 1 second delay
    return HttpResponse.json({ data: 'response' });
  })
);
```

### Read Request Body

```typescript
http.post('/api/login', async ({ request }) => {
  const body = await request.json();
  // body contains parsed JSON
  return HttpResponse.json({ success: true });
})
```

### Read Query Parameters

```typescript
http.get('/api/orders', ({ request }) => {
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const page = url.searchParams.get('page');
  // Use params to customize response
})
```

### Read Path Parameters

```typescript
http.get('/api/customers/:id', ({ params }) => {
  const { id } = params;
  // Use id to fetch specific customer
})
```

## Common Patterns

### Test Loading State

```typescript
test('shows loading indicator', async () => {
  server.use(
    http.get('/api/data', async () => {
      await delay(2000);
      return HttpResponse.json({ data: 'response' });
    })
  );

  render(<MyComponent />);

  // Loading should be visible immediately
  expect(screen.getByTestId('loading')).toBeInTheDocument();

  // Wait for data to load
  await waitFor(() => {
    expect(screen.getByTestId('data')).toBeInTheDocument();
  });
});
```

### Test Multiple States

```typescript
test('handles success and error states', async () => {
  // Test success
  const { rerender } = render(<MyComponent />);
  await waitFor(() => {
    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  // Override to error
  server.use(
    http.get('/api/data', () => {
      return HttpResponse.json(
        { error: 'Error' },
        { status: 500 }
      );
    })
  );

  // Test error
  rerender(<MyComponent />);
  await waitFor(() => {
    expect(screen.getByText('Error')).toBeInTheDocument();
  });
});
```

### Test Empty States

```typescript
test('shows empty message when no data', async () => {
  server.use(
    http.get('/api/customers', () => {
      return HttpResponse.json({ data: [], meta: { total: 0 } });
    })
  );

  render(<CustomerList />);

  await waitFor(() => {
    expect(screen.getByText(/no customers/i)).toBeInTheDocument();
  });
});
```

## Available Mock Endpoints

Check `/home/naufal/Workspaces/tms-onward/frontend/admin/src/test/mocks/handlers.ts` for all available endpoints:

- `POST /api/auth/login`
- `GET /api/dashboard`
- `GET /api/customers`
- `POST /api/customers`
- `GET /api/customers/:id`
- `PUT /api/customers/:id`
- `DELETE /api/customers/:id`
- `GET /api/orders`
- `GET /api/trips`

## Test Credentials

For login tests:
- Email: `admin@example.com`
- Password: `password123`

## Troubleshooting

### Request not being mocked?

1. Check endpoint path matches exactly (including `/api/` prefix)
2. Verify HTTP method (GET, POST, PUT, DELETE)
3. Check console for MSW warnings

### Handler not resetting?

- MSW automatically resets handlers after each test via `setup.ts`
- Don't call `server.close()` in individual tests

### Type errors?

```typescript
// Import types from msw
import type { DefaultBodyType } from 'msw';

// Define response types
interface CustomerResponse {
  data: {
    id: string;
    name: string;
  };
}
```

## Learn More

- Full documentation: `/home/naufal/Workspaces/tms-onward/frontend/admin/src/test/mocks/README.md`
- MSW Docs: https://mswjs.io/
- Example tests: `/home/naufal/Workspaces/tms-onward/frontend/admin/src/test/mocks/example.test.ts`
