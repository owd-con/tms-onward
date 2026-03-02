package trip

import (
	"context"
	"fmt"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
)

// ShipmentSequenceRequest represents a shipment with its sequence in trip update
type ShipmentSequenceRequest struct {
	ShipmentID     string `json:"shipment_id" valid:"required|uuid"`
	SequenceNumber int    `json:"sequence_number" valid:"required"`
}

type updateRequest struct {
	ID                string                     `param:"id"`
	Notes             string                     `json:"notes"`
	ShipmentSequences []ShipmentSequenceRequest `json:"shipment_sequences"` // Untuk sequence update (LTL only)

	trip               *entity.Trip
	waypointsForUpdate []*entity.TripWaypoint // Collected for sequence update

	ctx     context.Context
	uc      *usecase.Factory
	session *entity.TMSSessionClaims
}

func (r *updateRequest) Validate() *validate.Response {
	v := validate.NewResponse()

	// Validate trip exists - load with Order relation for OrderType check
	if r.ID != "" {
		trip, err := r.uc.Trip.GetByID(r.ID)
		if err != nil {
			v.SetError("id.invalid", "Trip not found or invalid.")
		} else {
			r.trip = trip
		}
	}

	// If shipment_sequences are provided, validate sequence update
	if len(r.ShipmentSequences) > 0 {
		// Only validate shipment_sequences if trip was successfully loaded
		if r.trip == nil {
			// Skip shipment_sequences validation since trip is not available
		} else {
			// Validate: hanya bisa update sequence jika trip.Status == "planned"
			if r.trip.Status != "planned" {
				v.SetError("shipment_sequences.invalid", fmt.Sprintf("Shipment sequence can only be updated for trips in Planned status. Current status: %s", r.trip.Status))
			}

			// Validate: hanya bisa update sequence jika order.OrderType == "LTL"
			if r.trip.Order == nil {
				v.SetError("order.invalid", "Order relation not loaded.")
			} else if r.trip.Order.OrderType != "LTL" {
				v.SetError("shipment_sequences.invalid", fmt.Sprintf("Shipment sequence update only allowed for LTL orders. Got: %s", r.trip.Order.OrderType))
			}

			// If trip is Planned and LTL, proceed with shipment_sequences validation
			if r.trip.Status == "planned" && r.trip.Order != nil && r.trip.Order.OrderType == "LTL" {
				// With Shipment Concept, sequence update now works with shipments
				// Validate: sequence_number unique dan sequential (1, 2, 3, ...)
				sequenceMap := make(map[int]bool)
				shipmentMap := make(map[string]bool) // Track shipment IDs
				for i, ss := range r.ShipmentSequences {
					if ss.SequenceNumber < 1 {
						v.SetError(fmt.Sprintf("shipment_sequences.%d.sequence_number.invalid", i), "Sequence number must be at least 1.")
					}
					if sequenceMap[ss.SequenceNumber] {
						v.SetError(fmt.Sprintf("shipment_sequences.%d.sequence_number.invalid", i), "Sequence number must be unique.")
					}
					sequenceMap[ss.SequenceNumber] = true

					// Validate shipment exists and belongs to this order
					shipment, err := r.uc.Shipment.GetByID(ss.ShipmentID)
					if err != nil {
						v.SetError(fmt.Sprintf("shipment_sequences.%d.shipment_id.invalid", i), "Shipment not found.")
					} else if shipment.OrderID.String() != r.trip.OrderID.String() {
						v.SetError(fmt.Sprintf("shipment_sequences.%d.shipment_id.invalid", i), "Shipment does not belong to this order.")
					}
					shipmentMap[ss.ShipmentID] = true
				}

				// Check if sequence is sequential (1, 2, 3, ...)
				if len(sequenceMap) > 0 {
					for i := 1; i <= len(sequenceMap); i++ {
						if !sequenceMap[i] {
							v.SetError("shipment_sequences.invalid", fmt.Sprintf("Sequence numbers must be sequential starting from 1. Missing sequence: %d", i))
							break
						}
					}
				}

				// Get shipments for the order to create trip waypoints
				shipments, err := r.uc.Shipment.GetByOrderID(r.trip.OrderID.String())
				if err != nil {
					v.SetError("shipment_sequences.invalid", "Failed to fetch shipments for trip update.")
				}

				// Convert shipments to trip waypoints with updated sequence
				r.waypointsForUpdate, err = r.uc.Trip.ConvertShipmentsToTripWaypoints(r.trip.ID, r.trip.OrderID.String(), r.trip.Order.OrderType)
				if err != nil {
					v.SetError("shipment_sequences.invalid", fmt.Sprintf("Failed to convert shipments: %v", err))
				}

				// Update sequence numbers based on input
				// Map shipment_id to sequence_number
				shipmentToSequence := make(map[string]int)
				for _, ss := range r.ShipmentSequences {
					shipmentToSequence[ss.ShipmentID] = ss.SequenceNumber
				}

				// Apply sequence to trip waypoints based on their shipment IDs
				for _, tw := range r.waypointsForUpdate {
					// Each trip waypoint has ShipmentIDs array (usually 1 for LTL)
					if len(tw.ShipmentIDs) > 0 {
						shipmentID := tw.ShipmentIDs[0]
						if seq, ok := shipmentToSequence[shipmentID]; ok {
							tw.SequenceNumber = seq
						}
					}
				}

				// Verify all shipments are covered
				if len(shipmentMap) != len(shipments) {
					v.SetError("shipment_sequences.invalid", "All shipments must be included in sequence update.")
				}
			}
		}
	}

	return v
}

func (r *updateRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *updateRequest) execute() (*rest.ResponseBody, error) {
	// Jika shipment_sequences array provided → panggil UpdateSequence
	if len(r.waypointsForUpdate) > 0 {
		err := r.uc.Trip.UpdateSequence(r.trip, r.waypointsForUpdate)
		if err != nil {
			return nil, err
		}
	}

	// Update notes (jika ada)
	if r.Notes != "" {
		r.trip.Notes = r.Notes
		err := r.uc.Trip.Update(r.trip, "notes")
		if err != nil {
			return nil, err
		}
	}

	return rest.NewResponseBody(r.trip, nil), nil
}

func (r *updateRequest) with(ctx context.Context, uc *usecase.Factory) *updateRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}
