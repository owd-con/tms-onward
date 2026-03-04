package trip

import (
	"fmt"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/validate"
)

// WaypointRequest represents a waypoint in a trip
// Used for creating trips with explicit waypoints (instead of deriving from shipments)
type WaypointRequest struct {
	Type           string   `json:"type" valid:"required|in:pickup,delivery"`
	AddressID      string   `json:"address_id" valid:"required|uuid"`
	ShipmentIDs    []string `json:"shipment_ids" valid:"required"`
	SequenceNumber int      `json:"sequence_number" valid:"required|min:1"`

	address   *entity.Address
	shipments []*entity.Shipment
	uc        *usecase.Factory
	session   *entity.TMSSessionClaims
}

// Validate validates a single waypoint
func (r *WaypointRequest) Validate(v *validate.Response, key int) {
	var err error

	// Validate type is required
	if r.Type == "" {
		v.SetError(fmt.Sprintf("waypoints.%d.type.required", key), "Type is required.")
	}

	// Validate address_id is required
	if r.AddressID == "" {
		v.SetError(fmt.Sprintf("waypoints.%d.address_id.required", key), "Address ID is required.")
	}

	// Fetch address entity (only if address_id is provided)
	if r.AddressID != "" {
		r.address, err = r.uc.Address.GetByID(r.AddressID)
		if err != nil {
			v.SetError(fmt.Sprintf("waypoints.%d.address_id.invalid", key), "Address not found.")
		}
	}

	// Validate shipment_ids is required
	if len(r.ShipmentIDs) == 0 {
		v.SetError(fmt.Sprintf("waypoints.%d.shipment_ids.required", key), "At least one shipment ID is required.")
	}

	// Fetch all shipments (only if shipment_ids is provided)
	if len(r.ShipmentIDs) > 0 {
		r.shipments = make([]*entity.Shipment, 0, len(r.ShipmentIDs))
		for i, shipmentID := range r.ShipmentIDs {
			shipment, err := r.uc.Shipment.GetByID(shipmentID)
			if err != nil {
				v.SetError(fmt.Sprintf("waypoints.%d.shipment_ids.%d.invalid", key, i), "Shipment not found.")
			} else {
				r.shipments = append(r.shipments, shipment)
			}
		}
	}

	// Validate sequence_number
	if r.SequenceNumber < 1 {
		v.SetError(fmt.Sprintf("waypoints.%d.sequence_number.invalid", key), "Sequence number must be at least 1.")
	}
}
