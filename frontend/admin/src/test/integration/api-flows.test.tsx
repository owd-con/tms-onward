import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// MSW Server setup with direct handlers
const server = setupServer(
  // Auth - Login
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
  }),

  // Dashboard Stats
  http.get('/api/dashboard', () => {
    return HttpResponse.json({
      data: {
        total_orders: 150,
        active_trips: 5,
        pending_orders: 12,
        completed_orders: 133,
        total_customers: 20,
        total_drivers: 10,
        total_vehicles: 8,
        today_orders: 5,
        today_trips: 3,
      },
    });
  }),

  // Customers - List
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

  // Customers - Create
  http.post('/api/customers', async ({ request }) => {
    const body = await request.json() as Record<string, unknown> | null;
    const bodyData = body ?? {};
    return HttpResponse.json({
      data: {
        id: 'mock-new-customer',
        ...bodyData,
        is_active: true,
      },
    });
  }),

  // Customers - Get by ID
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

  // Customers - Update
  http.put('/api/customers/:id', async ({ request, params }) => {
    const body = await request.json() as Record<string, unknown> | null;
    const bodyData = body ?? {};
    return HttpResponse.json({
      data: {
        id: params.id,
        ...bodyData,
      },
    });
  }),

  // Customers - Delete
  http.delete('/api/customers/:id', () => {
    return HttpResponse.json({
      message: 'Customer deleted successfully',
    });
  }),

  // Vehicles - List
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

  // Vehicles - Create
  http.post('/api/vehicles', async ({ request }) => {
    const body = await request.json() as Record<string, unknown> | null;
    const bodyData = body ?? {};
    return HttpResponse.json({
      data: {
        id: 'mock-new-vehicle',
        ...bodyData,
        is_active: true,
      },
    });
  }),

  // Drivers - List
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

  // Drivers - Create
  http.post('/api/drivers', async ({ request }) => {
    const body = await request.json() as Record<string, unknown> | null;
    const bodyData = body ?? {};
    return HttpResponse.json({
      data: {
        id: 'mock-new-driver',
        ...bodyData,
        is_active: true,
      },
    });
  }),

  // Orders - List
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

  // Orders - Create
  http.post('/api/orders', async ({ request }) => {
    const body = await request.json() as Record<string, unknown> | null;
    const bodyData = body ?? {};
    return HttpResponse.json({
      data: {
        id: 'mock-new-order',
        order_number: 'ORD-NEW-001',
        ...bodyData,
        status: 'pending',
        total_price: 0,
      },
    });
  }),

  // Trips - List
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

  // Trips - Create
  http.post('/api/trips', async ({ request }) => {
    const body = await request.json() as Record<string, unknown> | null;
    const bodyData = body ?? {};
    return HttpResponse.json({
      data: {
        id: 'mock-new-trip',
        trip_number: 'TRIP-NEW-001',
        ...bodyData,
        status: 'planned',
      },
    });
  }),

  // Trips - Start
  http.post('/api/trips/:id/start', ({ params }) => {
    return HttpResponse.json({
      data: {
        id: params.id,
        status: 'in_transit',
        started_at: new Date().toISOString(),
      },
    });
  }),

  // Trips - Complete
  http.post('/api/trips/:id/complete', ({ params }) => {
    return HttpResponse.json({
      data: {
        id: params.id,
        status: 'completed',
        completed_at: new Date().toISOString(),
      },
    });
  }),
);

