# Tasklist Backend - TMS Onward

Tasklist ini berisi daftar lengkap task untuk pengerjaan backend TMS Onward berdasarkan `blueprint.md` v3.0.

**Status Legend:**
- [ ] Todo - Belum dikerjakan
- [~] In Progress - Sedang dikerjakan
- [x] Done - Selesai

---

## Phase 0: Project Foundation Setup

### 0.1 Project Structure & Dependencies
- [x] Initialize Go module `github.com/logistics-id/tms-onward`
- [x] Setup local engine development (replace directive in go.mod)
- [x] Create backend folder structure following engine pattern
- [x] Setup `.env.example` with required environment variables
- [x] Setup Dockerfile for backend containerization
- [x] Create Makefile for build automation

### 0.2 Database Setup
- [x] Setup PostgreSQL connection in engine
- [x] Setup MongoDB connection (audit logs)
- [x] Setup Redis connection (cache & sessions)
- [x] Setup database migrations folder
- [x] Create initial migration schema

### 0.3 Application Initialization
- [x] Create `main.go` with REST server initialization
- [x] Setup `src/handler.go` for route registration
- [x] Setup `src/permission.go` for RBAC registration
- [x] Setup `src/subscriber.go` for event subscriber registration
- [x] Configure CORS middleware
- [x] Configure logging middleware

---

## Phase 1: Foundation (P0 Modules) ✅ DONE

### 1.1 Authentication Service
**Entity:**
- [x] Create `entity/user.go` with User entity
- [x] Create `entity/company.go` with Company entity

**Repository:**
- [x] Create `src/repository/user.go` - UserRepository
- [x] Create `src/repository/company.go` - CompanyRepository

**Usecase:**
- [x] Create `src/usecase/auth.go` - AuthUsecase
  - [x] Register method (create company + admin user)
  - [x] Login method (JWT generation)
  - [x] Refresh token method
  - [x] Logout method (delete session from Redis)
- [x] Create `src/usecase/company.go` - CompanyUsecase
- [x] Create `src/usecase/user.go` - UserUsecase

**Handler:**
- [x] Create `src/handler/rest/auth/handler.go`
- [x] Create `src/handler/rest/auth/request_register.go`
- [x] Create `src/handler/rest/auth/request_login.go`
- [x] Create `src/handler/rest/auth/request_refresh.go`
- [x] Create `src/handler/rest/auth/request_logout.go`

**Endpoints:**
- [x] POST `/auth/register` - Register new company & admin user
- [x] POST `/auth/login` - Login user
- [x] POST `/auth/refresh` - Refresh access token
- [x] POST `/auth/logout` - Logout user

**Additional:**
- [x] Implement JWT middleware with session check
- [x] Add permission slugs for auth
- [x] Create migrations for `companies` and `users` tables

### 1.2 Company Management
**Usecase:**
- [x] Get company info (current user)
- [x] Update company info
- [x] Complete onboarding
- [x] Activate/Deactivate company

**Handler:**
- [x] Create `src/handler/rest/company/handler.go`
- [x] Create `src/handler/rest/company/request_get.go`
- [x] Create `src/handler/rest/company/request_update.go`
- [x] Create `src/handler/rest/company/request_onboarding.go`
- [x] Create `src/handler/rest/company/request_activate.go`
- [x] Create `src/handler/rest/company/request_deactivate.go`

**Endpoints:**
- [x] GET `/companies` - Get company info
- [x] PUT `/companies` - Update company info
- [x] POST `/companies/onboarding` - Complete onboarding
- [x] PUT `/companies/:id/activate` - Activate company
- [x] PUT `/companies/:id/deactivate` - Deactivate company

### 1.3 User & Role Management with RBAC
**Usecase:**
- [x] List users (Admin/Dispatcher only)
- [x] Create user (Admin only)
- [x] Get user detail
- [x] Update user (with sync to driver if role=Driver)
- [x] Delete user (soft delete, cascade to driver if role=Driver)
- [x] Change password
- [x] Get current user profile
- [x] Update current user profile
- [x] Activate/Deactivate user

**Handler:**
- [x] Create `src/handler/rest/user/handler.go`
- [x] Create `src/handler/rest/user/request_get.go` (list & detail)
- [x] Create `src/handler/rest/user/request_create.go`
- [x] Create `src/handler/rest/user/request_update.go`
- [x] Create `src/handler/rest/user/request_delete.go`
- [x] Create `src/handler/rest/user/request_password.go`
- [x] Create `src/handler/rest/user/request_me.go` (get & update profile)
- [x] Create `src/handler/rest/user/request_activate.go`
- [x] Create `src/handler/rest/user/request_deactivate.go`

**Endpoints:**
- [x] GET `/users` - List users
- [x] POST `/users` - Create user
- [x] GET `/users/:id` - Get user detail
- [x] PUT `/users/:id` - Update user
- [x] DELETE `/users/:id` - Delete user
- [x] PUT `/users/:id/password` - Change password
- [x] GET `/users/me` - Get current user profile
- [x] PUT `/users/me` - Update current user profile
- [x] PUT `/users/:id/activate` - Activate user
- [x] PUT `/users/:id/deactivate` - Deactivate user

**Additional:**
- [x] Implement permission checking middleware
- [x] Add role-based access control
- [x] Add user-specific validation (self-deactivate, min active user)

---

## Phase 2: Master Data Management (P0 Module) ✅ DONE

### 2.1 Location Management
**Entity:**
- [x] Create `entity/country.go`
- [x] Create `entity/province.go`
- [x] Create `entity/city.go`
- [x] Create `entity/district.go`
- [x] Create `entity/village.go`

**Repository:**
- [x] Create `src/repository/country.go`
- [x] Create `src/repository/province.go`
- [x] Create `src/repository/city.go`
- [x] Create `src/repository/district.go`
- [x] Create `src/repository/village.go`

**Usecase:**
- [x] Create `src/usecase/geo.go` - GeoUsecase
  - [x] List countries
  - [x] List provinces by country
  - [x] List cities by province
  - [x] List districts by city
  - [x] List villages by district
  - [x] Lookup location by postal code

**Handler:**
- [x] Create `src/handler/rest/geo/handler.go`
- [x] Create `src/handler/rest/geo/request_list.go`

**Endpoints:**
- [x] GET `/geo/countries` - List countries
- [x] GET `/geo/provinces` - List provinces by country
- [x] GET `/geo/cities` - List cities by province
- [x] GET `/geo/districts` - List districts by city
- [x] GET `/geo/villages` - List villages by district
- [x] GET `/geo/lookup` - Lookup location by postal code

