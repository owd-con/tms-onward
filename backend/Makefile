# Makefile

# Variables
SERVICE_NAME := svc-tms
IMAGE_REPO := enivent/svc-tms
GIT_COMMIT := $(shell git rev-parse HEAD)
CHART_PATH := ./charts/svc-tms

ENV ?= dev
NAMESPACE ?= default

# Per-env defaults; override from CLI if you wish
ifeq ($(ENV),prod)
  DOMAIN ?= api.onward.co.id
  TLS_SECRET ?= tls-shared
else
  DOMAIN ?= api-dev.onward.co.id
  TLS_SECRET ?= api-dev-onward-co-id-tls
endif

# Default target
.PHONY: help
help:
	@echo "Makefile capabilities:"
	@echo "  make build        - Compile the Go binary"
	@echo "  make docker       - Build and push Docker image with Git SHA tag"
	@echo "  make proto        - Run protoc to generate Go code from proto files"
	@echo "  make install      - Install Helm chart to K8s with new image tag (Git SHA)"
	@echo "  make upgrade      - Restart the deployment to pull latest image"
	@echo "  make dev 	       - Run app locally with mirrord on specified pod"
	@echo "  make migrate up   - Run database migrations up"
	@echo "  make migrate down - Run database migrations down"

# Compile Go binary
.PHONY: build
build:
	@echo "> Building Go binary..."
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o onward-tms main.go

# Build and push Docker image with Git SHA tag
.PHONY: docker
docker:
	@echo "> Building and pushing Docker image with tag: $(GIT_COMMIT)"
	docker buildx build \
	  --push \
	  --platform linux/amd64 \
	  --provenance=false \
	  --sbom=false \
	  --build-arg COMMIT=$(GIT_COMMIT) \
	  -t $(IMAGE_REPO):$(GIT_COMMIT) .

# Generate Go code from proto
.PHONY: proto
proto:
	@echo "> Generating Go code from proto files..."
	protoc --proto_path=proto --go_out=paths=source_relative:proto --go-grpc_out=paths=source_relative:proto proto/*.proto

# Install new Helm release with image tag
.PHONY: install
install:
	@echo "> Installing Helm chart with image tag: $(GIT_COMMIT) (env=$(ENV))"
	helm upgrade --install $(SERVICE_NAME) $(CHART_PATH) \
	  -n $(NAMESPACE) --create-namespace \
	  --set image.repository=$(IMAGE_REPO) \
	  --set image.tag=$(GIT_COMMIT) \
	  --set global.domain=$(DOMAIN) \
	  --set global.tlsSecret=$(TLS_SECRET) \
	  --atomic --wait

# Run using mirrord with specified pod
.PHONY: dev
dev:
	mirrord exec --target deployment/$(SERVICE_NAME) --agent-namespace default -- dev run $(SERVICE_NAME)

.PHONY: migrate migrate-up migrate-down migrate-create

migrate:
	@$(MAKE) migrate-$(word 2, $(MAKECMDGOALS)) $(MAKECMDGOALS)

# Dummy rule to ignore unknown targets passed as args
%:
	@:

migrate-up:
	@export $$(grep -v '^#' .env | xargs); \
	if [ -z "$$DATABASE_URL" ]; then \
		echo "DATABASE_URL is not set in .env"; \
		exit 1; \
	fi; \
	migrate -path ./migrations -database "$$DATABASE_URL" up


migrate-down:
	@export $$(grep -v '^#' .env | xargs); \
	if [ -z "$$DATABASE_URL" ]; then \
		echo "DATABASE_URL is not set in .env"; \
		exit 1; \
	fi; \
	migrate -path ./migrations -database "$$DATABASE_URL" down


migrate-create:
	@if [ -z "$$name" ]; then \
		echo "❌ Please provide a migration name: make migrate create name=create_users_table"; \
		exit 1; \
	fi; \
	export $$(grep -v '^#' .env | xargs); \
	if [ -z "$$DATABASE_URL" ]; then \
		echo "DATABASE_URL is not set in .env"; \
		exit 1; \
	fi; \
	migrate create -ext sql -dir ./migrations "$$name"