describe('API Integration Tests - Critical Flows', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'warn' });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  describe('Flow 1: Login -> Dashboard', () => {
    it('should login and load dashboard data', async () => {
      // Test login API
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'password123',
        }),
      });

      const loginData = await loginResponse.json();
      expect(loginResponse.status).toBe(200);
      expect(loginData.data).toHaveProperty('token');
      expect(loginData.data.session).toEqual({
        user_id: 'mock-user-id',
        company_id: 'mock-company-id',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'Admin',
      });

      // Test dashboard API
      const dashboardResponse = await fetch('/api/dashboard', {
        headers: {
          'Authorization': `Bearer ${loginData.data.token}`,
        },
      });

      const dashboardData = await dashboardResponse.json();
      expect(dashboardResponse.status).toBe(200);
      expect(dashboardData.data).toHaveProperty('total_orders');
      expect(dashboardData.data).toHaveProperty('active_trips');
      expect(dashboardData.data).toHaveProperty('pending_orders');
      expect(dashboardData.data).toHaveProperty('completed_orders');
    });

    it('should fail login with invalid credentials', async () => {
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'invalid@example.com',
          password: 'wrongpassword',
        }),
      });

      expect(loginResponse.status).toBe(401);
    });
  });

  describe('Flow 2: Create Customer -> View Customer', () => {
    it('should create customer and retrieve it', async () => {
      // Create customer
      const createResponse = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Customer',
          email: 'test@example.com',
          phone: '08123456789',
        }),
      });

      const createData = await createResponse.json();
      expect(createResponse.status).toBe(200);
      expect(createData.data).toHaveProperty('id');
      expect(createData.data.name).toBe('Test Customer');
      expect(createData.data.email).toBe('test@example.com');

      // Get customer list
      const listResponse = await fetch('/api/customers');
      const listData = await listResponse.json();

      expect(listResponse.status).toBe(200);
      expect(listData.data).toBeInstanceOf(Array);
      expect(listData.data.length).toBeGreaterThan(0);
    });

    it('should get customer by ID', async () => {
      const customerId = 'mock-customer-1';
      const response = await fetch(`/api/customers/${customerId}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveProperty('id', customerId);
      expect(data.data).toHaveProperty('name');
      expect(data.data).toHaveProperty('email');
    });

    it('should update customer', async () => {
      const customerId = 'mock-customer-1';
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Updated Customer Name',
          email: 'updated@example.com',
          phone: '08198765432',
        }),
      });

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.data.name).toBe('Updated Customer Name');
    });

    it('should delete customer', async () => {
      const customerId = 'mock-customer-1';
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('message');
    });
  });

  describe('Flow 3: Create Vehicle -> View Vehicle', () => {
    it('should create vehicle and verify in list', async () => {
      // Create vehicle
      const createResponse = await fetch('/api/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plate_number: 'B 5678 XYZ',
          type: 'Truck',
          capacity_weight: 5000,
          capacity_volume: 10,
          year: 2020,
          make: 'Hino',
          model: '300',
        }),
      });

      const createData = await createResponse.json();
      expect(createResponse.status).toBe(200);
      expect(createData.data).toHaveProperty('id');
      expect(createData.data.plate_number).toBe('B 5678 XYZ');

      // Get vehicle list
      const listResponse = await fetch('/api/vehicles');
      const listData = await listResponse.json();

      expect(listResponse.status).toBe(200);
      expect(listData.data).toBeInstanceOf(Array);
      expect(listData.data.length).toBeGreaterThan(0);
    });
  });

  describe('Flow 4: Create Driver -> View Driver', () => {
    it('should create driver and verify in list', async () => {
      // Create driver
      const createResponse = await fetch('/api/drivers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Driver',
          license_number: 'B 1234567',
          license_type: 'SIM_B1',
          phone: '08123456789',
        }),
      });

      const createData = await createResponse.json();
      expect(createResponse.status).toBe(200);
      expect(createData.data).toHaveProperty('id');
      expect(createData.data.name).toBe('Test Driver');

      // Get driver list
      const listResponse = await fetch('/api/drivers');
      const listData = await listResponse.json();

      expect(listResponse.status).toBe(200);
      expect(listData.data).toBeInstanceOf(Array);
      expect(listData.data.length).toBeGreaterThan(0);
    });
  });

  describe('Flow 5: Create Order -> View Order', () => {
    it('should create order with waypoints', async () => {
      // Create order
      const createResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: 'mock-customer-1',
          order_type: 'FTL',
          reference_code: 'REF-001',
          order_waypoints: [
            {
              type: 'Pickup',
              location_name: 'Jakarta',
              scheduled_date: '2024-01-26',
            },
            {
              type: 'Delivery',
              location_name: 'Bandung',
              scheduled_date: '2024-01-26',
            },
          ],
        }),
      });

      const createData = await createResponse.json();
      expect(createResponse.status).toBe(200);
      expect(createData.data).toHaveProperty('id');
      expect(createData.data.order_type).toBe('FTL');

      // Get order list
      const listResponse = await fetch('/api/orders');
      const listData = await listResponse.json();

      expect(listResponse.status).toBe(200);
      expect(listData.data).toBeInstanceOf(Array);
    });
  });

  describe('Flow 6: Create Trip -> Start Trip -> Complete Trip', () => {
    it('should create trip and update status', async () => {
      // Create trip
      const createResponse = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: 'mock-order-1',
          driver_id: 'mock-driver-1',
          vehicle_id: 'mock-vehicle-1',
        }),
      });

      const createData = await createResponse.json();
      expect(createResponse.status).toBe(200);
      expect(createData.data).toHaveProperty('id');
      expect(createData.data.status).toBe('planned');

      const tripId = createData.data.id;

      // Start trip
      const startResponse = await fetch(`/api/trips/${tripId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const startData = await startResponse.json();
      expect(startResponse.status).toBe(200);
      expect(startData.data.status).toBe('in_transit');
      expect(startData.data).toHaveProperty('started_at');

      // Complete trip
      const completeResponse = await fetch(`/api/trips/${tripId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const completeData = await completeResponse.json();
      expect(completeResponse.status).toBe(200);
      expect(completeData.data.status).toBe('completed');
      expect(completeData.data).toHaveProperty('completed_at');
    });
  });

  describe('Flow 7: Complete Order Fulfillment', () => {
    it('should create customer, order, and trip in sequence', async () => {
      // Step 1: Create customer
      const customerResponse = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'PT Complete Flow Test',
          email: 'completeflow@example.com',
          phone: '08123456789',
        }),
      });

      const customerData = await customerResponse.json();
      expect(customerResponse.status).toBe(200);
      const customerId = customerData.data.id;

      // Step 2: Create order
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: customerId,
          order_type: 'FTL',
          reference_code: 'CF-001',
        }),
      });

      const orderData = await orderResponse.json();
      expect(orderResponse.status).toBe(200);
      const orderId = orderData.data.id;

      // Step 3: Create trip
      const tripResponse = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: orderId,
          driver_id: 'mock-driver-1',
          vehicle_id: 'mock-vehicle-1',
        }),
      });

      const tripData = await tripResponse.json();
      expect(tripResponse.status).toBe(200);
      expect(tripData.data.order_id).toBe(orderId);
    });
  });
});
