import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from './mocks';

// Example Component (replace with actual component)
// import LoginPage from '@/pages/auth/LoginPage';

describe('MSW Example Tests', () => {
  it('should mock successful login', async () => {
    // This test demonstrates how MSW intercepts API calls
    // You can use this pattern to test your actual components

    // Example: Test login API
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'password123',
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.token).toBe('mock-jwt-token-12345');
    expect(data.data.session.email).toBe('admin@example.com');
  });

  it('should mock failed login', async () => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'wrong@example.com',
        password: 'wrongpassword',
      }),
    });

    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.error).toBe('Invalid credentials');
  });

  it('should mock dashboard data', async () => {
    const response = await fetch('/api/dashboard');
    const data = await response.json();

    expect(data.data.total_orders).toBe(150);
    expect(data.data.active_trips).toBe(5);
    expect(data.data.pending_orders).toBe(12);
    expect(data.data.completed_orders).toBe(133);
  });

  it('should override handlers for specific test', async () => {
    // Example: Override a handler for a specific test case
    server.use(
      http.get('/api/dashboard', () => {
        return HttpResponse.json({
          data: {
            total_orders: 999,
            active_trips: 10,
            pending_orders: 20,
            completed_orders: 969,
          },
        });
      })
    );

    const response = await fetch('/api/dashboard');
    const data = await response.json();

    // This should use the overridden handler
    expect(data.data.total_orders).toBe(999);
  });

  it('should mock customers list', async () => {
    const response = await fetch('/api/customers');
    const data = await response.json();

    expect(data.data).toHaveLength(2);
    expect(data.data[0].name).toBe('PT ABC Logistics');
    expect(data.data[1].name).toBe('PT XYZ Transport');
    expect(data.meta.total).toBe(2);
  });
});

/*
 * Example of testing a React component with MSW:
 *
 * describe('LoginPage Component', () => {
 *   it('should login successfully with valid credentials', async () => {
 *     render(<LoginPage />);
 *
 *     // Fill in the form
 *     fireEvent.change(screen.getByLabelText(/email/i), {
 *       target: { value: 'admin@example.com' },
 *     });
 *     fireEvent.change(screen.getByLabelText(/password/i), {
 *       target: { value: 'password123' },
 *     });
 *
 *     // Submit the form
 *     fireEvent.click(screen.getByRole('button', { name: /login/i }));
 *
 *     // Wait for the mocked response
 *     await waitFor(() => {
 *       expect(screen.getByText(/welcome/i)).toBeInTheDocument();
 *     });
 *   });
 * });
 */