**Migrations:**
- [x] Create `countries` table migration
- [x] Create `provinces` table migration
- [x] Create `cities` table migration
- [x] Create `districts` table migration
- [x] Create `villages` table migration

### 2.2 Customer Management
**Entity:**
- [x] Create `entity/customer.go`

**Repository:**
- [x] Create `src/repository/customer.go`

**Usecase:**
- [x] Create `src/usecase/customer.go` - CustomerUsecase
  - [x] List customers
  - [x] Create customer
  - [x] Get customer detail
  - [x] Update customer
  - [x] Delete customer (soft delete)
  - [x] Activate customer
  - [x] Deactivate customer

**Handler:**
- [x] Create `src/handler/rest/customer/handler.go`
- [x] Create `src/handler/rest/customer/request_get.go`
- [x] Create `src/handler/rest/customer/request_create.go`
- [x] Create `src/handler/rest/customer/request_update.go`
- [x] Create `src/handler/rest/customer/request_delete.go`
- [x] Create `src/handler/rest/customer/request_activate.go`
- [x] Create `src/handler/rest/customer/request_deactivate.go`

**Endpoints:**
- [x] GET `/customers` - List customers
- [x] POST `/customers` - Create customer
- [x] GET `/customers/:id` - Get customer detail
- [x] PUT `/customers/:id` - Update customer
- [x] DELETE `/customers/:id` - Delete customer
- [x] PUT `/customers/:id/activate` - Activate customer
- [x] PUT `/customers/:id/deactivate` - Deactivate customer

**Migrations:**
- [x] Create `customers` table migration

### 2.3 Customer Addresses Management
**Entity:**
- [x] Create `entity/address.go`

**Repository:**
- [x] Create `src/repository/address.go`

**Usecase:**
- [x] Create `src/usecase/address.go` - AddressUsecase
  - [x] List addresses (filter by customer_id)
  - [x] Create address
  - [x] Get address detail
  - [x] Update address
  - [x] Delete address (soft delete)
  - [x] Activate address
  - [x] Deactivate address

**Handler:**
- [x] Create `src/handler/rest/address/handler.go`
- [x] Create `src/handler/rest/address/request_get.go`
- [x] Create `src/handler/rest/address/request_create.go`
- [x] Create `src/handler/rest/address/request_update.go`
- [x] Create `src/handler/rest/address/request_delete.go`
- [x] Create `src/handler/rest/address/request_activate.go`
- [x] Create `src/handler/rest/address/request_deactivate.go`

**Endpoints:**
- [x] GET `/addresses` - List addresses
- [x] POST `/addresses` - Create address
- [x] GET `/addresses/:id` - Get address detail
- [x] PUT `/addresses/:id` - Update address
- [x] DELETE `/addresses/:id` - Delete address
- [x] PUT `/addresses/:id/activate` - Activate address
- [x] PUT `/addresses/:id/deactivate` - Deactivate address

**Migrations:**
- [x] Create `addresses` table migration

### 2.4 Vehicle Management
**Entity:**
- [x] Create `entity/vehicle.go`

**Repository:**
- [x] Create `src/repository/vehicle.go`

**Usecase:**
- [x] Create `src/usecase/vehicle.go` - VehicleUsecase
  - [x] List vehicles
  - [x] Create vehicle
  - [x] Get vehicle detail
  - [x] Update vehicle
  - [x] Delete vehicle (soft delete)
  - [x] Activate vehicle
  - [x] Deactivate vehicle

**Handler:**
- [x] Create `src/handler/rest/vehicle/handler.go`
- [x] Create `src/handler/rest/vehicle/request_get.go`
- [x] Create `src/handler/rest/vehicle/request_create.go`
- [x] Create `src/handler/rest/vehicle/request_update.go`
- [x] Create `src/handler/rest/vehicle/request_delete.go`
- [x] Create `src/handler/rest/vehicle/request_activate.go`
- [x] Create `src/handler/rest/vehicle/request_deactivate.go`

**Endpoints:**
- [x] GET `/vehicles` - List vehicles
- [x] POST `/vehicles` - Create vehicle
- [x] GET `/vehicles/:id` - Get vehicle detail
- [x] PUT `/vehicles/:id` - Update vehicle
- [x] DELETE `/vehicles/:id` - Delete vehicle
- [x] PUT `/vehicles/:id/activate` - Activate vehicle
- [x] PUT `/vehicles/:id/deactivate` - Deactivate vehicle

**Migrations:**
- [x] Create `vehicles` table migration

### 2.5 Driver Management
**Entity:**
- [x] Create `entity/driver.go`

**Repository:**
- [x] Create `src/repository/driver.go`

**Usecase:**
- [x] Create `src/usecase/driver.go` - DriverUsecase
  - [x] List drivers
  - [x] Create driver (with option to create user account)
  - [x] Get driver detail
  - [x] Update driver (sync name & phone to user if user_id != NULL)
  - [x] Delete driver (soft delete, cascade to user if user_id != NULL)
  - [x] Activate driver
  - [x] Deactivate driver

**Handler:**
- [x] Create `src/handler/rest/driver/handler.go`
- [x] Create `src/handler/rest/driver/request_get.go`
- [x] Create `src/handler/rest/driver/request_create.go`
- [x] Create `src/handler/rest/driver/request_update.go`
- [x] Create `src/handler/rest/driver/request_delete.go`
- [x] Create `src/handler/rest/driver/request_activate.go`
- [x] Create `src/handler/rest/driver/request_deactivate.go`

**Endpoints:**
- [x] GET `/drivers` - List drivers
- [x] POST `/drivers` - Create driver
- [x] GET `/drivers/:id` - Get driver detail
- [x] PUT `/drivers/:id` - Update driver
- [x] DELETE `/drivers/:id` - Delete driver
- [x] PUT `/drivers/:id/activate` - Activate driver
- [x] PUT `/drivers/:id/deactivate` - Deactivate driver

**Additional:**
- [x] Implement Driver-User sync logic (2-way sync for name & phone)
- [x] Add transaction safety for sync operations

**Migrations:**
- [x] Create `drivers` table migration

### 2.6 Pricing Matrix Management
**Entity:**
- [x] Create `entity/pricing_matrix.go`

**Repository:**
- [x] Create `src/repository/pricing_matrix.go`

**Usecase:**
- [x] Create `src/usecase/pricing_matrix.go` - PricingMatrixUsecase
  - [x] List pricing matrices
  - [x] Create pricing matrix
  - [x] Get pricing matrix detail
  - [x] Update pricing matrix
  - [x] Delete pricing matrix (soft delete)
  - [x] Calculate price (origin, destination, customer_id)
  - [x] Activate pricing matrix
  - [x] Deactivate pricing matrix

