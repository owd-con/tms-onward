package repository

import (
	"context"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/ds/postgres"
	"github.com/logistics-id/onward-tms/entity"
)

type ShipmentRepository struct {
	*postgres.BaseRepository[entity.Shipment]
}

func NewShipmentRepository() *ShipmentRepository {
	base := postgres.NewBaseRepository[entity.Shipment](postgres.GetDB(),
		"shipments",
		[]string{"shipment_number"},
		[]string{"Order", "OriginAddressRel", "DestAddressRel"},
		true,
	)

	return &ShipmentRepository{base}
}

// WithContext returns a new ShipmentRepository instance with given context
func (r *ShipmentRepository) WithContext(ctx context.Context) common.BaseRepositoryInterface[entity.Shipment] {
	return &ShipmentRepository{
		BaseRepository: r.BaseRepository.WithContext(ctx).(*postgres.BaseRepository[entity.Shipment]),
	}
}

// FindByOrderID retrieves all shipments for a specific order, sorted by sorting_id
func (r *ShipmentRepository) FindByOrderID(orderID string) ([]*entity.Shipment, error) {
	var shipments []*entity.Shipment
	err := r.DB.NewSelect().
		Model(&shipments).
		Where("shipments.order_id = ?", orderID).
		Where("shipments.is_deleted = false").
		OrderExpr("shipments.sorting_id ASC").
		Relation("OriginAddressRel").
		Relation("DestAddressRel").
		Scan(r.Context)
	return shipments, err
}

// FindByOrderIDWithStatus retrieves shipments for a specific order with given status
func (r *ShipmentRepository) FindByOrderIDWithStatus(orderID string, status string) ([]*entity.Shipment, error) {
	var shipments []*entity.Shipment
	err := r.DB.NewSelect().
		Model(&shipments).
		Where("shipments.order_id = ?", orderID).
		Where("shipments.status = ?", status).
		Where("shipments.is_deleted = false").
		OrderExpr("shipments.sorting_id ASC").
		Relation("OriginAddressRel").
		Relation("DestAddressRel").
		Scan(r.Context)
	return shipments, err
}

// FindFailedShipments retrieves all failed shipments for a company
func (r *ShipmentRepository) FindFailedShipments(companyID string) ([]*entity.Shipment, error) {
	var shipments []*entity.Shipment
	err := r.DB.NewSelect().
		Model(&shipments).
		Where("shipments.company_id = ?", companyID).
		Where("shipments.status = ?", "failed").
		Where("shipments.is_deleted = false").
		OrderExpr("shipments.failed_at DESC").
		Relation("OriginAddressRel").
		Relation("DestAddressRel").
		Relation("Order").
		Scan(r.Context)
	return shipments, err
}

// UpdateStatus updates the status of a shipment
func (r *ShipmentRepository) UpdateStatus(shipmentID string, status string) error {
	_, err := r.DB.NewUpdate().
		Model(&entity.Shipment{}).
		Set("status = ?", status).
		Set("updated_at = NOW()").
		Where("id = ?", shipmentID).
		Where("is_deleted = false").
		Exec(r.Context)
	return err
}

// UpdateStatusWithFailedInfo updates shipment status and sets failed reason/time
func (r *ShipmentRepository) UpdateStatusWithFailedInfo(shipmentID string, status string, failedReason *string) error {
	update := r.DB.NewUpdate().
		Model(&entity.Shipment{}).
		Set("status = ?", status).
		Set("failed_reason = ?", failedReason).
		Set("failed_at = NOW()").
		Set("updated_at = NOW()")

	_, err := update.
		Where("id = ?", shipmentID).
		Where("is_deleted = false").
		Exec(r.Context)
	return err
}

// UpdateRetryCount increments the retry count for a shipment
func (r *ShipmentRepository) UpdateRetryCount(shipmentID string) error {
	_, err := r.DB.NewUpdate().
		Model(&entity.Shipment{}).
		Set("retry_count = retry_count + 1").
		Set("updated_at = NOW()").
		Where("id = ?", shipmentID).
		Where("is_deleted = false").
		Exec(r.Context)
	return err
}

// UpdateStatusBasedOnShipments updates order status based on its shipments
// - If ALL shipments are "pending" → order status = "pending"
// - If ALL shipments are final states (delivered/returned/cancelled) → order status = "completed"
// - Otherwise → order status = "in_transit"
func (r *ShipmentRepository) UpdateOrderStatusBasedOnShipments(orderID string) error {
	query := `
		UPDATE orders
		SET status = CASE
			WHEN NOT EXISTS (
				SELECT 1 FROM shipments
				WHERE shipments.order_id = orders.id
				AND shipments.is_deleted = false
				AND shipments.status != 'pending'
			) THEN 'pending'
			WHEN NOT EXISTS (
				SELECT 1 FROM shipments
				WHERE shipments.order_id = orders.id
				AND shipments.is_deleted = false
				AND shipments.status NOT IN ('delivered', 'returned', 'cancelled')
			) THEN 'completed'
			ELSE 'in_transit'
		END,
		updated_at = NOW()
		WHERE orders.id = ?
	`

	_, err := r.DB.ExecContext(r.Context, query, orderID)
	return err
}
