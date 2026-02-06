# TMS Onward - Transportation Management System

TMS Onward adalah Transportation Management System (TMS) SaaS yang dirancang untuk perusahaan logistik kecil di Indonesia (3PL & Carriers).

## Fitur Utama

- **Order Management**: Kelola order dengan sistem waypoint yang fleksibel (FTL & LTL)
- **Trip & Dispatch Management**: Manajemen trip dan dispatch dengan routing
- **Driver & Vehicle Management**: Manajemen data driver dan kendaraan
- **Customer Management**: Kelola data pelanggan dengan pricing matrix
- **Proof of Delivery (POD)**: Upload dan kelola POD untuk setiap waypoint
- **Exception Handling**: Handle delivery exception dengan rescheduling
- **Public Tracking**: Tracking page publik untuk customer
- **Onboarding Wizard**: Setup wizard untuk perusahaan baru
- **Dashboard & Reports**: Dashboard analitik dan laporan operasional
- **Multi-language**: Dukungan Bahasa Indonesia dan English

## Tech Stack

- **Backend**: Go 1.24+ dengan `logistics-id/engine` framework (Clean Architecture)
- **Database**: PostgreSQL (data), MongoDB (audit logs), Redis (cache/sessions)
- **Message Broker**: RabbitMQ
- **API Documentation**: Swagger/OpenAPI 2.0
- **Authentication**: JWT with refresh token rotation

## Prerequisites

- Go 1.24 atau lebih tinggi
- PostgreSQL 14+
- MongoDB 5+
- Redis 6+
- RabbitMQ 3.9+
- Docker & Docker Compose (optional, untuk development)

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/logistics-id/onward-tms.git
cd onward-tms/backend
```

### 2. Setup Environment Variables

```bash
cp .env.example .env
```

Edit `.env` file dan sesuaikan konfigurasi:

```env
# Server
REST_SERVER=:8080
GRPC_SERVER=:9090
GRPC_ADDRESS=localhost:9090

# Database
POSTGRES_DATABASE=postgresql://user:password@localhost:5432/onward_tms?sslmode=disable
MONGODB_DATABASE=mongodb://localhost:27017/onward_tms

# Redis
REDIS_ADDR=localhost:6379
REDIS_PASSWORD=

# RabbitMQ
RABBITMQ_URI=amqp://guest:guest@localhost:5672/

# JWT
JWT_SECRET=your-secret-key
JWT_ACCESS_TOKEN_EXPIRATION=15m
JWT_REFRESH_TOKEN_EXPIRATION=720h
```

### 3. Install Dependencies

```bash
go mod download
```

### 4. Run Database Migrations

```bash
make migrate up
```

### 5. Run Application

```bash
# Development mode
make run

# Atau langsung dengan go
go run main.go
```

Server akan berjalan di `http://localhost:8080`

## API Documentation

API documentation tersedia dalam format Swagger/OpenAPI:

- **Swagger JSON**: `/docs/swagger/swagger.json`
- **Swagger YAML**: `/docs/swagger/swagger.yaml`
- **Docs Info**: `/docs/swagger/info`

Untuk melihat interactive documentation:
1. Download swagger.json dari `/docs/swagger/swagger.json`
2. Upload ke [Swagger Editor](https://editor.swagger.io/) atau [Swagger UI](https://petstore.swagger.io/)

### Regenerate API Documentation

Setelah menambahkan atau mengubah handler dengan annotations:

```bash
swag init --parseDependency --parseInternal -g main.go -o docs/swagger
```

## Development

### Project Structure

```
backend/
├── main.go                    # Entry point aplikasi
├── go.mod/go.sum              # Dependency management
├── Dockerfile                 # Container configuration
├── Makefile                   # Build automation
│
├── entity/                    # Domain models
│   ├── order.go
│   ├── trip.go
│   └── ...
│
├── src/                       # Source code
│   ├── handler/              # HTTP/gRPC handlers
│   │   └── rest/            # REST handlers per domain
│   ├── usecase/             # Business logic
│   ├── repository/          # Data access
│   ├── event/               # Event handling
│   ├── handler.go           # Route registration
│   ├── permission.go        # Permission registration
│   └── subscriber.go        # RabbitMQ subscriptions
│
├── migrations/              # Database migrations
└── docs/swagger/            # API documentation
```

### Available Make Commands

```bash
make run          # Run application
make build        # Build binary
make test         # Run tests
make test-cover   # Run tests with coverage
make lint         # Run linter
make fmt          # Format code
make migrate      # Run migrations
```

### Running Tests

```bash
# Run all tests
make test

# Run specific package tests
go test ./src/usecase/trip/...

# Run with coverage
go test -cover ./...
```

### Docker Development

```bash
# Build image
docker build -t tms-onward:latest .

# Run container
docker run -p 8080:8080 --env-file .env tms-onward:latest

# Use docker-compose
docker-compose up -d
```

## Deployment

### Production Build

```bash
# Build optimized binary
go build -ldflags="-s -w" -o onward-tms main.go
```

### Environment Checklist

Sebelum deploy ke production, pastikan:

- [ ] Set `IsDev=false` di environment
- [ ] Gunakan strong JWT secret
- [ ] Setup database backup
- [ ] Configure HTTPS/TLS
- [ ] Set proper CORS origins
- [ ] Configure rate limiting
- [ ] Setup monitoring & logging
- [ ] Review security headers

### Using Docker

```bash
# Build production image
docker build -f Dockerfile -t tms-onward:prod .

# Run with production config
docker run -d \
  --name tms-onward \
  -p 8080:8080 \
  --env-file .env.production \
  tms-onward:prod
```

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL connection
psql -h localhost -U onward_tms -d onward_tms

# Check MongoDB connection
mongosh "mongodb://localhost:27017/onward_tms"
```

### Redis Connection Issues

```bash
redis-cli ping
```

### RabbitMQ Connection Issues

```bash
# Check RabbitMQ status
rabbitmqctl status

# List queues
rabbitmqctl list_queues
```

## License

MIT License - see LICENSE file for details

## Support

Untuk bantuan atau pertanyaan:
- Email: support@example.com
- Documentation: [Wiki](https://github.com/logistics-id/onward-tms/wiki)
- Issues: [GitHub Issues](https://github.com/logistics-id/onward-tms/issues)