**Handler:**
- [x] Create `src/handler/rest/pricing_matrix/handler.go`
- [x] Create `src/handler/rest/pricing_matrix/request_get.go`
- [x] Create `src/handler/rest/pricing_matrix/request_create.go`
- [x] Create `src/handler/rest/pricing_matrix/request_update.go`
- [x] Create `src/handler/rest/pricing_matrix/request_delete.go`
- [x] Create `src/handler/rest/pricing_matrix/request_calculate.go`
- [x] Create `src/handler/rest/pricing_matrix/request_activate.go`
- [x] Create `src/handler/rest/pricing_matrix/request_deactivate.go`

**Endpoints:**
- [x] GET `/pricing-matrices` - List pricing matrices
- [x] POST `/pricing-matrices` - Create pricing matrix
- [x] GET `/pricing-matrices/:id` - Get pricing matrix detail
- [x] PUT `/pricing-matrices/:id` - Update pricing matrix
- [x] DELETE `/pricing-matrices/:id` - Delete pricing matrix
- [x] GET `/pricing-matrices/price` - Calculate price
- [x] PUT `/pricing-matrices/:id/activate` - Activate pricing matrix
- [x] PUT `/pricing-matrices/:id/deactivate` - Deactivate pricing matrix

**Migrations:**
- [x] Create `pricing_matrices` table migration

---

## Phase 2.5: Activate/Deactivate Feature (P0 Module) ✅ DONE

### 2.5.1 Session Management
- [x] Implement Redis session management with JTI
- [x] Create session key pattern: `onward-tms:session:{userID}:{jti}`
- [x] Implement session creation (login)
- [x] Implement session deletion (logout)
- [x] Implement session retrieval (middleware)
- [x] Implement delete all user sessions (deactivate)

### 2.5.2 Middleware
- [x] Create `CheckUserActive` middleware
- [x] Check Redis session on every protected request
- [x] Return 401 if session invalid
- [x] Return 503 if Redis down
- [x] Implement `WithAuthAndActiveCheck` helper

### 2.5.3 Activate/Deactivate Endpoints
For each resource (User, Company, Customer, Vehicle, Driver, Address, PricingMatrix):
- [x] Implement activate endpoint
- [x] Implement deactivate endpoint
- [x] Add status query parameter to list endpoints (?status=active|inactive)

### 2.5.4 Validation Rules
- [x] Implement "already active" check
- [x] Implement "already inactive" check
- [x] Implement self-deactivate prevention (users)
- [x] Implement minimum active user check (1 user per company)
- [x] Implement company active check during login

### 2.5.5 Additional
- [x] Update logout handler to support JTI-based session deletion
- [x] Add permission slugs for activate/deactivate operations

---

## Phase 3: Order Management (P0 Module) ✅ DONE

### 3.1 Order Entity & Repository
**Entity:**
- [x] Create `entity/order.go`
- [x] Create `entity/order_waypoint.go`

**Repository:**
- [x] Create `src/repository/order.go`
- [x] Create `src/repository/order_waypoint.go`

**Migrations:**
- [x] Create `orders` table migration
- [x] Create `order_waypoints` table migration

### 3.2 Order Usecase
- [x] Create `src/usecase/order.go` - OrderUsecase
  - [x] List orders with filters
  - [x] Create order (FTL/LTL)
  - [x] Get order detail
  - [x] Update order
  - [x] Cancel order
  - [x] Calculate total price (sum of delivery waypoint prices)
  - [x] Handle manual override price (FTL only)
  - [x] Set waypoint sequence (FTL: at creation, LTL: NULL)

### 3.3 Order Waypoint Usecase
- [x] Create waypoint management
- [x] Validate address_id is required (not NULL)
- [x] Handle items per waypoint (JSONB)
- [x] Calculate price per waypoint (delivery only)

### 3.4 Order Handlers
- [x] Create `src/handler/rest/order/handler.go`
- [x] Create `src/handler/rest/order/request_get.go`
- [x] Create `src/handler/rest/order/request_create.go`
- [x] Create `src/handler/rest/order/request_update.go`
- [x] Create `src/handler/rest/order/request_delete.go`

**Endpoints:**
- [x] GET `/orders` - List orders
- [x] POST `/orders` - Create order
- [x] GET `/orders/:id` - Get order detail
- [x] PUT `/orders/:id` - Update order
- [x] DELETE `/orders/:id` - Cancel order

### 3.5 Waypoint Logs
**Entity:**
- [x] Create `entity/waypoint_log.go`

**Repository:**
- [x] Create `src/repository/waypoint_log.go`

**Usecase:**
- [x] Create waypoint log on order events
- [x] Create waypoint log on status changes
- [x] Query logs by order_id or trip_waypoint_id

**Migration:**
- [x] Create `waypoint_logs` table migration

---

## Phase 4: Direct Assignment (P0 Module) ✅ DONE

### 4.1 Trip Entity & Repository
**Entity:**
- [x] Create `entity/trip.go`
- [x] Create `entity/trip_waypoint.go`

**Repository:**
- [x] Create `src/repository/trip.go`
- [x] Create `src/repository/trip_waypoint.go`

**Migrations:**
- [x] Create `trips` table migration
- [x] Create `trip_waypoints` table migration

### 4.2 Trip Usecase
- [x] Create `src/usecase/trip.go` - TripUsecase
  - [x] List trips
  - [x] Create trip (assign driver + vehicle)
  - [x] Get trip detail (includes waypoints)
  - [x] Update trip (notes, waypoint sequence)
  - [x] Delete trip (soft delete)
  - [x] Dispatch trip (Planned → Dispatched)
  - [x] Set waypoint sequence (FTL from order, LTL from request)
  - [x] Create trip_waypoints immediately on trip creation
  - [x] Auto-complete trip when all waypoints final
  - [x] Support trip update for sequence change (Planned, LTL only)

### 4.3 Trip Handlers
- [x] Create `src/handler/rest/trip/handler.go`
- [x] Create `src/handler/rest/trip/request_get.go`
- [x] Create `src/handler/rest/trip/request_create.go`
- [x] Create `src/handler/rest/trip/request_update.go`
- [x] Create `src/handler/rest/trip/request_delete.go`
- [x] Create `src/handler/rest/trip/request_dispatch.go`

