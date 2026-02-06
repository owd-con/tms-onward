import { http, HttpResponse } from 'msw';

// Mock response data types
interface LoginResponse {
  data: {
    token: string;
    session: {
      user_id: string;
      company_id: string;
      email: string;
      name: string;
      role: string;
    };
  };
}

interface DashboardResponse {
  data: {
    total_orders: number;
    active_trips: number;
    pending_orders: number;
    completed_orders: number;
  };
}

export const handlers = [
  // POST /auth/login
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as { email: string; password: string };

    if (body.email === 'admin@example.com' && body.password === 'password123') {
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
      } satisfies LoginResponse);
    }

    return HttpResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  // GET /api/dashboard
  http.get('/api/dashboard', () => {
    return HttpResponse.json({
      data: {
        total_orders: 150,
        active_trips: 5,
        pending_orders: 12,
        completed_orders: 133,
      },
    } satisfies DashboardResponse);
  }),

  // GET /api/customers
  http.get('/api/customers', () => {
    return HttpResponse.json({
      data: [
        {
          id: 'mock-customer-1',
          name: 'PT ABC Logistics',
          email: 'info@abclogistics.co.id',
          phone: '08123456789',
          is_active: true,
        },
        {
          id: 'mock-customer-2',
          name: 'PT XYZ Transport',
          email: 'contact@xyztransport.com',
          phone: '08198765432',
          is_active: true,
        },
      ],
      meta: {
        page: 1,
        limit: 10,
        total: 2,
        total_pages: 1,
      },
    });
  }),

  // POST /api/customers (create)
  http.post('/api/customers', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      data: {
        id: 'mock-new-customer',
        ...body,
        is_active: true,
      },
    });
  }),

  // GET /api/customers/:id
  http.get('/api/customers/:id', ({ params }) => {
    return HttpResponse.json({
      data: {
        id: params.id,
        name: 'PT ABC Logistics',
        email: 'info@abclogistics.co.id',
        phone: '08123456789',
        is_active: true,
      },
    });
  }),

  // PUT /api/customers/:id
  http.put('/api/customers/:id', async ({ request, params }) => {
    const body = await request.json();
    return HttpResponse.json({
      data: {
        id: params.id,
        ...body,
      },
    });
  }),

  // DELETE /api/customers/:id
  http.delete('/api/customers/:id', () => {
    return HttpResponse.json({
      message: 'Customer deleted successfully',
    });
  }),

  // GET /api/orders
  http.get('/api/orders', () => {
    return HttpResponse.json({
      data: [
        {
          id: 'mock-order-1',
          order_number: 'ORD-2024-001',
          customer_id: 'mock-customer-1',
          customer: { name: 'PT ABC Logistics' },
          order_type: 'FTL',
          status: 'pending',
          total_price: 1500000,
          created_at: '2024-01-25T10:00:00Z',
        },
      ],
      meta: {
        page: 1,
        limit: 10,
        total: 1,
        total_pages: 1,
      },
    });
  }),

  // GET /api/trips
  http.get('/api/trips', () => {
    return HttpResponse.json({
      data: [
        {
          id: 'mock-trip-1',
          trip_number: 'TRIP-2024-001',
          driver_id: 'mock-driver-1',
          driver: { name: 'Driver A' },
          vehicle_id: 'mock-vehicle-1',
          vehicle: { plate_number: 'B 1234 ABC' },
          status: 'planned',
          created_at: '2024-01-25T10:00:00Z',
        },
      ],
      meta: {
        page: 1,
        limit: 10,
        total: 1,
        total_pages: 1,
      },
    });
  }),

  // GET /api/vehicles
  http.get('/api/vehicles', () => {
    return HttpResponse.json({
      data: [
        {
          id: 'mock-vehicle-1',
          plate_number: 'B 1234 ABC',
          type: 'Truck',
          capacity_weight: 5000,
          capacity_volume: 10,
          year: 2020,
          make: 'Hino',
          model: '300',
          is_active: true,
        },
      ],
      meta: {
        page: 1,
        limit: 10,
        total: 1,
        total_pages: 1,
      },
    });
  }),

  // POST /api/vehicles (create)
  http.post('/api/vehicles', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      data: {
        id: 'mock-new-vehicle',
        ...body,
        is_active: true,
      },
    });
  }),

  // GET /api/drivers
  http.get('/api/drivers', () => {
    return HttpResponse.json({
      data: [
        {
          id: 'mock-driver-1',
          name: 'Driver A',
          license_number: 'B 1234567',
          license_type: 'SIM_B1',
          phone: '08123456789',
          is_active: true,
        },
      ],
      meta: {
        page: 1,
        limit: 10,
        total: 1,
        total_pages: 1,
      },
    });
  }),

  // POST /api/drivers (create)
  http.post('/api/drivers', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      data: {
        id: 'mock-new-driver',
        ...body,
        is_active: true,
      },
    });
  }),

  // POST /api/orders (create)
  http.post('/api/orders', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      data: {
        id: 'mock-new-order',
        order_number: 'ORD-NEW-001',
        ...body,
        status: 'pending',
        total_price: 0,
      },
    });
  }),

  // POST /api/trips (create)
  http.post('/api/trips', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      data: {
        id: 'mock-new-trip',
        trip_number: 'TRIP-NEW-001',
        ...body,
        status: 'planned',
      },
    });
  }),

  // POST /api/trips/:id/start
  http.post('/api/trips/:id/start', ({ params }) => {
    return HttpResponse.json({
      data: {
        id: params.id,
        status: 'in_transit',
        started_at: new Date().toISOString(),
      },
    });
  }),

  // POST /api/trips/:id/complete
  http.post('/api/trips/:id/complete', ({ params }) => {
    return HttpResponse.json({
      data: {
        id: params.id,
        status: 'completed',
        completed_at: new Date().toISOString(),
      },
    });
  }),

  // 404 handler for undefined routes
  http.all('/api/:path*', () => {
    return HttpResponse.json(
      { error: 'Not Found' },
      { status: 404 }
    );
  }),
];

export default handlers;
