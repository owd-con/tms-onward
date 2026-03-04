package usecase

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/repository"
	"go.uber.org/zap"

	"github.com/logistics-id/engine"
	"github.com/logistics-id/engine/common"
	"github.com/uptrace/bun"
)

type OrderUsecase struct {
	*common.BaseUsecase[entity.Order]
	Repo              *repository.OrderRepository
	CustomerRepo      *repository.CustomerRepository
	PricingMatrixRepo *repository.PricingMatrixRepository
	WaypointLogRepo   *repository.WaypointLogRepository
	ShipmentRepo      *repository.ShipmentRepository
}

type OrderQueryOptions struct {
	common.QueryOption

	CustomerID string `query:"customer_id"`
	Status     string `query:"status"`
	OrderType  string `query:"order_type"`

	Session *entity.TMSSessionClaims
}

func (o *OrderQueryOptions) BuildQueryOption() *OrderQueryOptions {
	return o
}

func (u *OrderUsecase) WithContext(ctx context.Context) *OrderUsecase {
	return &OrderUsecase{
		BaseUsecase:       u.BaseUsecase.WithContext(ctx),
		Repo:              u.Repo.WithContext(ctx).(*repository.OrderRepository),
		CustomerRepo:      u.CustomerRepo.WithContext(ctx).(*repository.CustomerRepository),
		PricingMatrixRepo: u.PricingMatrixRepo.WithContext(ctx).(*repository.PricingMatrixRepository),
		WaypointLogRepo:   u.WaypointLogRepo.WithContext(ctx).(*repository.WaypointLogRepository),
		ShipmentRepo:      u.ShipmentRepo.WithContext(ctx).(*repository.ShipmentRepository),
	}
}

// Get - List orders with multi-tenant isolation
func (u *OrderUsecase) Get(req *OrderQueryOptions) ([]*entity.Order, int64, error) {
	if req.Session == nil {
		return nil, 0, errors.New("This session not found.")
	}

	if req.Session.CompanyID == "" {
		return nil, 0, errors.New("This user is not a tenant.")
	}

	if req.OrderBy == "" {
		req.OrderBy = "-orders:created_at"
	}

	return u.Repo.FindAll(req.BuildOption(), func(q *bun.SelectQuery) *bun.SelectQuery {
		if req.Session != nil {
			q.Where("orders.company_id = ?", req.Session.CompanyID)
		}

		if req.CustomerID != "" {
			q.Where("orders.customer_id = ?", req.CustomerID)
		}

		if req.Status != "" {
			q.Where("orders.status = ?", req.Status)
		}

		if req.OrderType != "" {
			q.Where("orders.order_type = ?", req.OrderType)
		}

		return q
	})
}

// ValidateUnique - Check if order_number is unique within company
func (u *OrderUsecase) ValidateUnique(orderNumber string, companyID, excludeID string) bool {
	query := u.Repo.DB.NewSelect().
		Model((*entity.Order)(nil)).
		Where("order_number = ?", orderNumber).
		Where("is_deleted = false")

	if companyID != "" {
		query = query.Where("company_id = ?", companyID)
	}

	if excludeID != "" {
		query = query.Where("id != ?", excludeID)
	}

	exists, err := query.Exists(u.Context)
	if err != nil {
		engine.Logger.Error("error checking unique order_number", zap.Error(err))
		return false
	}

	return !exists // Return true if order_number is unique (doesn't exist)
}

// CreateWithShipments - Create order with shipments in transaction
func (u *OrderUsecase) CreateWithShipments(order *entity.Order, shipments []*entity.Shipment) error {
	return u.Repo.RunInTx(u.Context, func(ctx context.Context, tx bun.Tx) error {
		// 1. Create Order first to get OrderID
		orderRepo := u.Repo.WithTx(ctx, tx)
		if err := orderRepo.Insert(order); err != nil {
			return fmt.Errorf("failed to create order: %w", err)
		}

		// 2. Create Shipments
		shipmentRepo := u.ShipmentRepo.WithTx(ctx, tx)
		for _, shipment := range shipments {
			shipment.OrderID = order.ID
			if err := shipmentRepo.Insert(shipment); err != nil {
				return fmt.Errorf("failed to create shipment: %w", err)
			}
		}

		// 3. Create waypoint log (order_created)
		waypointLogRepo := u.WaypointLogRepo.WithTx(ctx, tx)
		log := &entity.WaypointLog{
			OrderID:   order.ID,
			EventType: "order_created",
			Message:   fmt.Sprintf("%s membuat order pengiriman", order.CreatedBy),
			OldStatus: "",
			NewStatus: "pending",
			Notes:     fmt.Sprintf("Order %s dibuat dengan %d shipment(s)", order.OrderNumber, len(shipments)),
			CreatedBy: order.CreatedBy,
		}
		if err := waypointLogRepo.Insert(log); err != nil {
			return fmt.Errorf("failed to create waypoint log: %w", err)
		}

		return nil
	})
}