**Endpoints:**
- [x] GET `/trips` - List trips
- [x] POST `/trips` - Create trip
- [x] GET `/trips/:id` - Get trip detail
- [x] PUT `/trips/:id` - Update trip
- [x] DELETE `/trips/:id` - Delete trip
- [x] PUT `/trips/:id/dispatch` - Dispatch trip

### 4.4 Status Synchronization
- [x] Implement Order ↔ Trip status cascade
- [x] Implement Order ↔ OrderWaypoint status cascade
- [x] Implement TripWaypoint ↔ OrderWaypoint status cascade
- [x] Implement status flow matrix rules

---

## Phase 5: Driver Web (P0 Module) ✅ DONE

### 5.1 Driver Trip Endpoints
**Usecase:**
- [x] Get my active trips (Planned, Dispatched, In Transit)
- [x] Get my trip history (all statuses)
- [x] Get trip detail

**Handler:**
- [x] Create `src/handler/rest/driver_web/handler.go`
- [x] Create `src/handler/rest/driver_web/request_get_trips.go`
- [x] Create `src/handler/rest/driver_web/request_get_trip_detail.go`

**Endpoints:**
- [x] GET `/driver/trips` - Get active trips
- [x] GET `/driver/trips/history` - Get trip history
- [x] GET `/driver/trips/:id` - Get trip detail

### 5.2 Driver Waypoint Operations
**Usecase:**
- [x] Start trip (Dispatched → In Transit)
- [x] Start waypoint (Pending → In Transit)
- [x] Arrive at pickup (In Transit → Completed)
- [x] Complete delivery with POD (In Transit → Completed)
- [x] Report failed waypoint (In Transit → Completed/Failed)

**Handler:**
- [x] Create `src/handler/rest/driver_web/request_start_trip.go`
- [x] Create `src/handler/rest/driver_web/request_start_waypoint.go`
- [x] Create `src/handler/rest/driver_web/request_arrive_waypoint.go`
- [x] Create `src/handler/rest/driver_web/request_complete_waypoint.go`
- [x] Create `src/handler/rest/driver_web/request_failed_waypoint.go`

**Endpoints:**
- [x] PUT `/driver/trips/:id/start` - Start trip
- [x] PUT `/driver/trips/waypoint/:id/start` - Start waypoint
- [x] PUT `/driver/trips/waypoint/:id/arrive` - Arrive at pickup
- [x] PUT `/driver/trips/waypoint/:id/complete` - Complete delivery
- [x] PUT `/driver/trips/waypoint/:id/failed` - Report failed

### 5.3 Waypoint Images & POD
**Entity:**
- [x] Create `entity/waypoint_image.go`

**Repository:**
- [x] Create `src/repository/waypoint_image.go`

**Usecase:**
- [x] Create POD record (type: 'pod')
- [x] Create failed record (type: 'failed')
- [x] Query waypoint images by trip or trip_waypoint

**Handler:**
- [x] Create `src/handler/rest/waypoint/request_images.go`
- [x] Create `src/handler/rest/waypoint/request_logs.go`

**Endpoints:**
- [x] GET `/waypoint/images` - Get waypoint images
- [x] GET `/waypoint/logs` - Get waypoint logs

**Migration:**
- [x] Create `waypoint_images` table migration

### 5.4 S3 Presigned URL
**Usecase:**
- [x] Generate presigned URL for S3 upload
- [x] Configure AWS SDK
- [x] Set expiry time (5 minutes)
- [x] Set PUT permission only

**Handler:**
- [x] Create `src/handler/rest/upload/request_presigned_url.go`

**Endpoints:**
- [x] POST `/upload/presigned-url` - Generate presigned URL

---

## Phase 6: Exception Management (P0 Module) ✅ DONE

### 6.1 Exception Usecase
- [x] Create `src/usecase/exception.go` - ExceptionUsecase
  - [x] List orders with failed/returned waypoints
  - [x] List failed/returned waypoints
  - [x] Return waypoint to origin
  - [x] Batch reschedule waypoints to new trip

### 6.2 Exception Handlers
- [x] Create `src/handler/rest/exception/handler.go`
- [x] Create `src/handler/rest/exception/request_get_orders.go`
- [x] Create `src/handler/rest/exception/request_get_waypoints.go`
- [x] Create `src/handler/rest/exception/request_return_waypoint.go`
- [x] Create `src/handler/rest/exception/request_batch_reschedule.go`

**Endpoints:**
- [x] GET `/exceptions/orders` - List orders with exceptions
- [x] GET `/exceptions/waypoints` - List failed/returned waypoints
- [x] PUT `/exceptions/waypoints/:id/return` - Return waypoint
- [x] POST `/exceptions/waypoints/batch-reschedule` - Batch reschedule

### 6.3 Reschedule Logic
- [x] Validate old trip is Completed
- [x] Validate all waypoints belong to same order
- [x] Create new trip with rescheduled waypoints
- [x] Reset order_waypoints status (Failed → Pending)
- [x] Create new trip_waypoints with new sequence
- [x] Preserve old trip_waypoints as history
- [x] Create waypoint logs for audit trail

---

## Phase 7: Notification Service (P1 Module) ✅ DONE

### 7.1 Email Service
**Entity:**
- [x] Create `entity/notification.go`

**Repository:**
- [x] Create `src/repository/notification.go` (PostgreSQL)

**Usecase:**
- [x] Create `src/usecase/notification.go` - NotificationUsecase
- [x] Setup SMTP client
- [x] Create email templates (ID & EN)
  - [x] Failed Delivery template
  - [x] Delivered template
- [x] Implement email sending logic
- [x] Create notification trigger on waypoint_failed event
- [x] Create notification trigger on waypoint_completed event

**Event Publisher:**
- [x] Create `src/event/publisher/notification.go`
- [x] PublishFailedDelivery event
- [x] PublishDelivered event

**Event Subscriber:**
- [x] Create `src/event/subscriber/notification.go`
- [x] Subscribe to failed_delivery event → send email
- [x] Subscribe to delivered event → send email

**Email Service:**
- [x] Create `src/service/email/email.go`
- [x] SMTP client implementation
- [x] SendDeliverySuccessToUser method
- [x] SendFailedDeliveryToUser method

**Email Templates:**
- [x] templates/email/failed_delivery_id.html
- [x] templates/email/failed_delivery_en.html
- [x] templates/email/delivered_id.html
- [x] templates/email/delivered_en.html

---

## Phase 8: Dashboard & Reports (P1 Module) ✅ DONE

### 8.1 Dashboard Usecase
- [x] Create `src/usecase/dashboard.go` - DashboardUsecase
  - [x] Get active orders count
  - [x] Get completed orders count
  - [x] Get active trips count
  - [x] Get failed waypoints count
  - [x] Get revenue summary
  - [x] Get recent activities

