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

- **Backend**: Go 1.24.4 dengan `logistics-id/engine` framework v0.0.19-dev (Clean Architecture)
- **Database**:
  - PostgreSQL (main data) dengan `uptrace/bun` ORM
  - MongoDB 5+ (audit logs)
  - Redis 6+ (cache & sessions)
- **Message Broker**: RabbitMQ dengan `amqp091-go`
- **File Storage**: AWS S3 (`aws-sdk-go-v2`)
- **API Documentation**: Swagger/OpenAPI 2.0 (`swaggo/swag`)
- **Authentication**: JWT (`golang-jwt/jwt/v5`) with refresh token rotation
- **Excel Export**: `excelize/v2` untuk laporan

## Prerequisites

- Go 1.24.4 atau lebih tinggi
- PostgreSQL 14+
- MongoDB 5+
- Redis 6+
- RabbitMQ 3.9+
- Docker & Docker Compose (optional, untuk development)
- AWS Account dengan S3 bucket (untuk file upload)

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/logistics-id/onward-tms.git
cd onward-tms/backend  # Backend API ada di folder backend/
```

### 2. Setup Environment Variables

```bash
cp .env.example .env
```

Edit `.env` file dan sesuaikan konfigurasi:

```env
# Service Configuration
SERVICE_NAME=onward-tms
SERVICE_VERSION=1.0.0
REST_SERVER=0.0.0.0:8080
GRPC_SERVER=0.0.0.0:4040
GRPC_ADDRESS=svc-tms:4040
PLATFORM=default
IS_DEV=true

# PostgreSQL Database
POSTGRES_SERVER=localhost:5432
POSTGRES_AUTH_USERNAME=postgres
POSTGRES_AUTH_PASSWORD=password
POSTGRES_DATABASE=tms_db

# MongoDB (Audit Log)
MONGODB_SERVER=localhost:27017
MONGODB_AUTH_USERNAME=admin
MONGODB_AUTH_PASSWORD=admin_password
MONGODB_DATABASE=tms_audit

# Redis (Cache & Session)
REDIS_SERVER=localhost:6379
REDIS_AUTH_PASSWORD=

# RabbitMQ (Message Broker)
RABBIT_SERVER=localhost:5672
RABBIT_AUTH_USERNAME=guest
RABBIT_AUTH_PASSWORD=guest

# JWT Authentication
JWT_SECRET=your-jwt-secret-key-change-in-production
JWT_ISSUER=onward-tms

# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@tms-onward.com

# AWS S3 Configuration (for File Upload)
S3_BUCKET_NAME=onward.dev
AWS_REGION=ap-southeast-3
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

### 3. Install Dependencies

```bash
go mod download
```

### 4. Run Database Migrations

```bash
make migrate up
```

**Catatan**: Pastikan `DATABASE_URL` sudah di-set di `.env` file. Migration tool akan membaca connection string dari environment variable tersebut.

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
tms-onward/
├── backend/                   # Backend API (Go)
│   ├── main.go               # Entry point aplikasi
│   ├── go.mod/go.sum         # Dependency management
│   ├── Dockerfile            # Container configuration
│   ├── Makefile              # Build automation
│   ├── .env/.env.example     # Environment variables
│   │
│   ├── entity/               # Layer 4: Domain models
│   │   ├── order.go
│   │   ├── trip.go
│   │   ├── dispatch.go
│   │   └── ...
│   │
│   ├── src/                  # Source code
│   │   ├── handler/         # Layer 1: HTTP/gRPC handlers
│   │   │   └── rest/       # REST handlers per domain
│   │   ├── usecase/        # Layer 2: Business logic
│   │   ├── repository/     # Layer 3: Data access
│   │   ├── event/          # Event handling
│   │   ├── handler.go      # Route registration
│   │   ├── permission.go   # Permission registration
│   │   └── subscriber.go   # RabbitMQ subscriptions
│   │
│   ├── migrations/          # Database migrations
│   ├── proto/              # gRPC protocol definitions
│   └── charts/             # Helm charts for K8s deployment
│
├── frontend/                # Frontend (React/Vue)
├── engine/                  # Engine framework (local development)
├── docs/                    # Project documentation
│   ├── requirements.md      # Business requirements
│   ├── blueprint.md         # Technical specifications
│   ├── tasklist.md          # Implementation status
│   └── PROJECT_STRUCTURE_GUIDE.md
│
├── example/                 # Example implementations
├── CLAUDE.md                # Context untuk Claude AI
└── README.md                # This file
```

### Available Make Commands

```bash
# Build & Run
make build           # Compile Go binary (onward-tms)
make docker          # Build and push Docker image with Git SHA tag