// UpdateWithShipments - Update order with shipments in transaction
func (u *OrderUsecase) UpdateWithShipments(order *entity.Order, shipments []*entity.Shipment, fields ...string) error {
	return u.Repo.RunInTx(u.Context, func(ctx context.Context, tx bun.Tx) error {
		// 1. Update Order
		orderRepo := u.Repo.WithTx(ctx, tx)
		if err := orderRepo.Update(order, fields...); err != nil {
			return err
		}

		// 2. Update Shipments
		shipmentRepo := u.ShipmentRepo.WithTx(ctx, tx)
		oldShipments, _ := u.ShipmentRepo.FindByOrderID(order.ID.String())

		// 2.1 Create or Update Shipments
		for _, sp := range shipments {
			if sp.ID == uuid.Nil {
				sp.OrderID = order.ID
				if err := shipmentRepo.Insert(sp); err != nil {
					return err
				}
			} else {
				if err := shipmentRepo.Update(sp); err != nil {
					return err
				}
			}
		}

		// 2.2 Delete removed shipments
		for _, oldSP := range oldShipments {
			found := false
			for _, sp := range shipments {
				if oldSP.ID == sp.ID {
					found = true
					break
				}
			}
			if !found {
				if err := shipmentRepo.SoftDelete(oldSP.ID); err != nil {
					return err
				}
			}
		}

		return nil
	})
}

// UpdateStatus - Update order status
func (u *OrderUsecase) UpdateStatus(orderID, status string) error {
	order, err := u.Repo.FindByID(orderID)
	if err != nil {
		return err
	}

	// Validate status transition
	validTransitions := map[string][]string{
		"pending":    {"planned", "cancelled"},
		"planned":    {"dispatched", "pending", "cancelled", "in_transit"},
		"dispatched": {"in_transit", "pending", "cancelled"},
		"in_transit": {"completed", "cancelled", "planned"},
	}

	allowedStatuses, ok := validTransitions[order.Status]
	if !ok {
		return fmt.Errorf("invalid current status: %s", order.Status)
	}

	isValid := false
	for _, s := range allowedStatuses {
		if s == status {
			isValid = true
			break
		}
	}

	if !isValid {
		return fmt.Errorf("invalid status transition from %s to %s", order.Status, status)
	}

	order.Status = status
	return u.Repo.Update(order)
}

// GetByID retrieves an order by ID
func (u *OrderUsecase) GetByID(id string) (*entity.Order, error) {
	mx, err := u.Repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	mx.Shipments, err = u.ShipmentRepo.FindByOrderID(id)
	if err != nil {
		return nil, err
	}

	return mx, nil
}

// Cancel cancels an order
func (u *OrderUsecase) Cancel(order *entity.Order) error {
	return u.UpdateStatus(order.ID.String(), "cancelled")
}

// GenerateOrderNumber - Generate order number with format ORD-YYYYMMDD-RandomNumber
func (u *OrderUsecase) GenerateOrderNumber() string {
	now := time.Now()
	dateStr := now.Format("20060102")
	randomNum := fmt.Sprintf("%04d", now.Nanosecond()%10000)
	return fmt.Sprintf("ORD-%s-%s", dateStr, randomNum)
}

func NewOrderUsecase() *OrderUsecase {
	return &OrderUsecase{
		BaseUsecase:       common.NewBaseUsecase(repository.NewOrderRepository()),
		Repo:              repository.NewOrderRepository(),
		CustomerRepo:      repository.NewCustomerRepository(),
		PricingMatrixRepo: repository.NewPricingMatrixRepository(),
		WaypointLogRepo:   repository.NewWaypointLogRepository(),
		ShipmentRepo:      repository.NewShipmentRepository(),
	}
}