### 8.2 Dashboard Handler
- [x] Create `src/handler/rest/dashboard/handler.go`
- [x] Create `src/handler/rest/dashboard/request_get.go`

**Endpoints:**
- [x] GET `/dashboard` - Get dashboard summary

### 8.3 Report Usecase
- [x] Get order trip waypoint report (with filters, pagination)
- [x] Get revenue report (with filters, group by)
- [x] Get driver performance report (with filters, sorting)
- [x] Get customer report (with filters, sorting)
- [x] Export to Excel (using `downloadable=true` parameter)

### 8.4 Report Handler
- [x] Create `src/handler/rest/report/handler.go`
- [x] Create `src/handler/rest/report/request_order_trip_waypoint.go`
- [x] Create `src/handler/rest/report/request_revenue.go`
- [x] Create `src/handler/rest/report/request_driver_performance.go`
- [x] Create `src/handler/rest/report/request_customer.go`

**Endpoints:**
- [x] GET `/reports/order-trip-waypoint` - Order Trip Waypoint report (with `downloadable=true` for Excel)
- [x] GET `/reports/revenue` - Revenue report (with `downloadable=true` for Excel)
- [x] GET `/reports/driver-performance` - Driver Performance report (with `downloadable=true` for Excel)
- [x] GET `/reports/customer` - Customer report (with `downloadable=true` for Excel)

**Note:**
- Orders, Trips, dan Exception List sudah tersedia di menu masing-masing (tidak perlu report terpisah)
- Export mechanism menggunakan parameter `downloadable=true`, bukan endpoint terpisah
- Updated ReportQueryOptions with: CustomerID, DriverID, GroupBy, SortBy, Page (int64), Limit (int64)
- Added DriverPerformanceReportWrapper for pagination support
- Added OrderTripWaypointReport, CustomerReport, CustomerReportItem, OrderTripWaypointReportItem structs
- All reports support JSON response (default) and Excel download (`downloadable=true`)
- **CLEANUP (Phase 8 Refinement):** Removed duplicate/legacy endpoints:
  - Deleted: `/reports/orders`, `/reports/trips`, `/reports/exceptions`, `/reports/drivers`
  - Reason: Data already available in respective menus (Orders, Trips, Exceptions)
  - Deleted old request files: `request_get_order_report.go`, `request_get_trip_report.go`, `request_get_exception_report.go`, `request_get_driver_performance_report.go`
  - Kept: `/reports/revenue` (existing endpoint, still used)
  - Final endpoints: 4 report endpoints with proper sorting/filtering/pagination

---

## Phase 9: Multi-language (P1 Module) ✅ DONE

### 9.1 i18n Service
**Entity:**
- [x] Create `entity/translation.go`

**Repository:**
- [x] Create `src/repository/translation.go` (PostgreSQL JSONB)

**Usecase:**
- [x] Create `src/usecase/i18n.go` - I18nUsecase
- [x] Get translations by language
- [x] Create translation keys (ID & EN)
- [x] Load initial translations

**Handler:**
- [x] Create `src/handler/rest/i18n/handler.go`
- [x] Create `src/handler/rest/i18n/request_get.go`

**Endpoints:**
- [x] GET `/i18n/:lang` - Get translations

### 9.2 Translation Data
- [x] Create translations for ID (Indonesian)
- [x] Create translations for EN (English)
- [x] Add translations for all UI strings
- [x] Add translations for error messages
- [x] Add translations for status values

**Migration:**
- [x] Create `translations` table

---

## Phase 10: Public Tracking (P1 Module) ✅ DONE

### 10.1 Public Tracking Usecase
- [x] Create `src/usecase/tracking.go` - TrackingUsecase
  - [x] Get order by order_number (no auth)
  - [x] Get order waypoints
  - [x] Get waypoint logs
  - [x] Get waypoint images
  - [x] Get trip info (driver, vehicle)

### 10.2 Public Tracking Handler
- [x] Create `src/handler/rest/tracking/handler.go`
- [x] Create `src/handler/rest/tracking/request_tracking.go`

**Endpoints:**
- [x] GET `/public/tracking/:orderNumber` - Track order (no auth)

### 10.3 Tracking Data
- [x] Return order info (status, customer, dates)
- [x] Return waypoints with status
- [x] Return timeline logs (with Indonesian messages)
- [x] Return recipient names (from completed deliveries)
- [x] Return driver & vehicle info
- [x] Return POD images

---

## Phase 11: Onboarding Wizard (P2 Module) ✅ DONE

### 11.1 Onboarding Usecase
- [x] Create `src/usecase/onboarding.go` - OnboardingUsecase
  - [x] Step 1: Company info
  - [x] Step 2: Admin password setup
  - [x] Step 3: Create initial data (customer, vehicle, driver)
  - [x] Complete onboarding
  - [x] Skip onboarding option

### 11.2 Onboarding Handler
- [x] Create `src/handler/rest/onboarding/handler.go`
- [x] Create `src/handler/rest/onboarding/request_step1.go`
- [x] Create `src/handler/rest/onboarding/request_step2.go`
- [x] Create `src/handler/rest/onboarding/request_step3.go`
- [x] Create `src/handler/rest/onboarding/request_complete.go`
- [x] Create `src/handler/rest/onboarding/request_skip.go`

**Endpoints:**
- [x] POST `/onboarding/step1` - Company info
- [x] POST `/onboarding/step2` - Password setup
- [x] POST `/onboarding/step3` - Initial data
- [x] POST `/onboarding/complete` - Complete onboarding
- [x] POST `/onboarding/skip` - Skip onboarding

---

## Phase 12: Audit Trail (P2 Module) ✅ DONE

### 12.1 Waypoint Logs (PostgreSQL)
**Entity:**
- [x] Create `entity/waypoint_log.go`

**Repository:**
- [x] Create `src/repository/waypoint_log.go`

**Usecase:**
- [x] Create waypoint log on order events
- [x] Create waypoint log on status changes
- [x] Query logs by order_id or trip_waypoint_id

**Migration:**
- [x] Create `waypoint_logs` table migration

**Note:** MongoDB order_logs removed from scope - audit trail sufficiently covered by waypoint_logs in PostgreSQL per business requirements.

---

## Phase 13: Bug Fixes - Blueprint Compliance (P0 - CRITICAL) ✅ DONE

### 13.1 Missing Entity Field
**Issue:** Entity `OrderWaypoint` missing `returned_note` field

