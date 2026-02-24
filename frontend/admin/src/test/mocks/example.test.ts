import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// Example MSW test
describe('MSW Example Tests', () => {
  it('should mock successful login', async () => {
    // Setup MSW server for this test
    const server = setupServer(
      http.post('/api/auth/login', async ({ request }) => {
        const body = await request.json() as { email?: string; password?: string } | null;
        if (body && body.email === 'admin@example.com' && body.password === 'password123') {
          return HttpResponse.json({
            data: {
              token: 'mock-jwt-token-12345',
              session: {
                user_id: 'mock-user-id',
                company_id: 'mock-company-id',
                email: 'admin@example.com',
                name: 'Admin User',
                role: 'Admin',
              },
            },
          });
        }
        return HttpResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      })
    );

    server.listen();

    try {
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
    } finally {
      // Cleanup
      server.close();
    }
  });
});