# Development
make dev             # Run app locally with mirrord on specified pod

# gRPC
make proto           # Generate Go code from proto files

# Database Migrations
make migrate up      # Run database migrations up
make migrate down    # Run database migrations down
make migrate create name=create_table  # Create new migration

# Deployment (Helm/K8s)
make install         # Install Helm chart with new image tag (Git SHA)
make upgrade         # Restart deployment to pull latest image
```

### Running Application

```bash
# Development mode - run directly
go run main.go

# Build and run binary
make build
./onward-tms

# With mirrord (for K8s development)
make dev
```

### Running Tests

```bash
# Run all tests
go test ./...

# Run specific package tests
go test ./src/usecase/trip/...

# Run with coverage
go test -cover ./...
```

### Docker Development

```bash
# Build Docker image
docker build -t onward-tms:latest .

# Run container
docker run -p 8080:8080 --env-file .env onward-tms:latest

# Build and push with Git SHA (via Makefile)
make docker
```

## Deployment

### Production Build

```bash
# Build optimized binary
make build

# Atau dengan build flags tambahan
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o onward-tms main.go
```

### Environment Checklist

Sebelum deploy ke production, pastikan:

- [ ] Set `IS_DEV=false` di environment
- [ ] Gunakan strong JWT secret di `JWT_SECRET`
- [ ] Setup database backup untuk PostgreSQL & MongoDB
- [ ] Configure HTTPS/TLS
- [ ] Set proper CORS origins
- [ ] Configure rate limiting
- [ ] Setup monitoring & logging
- [ ] Review security headers
- [ ] Configure AWS S3 bucket yang aman
- [ ] Setup SMTP yang benar untuk email notification

### Using Docker

```bash
# Build production image
docker build -t onward-tms:prod .

# Run with production config
docker run -d \
  --name onward-tms \
  -p 8080:8080 \
  --env-file .env.production \
  onward-tms:prod
```

### Using Kubernetes & Helm

```bash
# Set environment
ENV=prod make install

# Atau manual
helm upgrade --install svc-tms ./charts/svc-tms \
  -n production --create-namespace \
  --set image.repository=enivent/svc-tms \
  --set image.tag=<GIT_COMMIT> \
  --set global.domain=api.onward.co.id \
  --set global.tlsSecret=tls-shared \
  --atomic --wait
```

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL connection
psql -h localhost -U postgres -d tms_db

# Check MongoDB connection
mongosh "mongodb://localhost:27017/tms_audit"
```

### Redis Connection Issues

```bash
redis-cli -h localhost ping
```

### RabbitMQ Connection Issues

```bash
# Check RabbitMQ status
rabbitmqctl status

# List queues
rabbitmqctl list_queues

# Check connections
rabbitmqctl list_connections
```

### Migration Issues

```bash
# Check migration status
make migrate up

# Rollback last migration
make migrate down

# Create new migration
make migrate create name=add_new_column
```

## License

MIT License - see LICENSE file for details

## Support & Documentation

Untuk dokumentasi lengkap dan bantuan pengembangan:

- **Project Documentation**: Lihat folder `docs/` untuk:
  - `requirements.md` - Business & functional requirements
  - `blueprint.md` - Technical specifications & architecture
  - `tasklist.md` - Status implementasi fitur
  - `PROJECT_STRUCTURE_GUIDE.md` - Panduan struktur project

- **API Documentation**: `/docs/swagger/swagger.json` (Swagger/OpenAPI 2.0)

- **Framework Reference**: `logistics-id/engine` documentation

### Developer Resources

- **Issues**: [GitHub Issues](https://github.com/logistics-id/onward-tms/issues)
- **Architecture**: Clean Architecture dengan engine framework
- **Context**: Lihat `CLAUDE.md` untuk konteks proyek lengkap

### Quick Links

- [Backend Dashboard](http://localhost:8080) - REST API Base URL
- [Swagger JSON](http://localhost:8080/docs/swagger/swagger.json)
- [Health Check](http://localhost:8080/health)