**Blueprint Reference:**
- Section 2.2.2 Order Tables (line 496)
- Section 3.11 Exception Endpoints (line 1658)

**Impact:**
- Exception return endpoint tidak bisa menyimpan alasan return
- Audit trail untuk returned waypoint tidak lengkap

**Tasks:**
- [x] Add `ReturnedNote *string` field to `entity/order_waypoint.go`
- [x] Update `bun` tag for `returned_note` column
- [x] Create migration to add `returned_note` column to `order_waypoints` table
- [x] Update Exception return handler to save `returned_note`
- [x] Update exception return request validation to require `returned_note`

### 13.2 Order Auto-Complete Logic Bug
**Issue:** Order auto-complete includes "failed" as final state (SALAH)

**Blueprint Reference:**
- Section 2.2.4 Status Synchronization Rules (lines 710-715)
- Section 2.2.4 Order Completion Rule (lines 718-724)

**Tasks:**
- [x] Fix `CheckAndUpdateOrderStatus` in `src/usecase/waypoint.go`
- [x] Remove "failed" from final state check
- [x] Update comment to reflect correct blueprint v3.0 rules
- [x] Add unit test for order auto-complete with failed waypoints
- [x] Add unit test for order auto-complete with all completed waypoints
- [x] Add unit test for order auto-complete with mixed completed/returned waypoints

#### Bug #1: Order Auto-Complete Logic Error

**Current Bug (src/usecase/waypoint.go:482):**
```go
if ow.DispatchStatus != "completed" && ow.DispatchStatus != "failed" && ow.DispatchStatus != "returned" {
```

**Correct Behavior (per Blueprint):**
```go
// Order hanya auto-complete jika SEMUA waypoints completed/returned TANPA failed
if ow.DispatchStatus != "completed" && ow.DispatchStatus != "returned" {
```

**Impact:**
- Order akan auto-complete walaupun masih ada **failed waypoints**
- Melanggar business rule: "Order TIDAK auto-complete jika ada Failed waypoints"

**Tasks:**
- [x] Fix `CheckAndUpdateOrderStatus` in `src/usecase/waypoint.go` (line 482)
- [x] Remove "failed" from final state check for order completion
- [x] Update comment (line 471) to reflect correct blueprint v3.0 rules
- [x] Add unit test for order auto-complete with failed waypoints
- [x] Add unit test for order auto-complete with all completed waypoints
- [x] Add unit test for order auto-complete with mixed completed/returned waypoints

#### Bug #2: Missing returned_note Field

**Issue:**
Per blueprint.md line 496 & 1658, entity `OrderWaypoint` harus memiliki field `returned_note` untuk menyimpan keterangan ketika waypoint gagal dan dikembalikan ke origin.

**Current State:**
- Entity `OrderWaypoint` tidak memiliki field `returned_note`
- Tidak ada API endpoint untuk menandai waypoint sebagai "returned"
- Tidak ada validasi untuk return operation

**Required Changes:**
- [x] Add `ReturnedNote *string` field to `entity/order_waypoint.go`
- [x] Create migration for `returned_note` column
- [x] Add handler `PUT /exceptions/waypoints/:id/return`
- [x] Add usecase method `ReturnWaypoint()` in `ExceptionUsecase`
- [x] Validate: waypoint status must be "failed"
- [x] Validate: trip status must be "completed" before return
- [x] Create waypoint_log entry for audit trail

---

## Additional Tasks

### A. Testing
- [x] Unit tests for all usecases
- [x] Integration tests for API endpoints
- [x] Repository tests with test database
- [ ] Migration rollback tests

### B. Documentation
- [x] API documentation (OpenAPI/Swagger)
- [x] Developer setup guide (README.md, PROJECT_STRUCTURE_GUIDE.md)
- [ ] Database schema documentation (ERD, table structure docs)
- [ ] Deployment guide (Production setup, K8s, environment troubleshooting)

### C. DevOps (33% Complete - 2/6 items)
- [ ] CI/CD pipeline setup
- [x] Docker compose for local development (PostgreSQL, Redis, RabbitMQ, MongoDB with healthcheck)
- [ ] Kubernetes manifests (if needed)
- [ ] Monitoring & logging setup (Prometheus, Grafana, ELK)
- [ ] Health check endpoints (GET /health, /ping)
- [x] Environment-specific configs (.env.example & .env for backend, frontend admin/driver)

### D. Security (43% Complete - 3/7 items)
- [ ] Rate limiting middleware (Redis-based)
- [x] CORS configuration (via engine framework)
- [x] SQL injection prevention (via parameterized queries in bun/engine)
- [ ] XSS prevention (input sanitization with bluemonday)
- [ ] Input sanitization
- [x] Secure file upload handling (S3 presigned URL, image-only validation)
- [ ] S3 bucket security policies documentation

### E. Performance (50% Complete - 3/6 items)
- [x] Database query optimization (eager loading with Relation() for N+1 prevention)
- [x] Index optimization (50+ indexes in migrations: orders, trips, waypoints, users, etc.)
- [ ] Caching strategy (Redis for frequently accessed data)
- [x] Connection pooling (via engine/bun framework)
- [ ] API response compression (gzip middleware)
- [x] Pagination for all list endpoints (page & limit query params)

---

## Priority Summary

**P0 (Must Have - MVP):** ⚠️ **95% COMPLETE (2 BUG FIXES NEEDED)**
- ✅ Phase 1: Foundation
- ✅ Phase 2: Master Data Management
- ✅ Phase 2.5: Activate/Deactivate Feature
- ⚠️ Phase 3: Order Management (BUG: Order auto-complete logic)
- ✅ Phase 4: Direct Assignment
- ✅ Phase 5: Driver Web
- ⚠️ Phase 6: Exception Management (BUG: Missing returned_note field)
- 🔧 **Phase 13: Bug Fixes - Blueprint Compliance (CRITICAL)**

**P1 (Should Have - Post MVP):** ✅ **100% COMPLETE**
- ✅ Phase 7: Notification Service (Email with SMTP, templates ID/EN, RabbitMQ events)
- ✅ Phase 8: Dashboard & Reports (Dashboard DONE, Reports updated based on blueprint v3.0)
- ✅ Phase 9: Multi-language (i18n)
- ✅ Phase 10: Public Tracking Page

**P2 (Nice to Have):** ✅ **100% COMPLETE**
- ✅ Phase 11: Onboarding Wizard
- ✅ Phase 12: Audit Trail (Waypoint Logs in PostgreSQL)
- ⏳ Additional Tasks (Testing, Documentation, DevOps, Security, Performance) - Partial

