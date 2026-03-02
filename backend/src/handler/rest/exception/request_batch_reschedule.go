package exception

import (
	"context"

	"github.com/google/uuid"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
)

type batchRescheduleShipmentsRequest struct {
	ShipmentIDs []string `json:"shipment_ids" valid:"required"` // Array of failed shipment IDs
	DriverID    string   `json:"driver_id" valid:"required|uuid"`
	VehicleID   string   `json:"vehicle_id" valid:"required|uuid"`

	shipments []*entity.Shipment
	orderID   uuid.UUID       // Validate all shipments belong to same order
	driver    *entity.Driver  // Fetched during validation
	vehicle   *entity.Vehicle // Fetched during validation

	uc      *usecase.Factory
	ctx     context.Context
	session *entity.TMSSessionClaims
}

func (r *batchRescheduleShipmentsRequest) Validate() *validate.Response {
	v := validate.NewResponse()

	// Validate shipment_ids is not empty
	if len(r.ShipmentIDs) == 0 {
		v.SetError("shipment_ids.invalid", "at least one shipment_id is required.")
	}

	// Fetch and validate all shipments
	r.shipments = make([]*entity.Shipment, 0, len(r.ShipmentIDs))
	r.orderID = uuid.UUID{} // Initialize as zero UUID

	for i, shipmentID := range r.ShipmentIDs {
		shipment, err := r.uc.Shipment.GetByID(shipmentID)
		if err != nil {
			v.SetError("shipment_ids.invalid", "shipment not found or invalid.")
			continue // Skip remaining validation for this invalid shipment
		}

		// Validate shipment can be rescheduled (only failed shipments)
		if shipment.Status != "failed" {
			v.SetError("shipment_ids.invalid", "only failed shipments can be rescheduled.")
			continue // Skip this invalid shipment
		}

		// Validate all shipments belong to the same order
		if i == 0 {
			r.orderID = shipment.OrderID
		} else if shipment.OrderID != r.orderID {
			v.SetError("shipment_ids.invalid", "all shipments must belong to the same order.")
			continue // Skip this invalid shipment
		}

		r.shipments = append(r.shipments, shipment)
	}

	// Validate driver and vehicle belong to same company
	if r.session != nil {
		// Validate driver exists and belongs to company
		if r.DriverID != "" {
			driver, err := r.uc.Driver.GetByID(r.DriverID)
			if err != nil {
				v.SetError("driver_id.invalid", "driver not found.")
			} else if driver.CompanyID.String() != r.session.CompanyID {
				v.SetError("driver_id.invalid", "driver must belong to the same company.")
			} else {
				r.driver = driver
			}
		}

		// Validate vehicle exists and belongs to company
		if r.VehicleID != "" {
			vehicle, err := r.uc.Vehicle.GetByID(r.VehicleID)
			if err != nil {
				v.SetError("vehicle_id.invalid", "vehicle not found.")
			} else if vehicle.CompanyID.String() != r.session.CompanyID {
				v.SetError("vehicle_id.invalid", "vehicle must belong to the same company.")
			} else {
				r.vehicle = vehicle
			}
		}
	}

	// Validate old trip is "completed" before allowing reschedule
	// For shipments, we check if the order's last trip is completed
	if r.orderID != uuid.Nil && len(r.shipments) > 0 {
		// Check if there's a completed trip for this order
		trip, err := r.uc.Trip.GetByOrderID(r.orderID.String())
		if err != nil {
			// No trip found, this is OK (first reschedule)
		} else if trip.Status != "completed" && trip.Status != "cancelled" {
			v.SetError("shipment_ids.invalid", "previous trip must be completed or cancelled before rescheduling.")
		}
	}

	return v
}

func (r *batchRescheduleShipmentsRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *batchRescheduleShipmentsRequest) execute() (*rest.ResponseBody, error) {
	// Convert shipment IDs to UUID array
	shipmentUUIDs := make([]uuid.UUID, len(r.ShipmentIDs))
	for i, id := range r.ShipmentIDs {
		shipmentUUIDs[i], _ = uuid.Parse(id)
	}

	driverID, _ := uuid.Parse(r.DriverID)
	vehicleID, _ := uuid.Parse(r.VehicleID)

	trip, err := r.uc.Exception.BatchRescheduleShipments(shipmentUUIDs, driverID, vehicleID)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(trip), nil
}

func (r *batchRescheduleShipmentsRequest) toEntity() *entity.Trip {
	return &entity.Trip{
		CompanyID:  r.driver.CompanyID,
		OrderID:    r.orderID,
		TripNumber: r.uc.Trip.GenerateTripNumber(),
		DriverID:   r.driver.ID,
		VehicleID:  r.vehicle.ID,
		Status:     "planned",
		CreatedBy:  r.session.DisplayName,
	}
}

func (r *batchRescheduleShipmentsRequest) with(ctx context.Context, uc *usecase.Factory) *batchRescheduleShipmentsRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}
