# Contributing to TMS Onward

Terima kasih atas ketertarikan Anda untuk berkontribusi pada TMS Onward! Dokumen ini memandu Anda melalui proses kontribusi.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

Dengan berpartisipasi dalam project ini, Anda setuju untuk mematuhi kode etik kami:

- Hormati semua kontributor
- Gunakan bahasa yang inklusif dan profesional
- Fokus pada konstruktif feedback
- Collaborate secara terbuka

## Getting Started

### Fork and Clone

```bash
# Fork repository di GitHub
git clone https://github.com/YOUR_USERNAME/onward-tms.git
cd onward-tms/backend
```

### Setup Development Environment

Ikuti instruksi di [README.md](README.md#installation) untuk setup environment.

## Development Workflow

### 1. Create Branch

Buat branch dari `main` dengan naming convention:

```bash
# Feature branch
git checkout -b feature/tambah-fitur-baru

# Bugfix branch
git checkout -b bugfix/perbaiki-error-login

# Refactor branch
git checkout -b refactor/optimize-query
```

### 2. Make Changes

Ikuti [Coding Standards](#coding-standards) yang ditetapkan.

### 3. Write Tests

Pastikan semua tests pass sebelum submit:

```bash
make test
```

### 4. Update Documentation

- Tambahkan Swagger annotations untuk API baru
- Update README jika perlu
- Tambahkan komentar untuk kode kompleks

### 5. Commit Changes

Gunakan commit message format:

```
type(scope): description

# Contoh:
feat(order): add order cancellation feature
fix(auth): resolve JWT refresh token issue
docs(trip): update API documentation
refactor(driver): optimize driver query
test(customer): add integration tests
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### 6. Push and Create PR

```bash
git push origin feature/tambah-fitur-baru
```

Buat Pull Request di GitHub dengan template yang disediakan.

## Coding Standards

### Go Conventions

Ikuti [Effective Go](https://golang.org/doc/effective_go) dan standard Go conventions.

### Naming Conventions

| Type | Convention | Contoh |
|------|-----------|--------|
| Packages | lowercase | `item`, `warehouse` |
| Files | lowercase_with_underscores | `request_create.go` |
| Structs | PascalCase | `ItemUsecase`, `createRequest` |
| Methods | PascalCase (exported), camelCase (private) | `GetByID()`, `withContext()` |
| Variables | camelCase | `itemID`, `isActive` |
| Database tables | lowercase | `item`, `order_waypoint` |

### Code Organization

```
src/handler/rest/{domain}/
├── handler.go          # Route registration & handler functions
├── request_create.go   # Create request struct
├── request_update.go   # Update request struct
├── request_delete.go   # Delete request struct
├── request_get.go      # List & detail requests
└── handler_test.go     # Integration tests
```

### Request Pattern

Setiap endpoint menggunakan request struct terpisah:

```go
type createRequest struct {
    // Fields dari JSON body
    Code  string `json:"code" valid:"required"`
    Name  string `json:"name" valid:"required"`

    // Internal state
    client  *entity.Client
    ctx     context.Context
    uc      *usecase.Factory
    session *entity.SessionClaims
}

func (r *createRequest) with(ctx, uc) *createRequest
func (r *createRequest) Validate() *validate.Response
func (r *createRequest) execute() (*rest.ResponseBody, error)
```

### Validation Pattern

**PENTING**: Jangan return premature di method `Validate()`. Biarkan semua validasi berjalan sampai selesai.

```go
func (r *createRequest) Validate() *validate.Response {
    v := validate.NewResponse()

    // Collect semua error
    if r.Code == "" {
        v.SetError("code.required", "Code is required")
    }

    if r.Name == "" {
        v.SetError("name.required", "Name is required")
    }

    return v  // Return di akhir saja
}
```

### Usecase Parameter Pattern

Jika entity sudah di-fetch di `Validate()`, pass entity ke usecase, bukan ID.

```go
// BENAR
func (r *completeRequest) Validate() *validate.Response {
    trip, err := r.uc.Trip.GetByID(r.ID)
    r.trip = trip
}

func (r *completeRequest) execute() (*rest.ResponseBody, error) {
    err := r.uc.Trip.Complete(r.trip)  // Pass entity
}

// SALAH
func (r *completeRequest) execute() (*rest.ResponseBody, error) {
    err := r.uc.Trip.Complete(r.ID)  // Pass ID - redundant query!
}
```

### Separation of Concerns

Usecase hanya mengelola entity domain-nya sendiri. Untuk cross-domain operations, panggil usecase domain tersebut.

```go
// ExceptionUsecase memanggil TripUsecase
func (u *ExceptionUsecase) RescheduleWaypoint(...) error {
    // Panggil TripUsecase untuk membuat trip
    trip, err := u.TripUsecase.CreateForReschedule(...)
}

// TripUsecase memanggil DispatchUsecase
func (u *TripUsecase) CreateForReschedule(...) (*entity.Trip, error) {
    // Panggil DispatchUsecase untuk membuat dispatch
    u.DispatchUsecase.CreateForTrip(ctx, trip.ID, orderID)
}
```

## Testing Guidelines

### Test Structure

```go
func TestOrderCreate(t *testing.T) {
    // Setup
    req := createRequest{
        CustomerID: testCustomer.ID,
        // ...
    }

    // Execute
    res, err := req.execute()

    // Assert
    assert.NoError(t, err)
    assert.NotNil(t, res)
}
```

### Test Isolation

Setiap test harus cleanup datanya sendiri:

```go
func TestOrderCreate(t *testing.T) {
    // Setup test data
    order := createTestOrder(t)

    // Cleanup setelah test selesai
    t.Cleanup(func() {
        cleanupTestData(t, order)
    })

    // Test logic...
}
```

### Running Tests

```bash
# All tests
make test

# Specific package
go test ./src/usecase/order/...

# With coverage
go test -cover ./...

# Verbose output
go test -v ./src/handler/rest/order/...
```

## Documentation

### API Documentation

Tambahkan Swagger annotations untuk setiap endpoint:

```go
// Create handles POST /orders
// @Summary Create new order
// @Description Create a new order with waypoints
// @Tags order
// @Accept json
// @Produce json
// @Param request body order.createRequest true "Create order request"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /orders [post]
func (h *handler) create(ctx *rest.Context) error {
    // ...
}
```

Regenerate docs setelah perubahan:

```bash
swag init --parseDependency --parseInternal -g main.go -o docs/swagger
```

### Code Comments

- Gunakan bahasa Indonesia untuk user-facing comments
- Gunakan English untuk technical comments
- Tambahkan komentar untuk logika bisnis yang kompleks
- Document exported functions dan types

## Pull Request Process

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] All tests passing

## Documentation
- [ ] API documentation updated
- [ ] README updated (if needed)
- [ ] Comments added for complex logic

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] No new warnings generated
```

### Review Process

1. Automated checks must pass (tests, lint)
2. Minimum 1 approval from maintainer
3. Resolve all review comments
4. Squash commits jika diminta
5. Maintainer akan merge setelah approve

### What We Look For

- Clean, readable code
- Proper error handling
- Test coverage
- Documentation
- Follow project conventions
- No breaking changes tanpa diskusi

## Getting Help

- **GitHub Issues**: Untuk bug dan feature requests
- **Discussions**: Untuk pertanyaan dan diskusi teknis
- **Email**: support@example.com

## License

Dengan berkontribusi, Anda setuju bahwa kontribusi Anda akan dilisensikan di bawah [MIT License](LICENSE).

---

Terima kasih untuk kontribusi Anda! 🙏