---

## Implementation Progress Summary

### Overall Progress: **~95% Complete**

**Completed Features:**
- ✅ Dashboard (DONE)
- ✅ Reports (DONE - 4 new report endpoints based on blueprint v3.0)
- ✅ Multi-language support (ID/EN)
- ✅ Public Tracking Page
- ✅ Onboarding Wizard
- ✅ Waypoint Logs & Images
- ✅ Driver-User Synchronization
- ✅ Activate/Deactivate with Redis Session Management
- ✅ Exception Management & Rescheduling
- ✅ S3 Presigned URL Upload
- ✅ API Documentation (Swagger/OpenAPI)
- ✅ Notification Service (Email with SMTP, templates ID/EN, RabbitMQ events)
- ✅ Developer Documentation (README, structure guide)

**Pending Features:**
- ⚠️ Migration rollback tests
- ⚠️ Database schema documentation (ERD, table structure docs)
- ⚠️ Deployment guide (Production setup, K8s, environment troubleshooting)
- ⚠️ CI/CD Pipeline
- ⚠️ DevOps: Kubernetes manifests, Monitoring & logging, Health check endpoints
- ⚠️ Security: Rate limiting, XSS prevention, Input sanitization, S3 bucket policies
- ⚠️ Performance: Caching strategy, API response compression

---

---

## Bug Summary

| Bug ID | Description | Location | Severity | Blueprint Reference |
|--------|-------------|----------|----------|---------------------|
| #1 | Order auto-complete includes "failed" as final state | `src/usecase/waypoint.go:482` | **P0 - Critical** | Blueprint lines 710-724 |
| #2 | Missing `returned_note` field | `entity/order_waypoint.go` | **P0 - Critical** | Blueprint line 496, 1658 |

**Status:** ✅ **RESOLVED** (Phase 13 completed)

---

**Last Updated:** 2026-02-12
**Version:** 3.0 (Reports module updated based on blueprint v3.0)

**Recent Changes (v3.0):**
- 🔄 **Phase 8 (Dashboard & Reports):** Updated reports module based on blueprint v3.0:
  - Removed duplicate reports: Orders, Trips (sudah ada di menu masing-masing)
  - Added new report: Order Trip Waypoint (detail eksekusi order per waypoint)
  - Added new report: Customer Report
  - Updated reports: Revenue, Driver Performance
  - Changed export mechanism: Using parameter `downloadable=true` instead of separate `/export` endpoint
  - All reports support JSON response (default) and Excel download (`downloadable=true`)
  - Update endpoints:
    - `GET /reports/order-trip-waypoint` (with `downloadable=true`)
    - `GET /reports/revenue` (with `downloadable=true`)
    - `GET /reports/driver-performance` (with `downloadable=true`)
    - `GET /reports/customer` (with `downloadable=true`)
- 📊 Updated Priority Summary: P1 now 75% (Reports need update)
- 📊 Updated Implementation Progress: ~90% (Reports need update)
- ✅ Bug Summary marked as RESOLVED (Phase 13 completed)

**Previous Changes (v2.5):**
- ✅ Verified & Updated Additional Task C (DevOps): 33% complete (2/6 items)
  - Docker compose: DONE (PostgreSQL, Redis, RabbitMQ, MongoDB with healthcheck)
  - Environment configs: DONE (.env.example & .env for all services)
  - Pending: CI/CD pipeline, Kubernetes manifests, Monitoring, Health check endpoints
- ✅ Verified & Updated Additional Task D (Security): 43% complete (3/7 items)
  - CORS: DONE (via engine framework)
  - SQL injection prevention: DONE (via bun/engine parameterized queries)
  - Secure file upload: DONE (S3 presigned URL with image-only validation)
  - Pending: Rate limiting, XSS prevention, Input sanitization, S3 bucket policies
- ✅ Verified & Updated Additional Task E (Performance): 50% complete (3/6 items)
  - DB query optimization: DONE (eager loading with Relation() for N+1 prevention)
  - Index optimization: DONE (50+ indexes across all tables)
  - Connection pooling: DONE (via engine/bun framework)
  - Pagination: DONE (page & limit query params on all list endpoints)
  - Pending: Caching strategy (Redis), API response compression (gzip)
- 📊 Updated Priority Summary with detailed Additional Tasks breakdown

**Previous Changes (v2.4):**
- ✅ Marked Documentation (Additional Task B) as PARTIAL (50%) - API docs & Developer guide done
- ⚠️ Added missing items: Database schema documentation, Deployment guide
- 📝 API Documentation: Swagger/OpenAPI complete (swagger.json 215KB, swagger.yaml 103KB)
- 📝 Developer Documentation: README.md + PROJECT_STRUCTURE_GUIDE.md complete
- 📝 Makefile available: build, docker, helm install/upgrade, migrations

**Previous Changes (v2.3):**
- ✅ Marked Testing (Additional Task A) as COMPLETE - 280 test functions across 53 test files
- 📈 Updated overall progress: ~92% → ~95% (testing complete)
- 🧪 Tests verified: Unit tests, Integration tests, Repository tests all passing

**Previous Changes (v2.2):**
- ✅ Marked Phase 7 (Notification Service) as COMPLETE - SMTP email with templates ID/EN implemented
- ✅ Marked Phase 12.2 (MongoDB order_logs) as REMOVED - audit trail sufficiently covered by waypoint_logs
- 📈 Updated P1 progress: 75% → 100% complete
- 📈 Updated P2 progress: 75% → 100% complete
- 📈 Updated overall progress: ~88% → ~92% (MongoDB scope removed)


---

## Phase 14: Shipment Concept Refactoring (Backend) ✅ DONE

**Status:** Backend implementation completed (2026-03-02)

**Referensi:** `docs/feedbackV1/` folder berisi dokumentasi lengkap Shipment Concept

### 14.1 Shipment Concept Overview
Shipment Concept mengubah granularity dari OrderWaypoint ke Shipment:
- **Shipment**: 1 origin → 1 destination (single route unit)
- **FTL (Full Truckload)**: 1 order = multiple shipments, price di Order.TotalPrice
- **LTL (Less Than Truckload)**: 1 order = multiple shipments, price per shipment dari matrix
- **Partial Execution**: Pickup gagal → semua shipments cancelled; Delivery gagal → shipments bisa di-retry
- **TripWaypoint**: Source of truth untuk status, berisi array ShipmentIDs

