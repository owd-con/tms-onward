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
	WaypointRepo      *repository.OrderWaypointRepository
	WaypointLogRepo   *repository.WaypointLogRepository
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
		WaypointRepo:      u.WaypointRepo.WithContext(ctx).(*repository.OrderWaypointRepository),
		WaypointLogRepo:   u.WaypointLogRepo.WithContext(ctx).(*repository.WaypointLogRepository),
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

// CreateWithWaypoints - Create order with waypoints in transaction
func (u *OrderUsecase) CreateWithWaypoints(order *entity.Order, waypoints []*entity.OrderWaypoint) error {
	return u.Repo.RunInTx(u.Context, func(ctx context.Context, tx bun.Tx) error {
		// 1. Create Order
		orderRepo := u.Repo.WithTx(ctx, tx)
		if err := orderRepo.Insert(order); err != nil {
			return err
		}

		// 2. Create Order Waypoints
		waypointRepo := u.WaypointRepo.WithTx(ctx, tx)
		for _, wp := range waypoints {
			wp.OrderID = order.ID
			if err := waypointRepo.Insert(wp); err != nil {
				return err
			}
		}

		// 3. Create waypoint log (order_created)
		waypointLogRepo := u.WaypointLogRepo.WithTx(ctx, tx)
		companyName := "Perusahaan"
		if order.Company != nil {
			companyName = order.Company.Name
		}
		log := &entity.WaypointLog{
			OrderID:   &order.ID,
			EventType: "order_created",
			Message:   fmt.Sprintf("%s membuat order pengiriman", companyName),
			OldStatus: "",
			NewStatus: "pending",
			Notes:     fmt.Sprintf("Order %s dibuat", order.OrderNumber),
			CreatedBy: order.CreatedBy,
		}
		if err := waypointLogRepo.Insert(log); err != nil {
			return fmt.Errorf("failed to create waypoint log: %w", err)
		}

		return nil
	})
}

// UpdateWithWaypoints - Update order with waypoints in transaction
func (u *OrderUsecase) UpdateWithWaypoints(order *entity.Order, waypoints []*entity.OrderWaypoint, fields ...string) error {
	return u.Repo.RunInTx(u.Context, func(ctx context.Context, tx bun.Tx) error {
		// 1. Update Order
		orderRepo := u.Repo.WithTx(ctx, tx)
		if err := orderRepo.Update(order, fields...); err != nil {
			return err
		}

		// 2. Update Order Waypoints
		waypointRepo := u.WaypointRepo.WithTx(ctx, tx)
		oldWaypoints, _ := u.WaypointRepo.GetByOrderID(order.ID.String())

		// 2.1 Create Order Waypoints
		for _, wp := range waypoints {
			if wp.ID == uuid.Nil {
				wp.OrderID = order.ID
				if err := waypointRepo.Insert(wp); err != nil {
					return err
				}
			} else {
				if err := waypointRepo.Update(wp); err != nil {
					return err
				}
			}
		}

		// 2.2 Delete removed waypoints
		for _, oldWP := range oldWaypoints {
			found := false
			for _, wp := range waypoints {
				if oldWP.ID == wp.ID {
					found = true
					break
				}
			}
			if !found {
				if err := waypointRepo.SoftDelete(oldWP.ID); err != nil {
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
		"planned":    {"dispatched", "pending", "cancelled"},
		"dispatched": {"in_transit", "pending", "cancelled"},
		"in_transit": {"completed", "cancelled"},
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

	mx.OrderWaypoints, err = u.WaypointRepo.GetByOrderID(id)
	if err != nil {
		return nil, err
	}

	return mx, nil
}

// GetByNumber retrieves an order by order number
func (u *OrderUsecase) GetByNumber(number string) (*entity.Order, error) {
	return u.Repo.FindOne(func(q *bun.SelectQuery) *bun.SelectQuery {
		return q.Where("order_number = ?", number)
	})
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
		WaypointRepo:      repository.NewOrderWaypointRepository(),
		WaypointLogRepo:   repository.NewWaypointLogRepository(),
	}
}