### 14.2 Entity & Migration
**Entity:**
- [x] Create `entity/shipment.go` - Shipment & ShipmentItem entities
- [x] Update `entity/trip_waypoint.go` - Replace OrderWaypointID with ShipmentIDs []uuid.UUID
- [x] Add location snapshot fields to TripWaypoint (type, address_id, location_name, address, contact_name, contact_phone)

**Migration:**
- [x] Create `migrations/20250113100006_shipments.up.sql`
  - [x] Create `shipments` table
  - [x] Update `trip_waypoints` table - add shipment_ids array and snapshot fields
  - [x] Update `waypoint_logs` table - add shipment_ids array, order_id NOT NULL
  - [x] Update `waypoint_images` table - add order_id and shipment_ids
  - [x] Keep `order_waypoints` table for backward compatibility

### 14.3 Repository & Usecase
**Repository:**
- [x] Create `src/repository/shipment.go` - ShipmentRepository
  - [x] Basic CRUD operations
  - [x] FindByOrderID, FindByCompanyID, FindFailedShipments
  - [x] UpdateStatus, UpdateStatusWithFailedInfo, UpdateRetryCount

**Usecase:**
- [x] Create `src/usecase/shipment.go` - ShipmentUsecase
  - [x] CreateShipmentNumber - Format: SHP-YYYYMMDD-XXXX
  - [x] Create, CreateBatch - Create single or multiple shipments
  - [x] UpdateStatusFromTripWaypoint - Sync status from TripWaypoint
  - [x] MarkDispatched - Mark shipments as dispatched
  - [x] CancelShipmentsByOrderID - Cancel all shipments for an order
  - [x] GetByTripID - Get shipments for a trip

- [x] Update `src/usecase/trip.go` - TripUsecase
  - [x] PreviewTripWaypoints - Preview trip waypoints before creation
  - [x] ConvertShipmentsToTripWaypoints - Convert shipments to trip waypoints
  - [x] CreateWithShipments - Create trip with shipments
  - [x] CreateForRescheduleWithWaypoints - Create new trip for rescheduled waypoints

- [x] Update `src/usecase/exception.go` - ExceptionUsecase
  - [x] BatchRescheduleWaypoints - Reschedule waypoints with shipment conversion
  - [x] ReturnWaypoint - Mark waypoint as returned to origin

- [x] Update `src/usecase/waypoint.go` - WaypointUsecase
  - [x] FailTripWaypointWithShipments - Handle partial execution (pickup/delivery failure)
  - [x] SyncShipmentStatusFromTripWaypoint - Sync shipment status from trip waypoint
  - [x] Add ShipmentUsecase dependency

- [x] Update `src/usecase/order.go` - OrderUsecase
  - [x] Add ShipmentRepo dependency
  - [x] CreateWithShipments - Create order with shipments (and OrderWaypoints for backward compatibility)

- [x] Update `src/usecase/factory.go` - Register ShipmentUsecase

### 14.4 Handler & API
**Order Handlers:**
- [x] Update `src/handler/rest/order/request_create.go`
  - [x] Add toShipmentEntities() - Convert waypoints to shipments
  - [x] FTL: Create shipments from pickup+delivery pairs
  - [x] LTL: Group shipments by common origins/destinations
  - [x] Call CreateWithShipments instead of CreateWithWaypoints

**Trip Handlers:**
- [x] Update `src/handler/rest/trip/request_create.go`
  - [x] Validate shipments exist for order
  - [x] Call CreateWithShipments with orderID and orderType
  - [x] Remove unused imports (fmt, uuid)

- [x] Update `src/handler/rest/trip/request_update.go`
  - [x] Update to use ConvertShipmentsToTripWaypoints
  - [x] Remove unused imports and variables

**Exception Handlers:**
- [x] Update `src/handler/rest/exception/request_batch_reschedule.go`
  - [x] Use ExceptionUsecase.BatchRescheduleWaypoints
  - [x] Remove manual TripWaypoint creation

**Driver Web Handlers:**
- [x] Update `src/handler/rest/driver_web/request_waypoint_failed.go`
  - [x] Add FailedShipmentIDs parameter for partial delivery failures
  - [x] Implement partial execution logic:
    - Pickup fails → ALL shipments in waypoint are cancelled
    - Delivery fails → Can specify which shipments failed (partial) or all
  - [x] Call FailTripWaypointWithShipments with proper shipment IDs

### 14.5 Implementation Summary
**Files Created:**
- `entity/shipment.go` (130 lines)
- `src/repository/shipment.go` (210 lines)
- `src/usecase/shipment.go` (350+ lines)
- `migrations/20250113100006_shipments.up.sql` & `.down.sql`

**Files Modified:**
- `entity/trip_waypoint.go` - ShipmentIDs array, location snapshot fields
- `entity/waypoint_log.go` - ShipmentIDs array, OrderID NOT NULL
- `entity/waypoint_image.go` - OrderID, ShipmentIDs array
- `entity/order.go` - Shipments relation
- `src/repository/trip_waypoint.go` - Handle ShipmentIDs operations
- `src/usecase/trip.go` - Preview and shipment conversion methods
- `src/usecase/exception.go` - Shipment-based reschedule
- `src/usecase/waypoint.go` - Shipment status sync, partial execution
- `src/usecase/order.go` - CreateWithShipments method
- `src/usecase/factory.go` - Register ShipmentUsecase
- `src/handler/rest/order/request_create.go` - Shipment creation
- `src/handler/rest/trip/request_create.go` - Shipment-based trip creation
- `src/handler/rest/trip/request_update.go` - Shipment-based sequence update
- `src/handler/rest/exception/request_batch_reschedule.go` - Shipment-based reschedule
- `src/handler/rest/driver_web/request_waypoint_failed.go` - Partial execution

**Build Status:** ✅ Entire backend compiles successfully

### 14.6 Frontend Implementation (PENDING)
Frontend implementation masih pending - lihat `docs/feedbackV1/07_implementation_checklist.md`

Phase 6-15 (Frontend):
- Phase 6: API Service & Hooks
- Phase 7: Components (Admin/Dispatcher) - Order forms & timelines
- Phase 8: Components (Create Trip) - Preview & sequence
- Phase 9: Components (Exception) - Reschedule modal
- Phase 10: Components (Driver App) - Partial execution UI
- Phase 11: Components (Tracking Page) - Shipment tracking
- Phase 12: Components (Admin Dashboard) - Shipment maps
- Phase 13: Components (Admin Reports) - Shipment metrics
- Phase 14: Types & Helpers - Status options, badges
- Phase 15: Testing - Unit & integration tests

---

**Last Updated:** 2026-03-02
**Version:** 3.1 (Shipment Concept Backend Complete)

