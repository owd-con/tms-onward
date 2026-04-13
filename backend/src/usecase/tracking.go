// Package usecase provides business logic for public tracking service.
package usecase

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/logistics-id/engine/ds/postgres"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/uptrace/bun"
)

type TrackingUsecase struct {
	db bun.IDB
}

// TrackingResponse represents the public tracking information
type TrackingResponse struct {
	OrderNumber     string              `json:"order_number"`
	ReferenceCode   string              `json:"reference_code"`
	Status          string              `json:"status"`
	OrderType       string              `json:"order_type"`
	CustomerName    string              `json:"customer_name"`
	CreatedAt       string              `json:"created_at"`
	Shipments       []ShipmentInfo      `json:"shipments"`
	WaypointHistory []WaypointHistory   `json:"waypoint_history"`
	ShipmentHistory []ShipmentHistory   `json:"shipment_history"`
	WaypointImages  []WaypointImageInfo `json:"waypoint_images,omitempty"`
	Driver          *DriverInfo         `json:"driver,omitempty"`
	Vehicle         *VehicleInfo        `json:"vehicle,omitempty"`
}

// ShipmentInfo represents shipment information for tracking
type ShipmentInfo struct {
	ShipmentNumber      string  `json:"shipment_number"`
	Status              string  `json:"status"`
	OriginLocationName  string  `json:"origin_location_name"`
	OriginAddress       string  `json:"origin_address"`
	DestLocationName    string  `json:"dest_location_name"`
	DestAddress         string  `json:"dest_address"`
	ScheduledPickupDate string  `json:"scheduled_pickup_date"`
	ScheduledPickupTime string  `json:"scheduled_pickup_time"`
	ActualPickupTime    *string `json:"actual_pickup_time,omitempty"`
	ActualDeliveryTime  *string `json:"actual_delivery_time,omitempty"`
	ReceivedBy          *string `json:"received_by,omitempty"`
	FailedReason        *string `json:"failed_reason,omitempty"`
	FailedAt            *string `json:"failed_at,omitempty"`
}

// ShipmentHistory represents a single event in shipment timeline
type ShipmentHistory struct {
	ShipmentNumber string `json:"shipment_number"`
	EventType      string `json:"event_type"` // e.g., "status_change", "picked_up", "delivered", "failed"
	Message        string `json:"message"`    // Human-readable message
	OldStatus      string `json:"old_status,omitempty"`
	NewStatus      string `json:"new_status"`
	Notes          string `json:"notes,omitempty"`
	ChangedAt      string `json:"changed_at"`
}

type WaypointHistory struct {
	WaypointID   string `json:"waypoint_id"`
	LocationName string `json:"location_name"`
	Address      string `json:"address"`
	Type         string `json:"type"` // pickup or delivery
	Status       string `json:"status"`
	OldStatus    string `json:"old_status,omitempty"`
	Notes        string `json:"notes,omitempty"`
	ChangedAt    string `json:"changed_at"`
}

type WaypointImageInfo struct {
	WaypointImageID string   `json:"waypoint_image_id"`
	Type            string   `json:"type"`           // "pod" | "failed"
	Note            string   `json:"note,omitempty"` // Note for this waypoint image (used when there's no received_by or failed_reason)
	Photos          []string `json:"photos,omitempty"`
	SignatureURL    string   `json:"signature_url,omitempty"`
	SubmittedAt     string   `json:"submitted_at"`
}

type DriverInfo struct {
	DriverID string `json:"driver_id"`
	Name     string `json:"name"`
}

type VehicleInfo struct {
	VehicleID   string `json:"vehicle_id"`
	PlateNumber string `json:"plate_number"`
}

func NewTrackingUsecase() *TrackingUsecase {
	return &TrackingUsecase{
		db: postgres.GetDB(),
	}
}

// TrackByOrderNumber retrieves tracking information by order number
func (u *TrackingUsecase) TrackByOrderNumber(ctx context.Context, orderNumber string) (*TrackingResponse, error) {
	if orderNumber == "" {
		return nil, errors.New("order number is required")
	}

	// Get order by order number
	order := &entity.Order{}
	err := u.db.NewSelect().
		Model(order).
		Relation("Customer").
		Where("order_number = ? OR reference_code = ?", orderNumber, orderNumber).
		Where("orders.is_deleted = false").
		Scan(ctx)
	if err != nil {
		return nil, errors.New("order not found")
	}

	response := &TrackingResponse{
		OrderNumber:   order.OrderNumber,
		ReferenceCode: order.ReferenceCode,
		Status:        order.Status,
		OrderType:     order.OrderType,
		CustomerName:  order.Customer.Name,
		CreatedAt:     order.CreatedAt.UTC().Format(time.RFC3339),
	}

	// Get shipments for this order
	var shipments []*entity.Shipment
	err = u.db.NewSelect().
		Model(&shipments).
		Where("order_id = ?", order.ID).
		Where("shipments.is_deleted = false").
		Order("sorting_id ASC").
		Scan(ctx)
	if err != nil {
		return nil, err
	}

	// Build shipment info
	shipmentInfos := make([]ShipmentInfo, 0)
	for _, s := range shipments {
		si := ShipmentInfo{
			ShipmentNumber:      s.ShipmentNumber,
			Status:              s.Status,
			OriginLocationName:  s.OriginLocationName,
			OriginAddress:       s.OriginAddress,
			DestLocationName:    s.DestLocationName,
			DestAddress:         s.DestAddress,
			ScheduledPickupDate: s.ScheduledPickupDate.UTC().Format(time.RFC3339),
			ScheduledPickupTime: s.ScheduledPickupTime,
		}
		if s.ActualPickupTime != nil {
			formatted := s.ActualPickupTime.UTC().Format(time.RFC3339)
			si.ActualPickupTime = &formatted
		}
		if s.ActualDeliveryTime != nil {
			formatted := s.ActualDeliveryTime.UTC().Format(time.RFC3339)
			si.ActualDeliveryTime = &formatted
		}
		si.ReceivedBy = s.ReceivedBy
		si.FailedReason = s.FailedReason
		if s.FailedAt != nil {
			formatted := s.FailedAt.UTC().Format(time.RFC3339)
			si.FailedAt = &formatted
		}
		shipmentInfos = append(shipmentInfos, si)
	}
	response.Shipments = shipmentInfos

	// Get trip for this order (to get trip_waypoints)
	trip := &entity.Trip{}
	err = u.db.NewSelect().
		Model(trip).
		Relation("TripWaypoints", func(q *bun.SelectQuery) *bun.SelectQuery {
			return q.Order("trip_waypoints.sequence_number ASC")
		}).
		Where("order_id = ?", order.ID).
		Where("trips.is_deleted = false").
		Scan(ctx)

	// Build waypoint history from waypoint_logs
	var waypointLogs []*entity.WaypointLog
	err = u.db.NewSelect().
		Model(&waypointLogs).
		Relation("TripWaypoint").
		Where("waypoint_logs.order_id = ?", order.ID).
		Order("created_at DESC").
		Scan(ctx)
	if err != nil {
		return nil, err
	}

	// Build waypoint history
	history := make([]WaypointHistory, 0)
	for _, log := range waypointLogs {
		h := &WaypointHistory{
			Status:    log.NewStatus,
			OldStatus: log.OldStatus,
			Notes:     log.Message,
			ChangedAt: log.CreatedAt.UTC().Format(time.RFC3339),
		}

		if log.TripWaypoint != nil {
			h.WaypointID = log.TripWaypoint.ID.String()
			h.LocationName = log.TripWaypoint.LocationName
			h.Address = log.TripWaypoint.Address
			h.Type = log.TripWaypoint.Type
		}

		history = append(history, *h)
	}
	response.WaypointHistory = history

	// Build shipment history from waypoint_logs
	// Create a map of shipment ID to shipment number for lookup
	shipmentMap := make(map[string]string) // shipment ID -> shipment number
	for _, s := range shipments {
		shipmentMap[s.ID.String()] = s.ShipmentNumber
	}

	shipmentHistory := make([]ShipmentHistory, 0)
	for _, log := range waypointLogs {
		// For each shipment_id in the log, create a shipment history entry
		for _, shipmentID := range log.ShipmentIDs {
			shipmentNumber, ok := shipmentMap[shipmentID]
			if !ok {
				continue // Skip if shipment not found
			}

			sh := ShipmentHistory{
				ShipmentNumber: shipmentNumber,
				EventType:      log.EventType,
				Message:        log.Message,
				NewStatus:      log.NewStatus,
				OldStatus:      log.OldStatus,
				Notes:          log.Notes,
				ChangedAt:      log.CreatedAt.UTC().Format(time.RFC3339),
			}

			shipmentHistory = append(shipmentHistory, sh)
		}
	}
	// Sort by changed_at descending (most recent first)
	// Note: Already sorted from the query above
	response.ShipmentHistory = shipmentHistory

	// Get waypoint images (POD/failed) for this order
	// Get trip_waypoints for this order
	var tripWaypoints []*entity.TripWaypoint
	if trip.ID != uuid.Nil {
		// Trip exists, use its waypoints
		tripWaypoints = trip.TripWaypoints
	} else {
		// No trip found, try to get trip_waypoints directly
		err = u.db.NewSelect().
			Model(&tripWaypoints).
			Where("trip_id IN (SELECT id FROM trips WHERE order_id = ? AND is_deleted = false)", order.ID).
			Where("trip_waypoints.is_deleted = false").
			Order("sequence_number ASC").
			Scan(ctx)
	}

	if len(tripWaypoints) > 0 {
		// Get waypoint images for these trip_waypoints
		var waypointImages []*entity.WaypointImage
		tripWaypointIDs := make([]string, len(tripWaypoints))
		for i, tw := range tripWaypoints {
			tripWaypointIDs[i] = tw.ID.String()
		}

		err = u.db.NewSelect().
			Model(&waypointImages).
			Where("trip_waypoint_id IN (?)", bun.In(tripWaypointIDs)).
			Where("waypoint_images.is_deleted = false").
			Order("created_at ASC").
			Scan(ctx)
		if err == nil {
			images := make([]WaypointImageInfo, 0)
			for _, wi := range waypointImages {
				imageInfo := WaypointImageInfo{
					WaypointImageID: wi.ID.String(),
					Type:            wi.Type,
					Photos:          wi.Images, // Already []string from TEXT[]
					SubmittedAt:     wi.CreatedAt.UTC().Format(time.RFC3339),
				}
				if wi.SignatureURL != nil {
					imageInfo.SignatureURL = *wi.SignatureURL
				}

				// Get recipient name from trip_waypoint.received_by or failed_reason
				for _, tw := range tripWaypoints {
					if tw.ID == wi.TripWaypointID {
						if tw.ReceivedBy != nil {
							imageInfo.Note = *tw.ReceivedBy
						}

						if tw.FailedReason != nil {
							imageInfo.Note = *tw.FailedReason
						}
					}
				}

				images = append(images, imageInfo)
			}
			response.WaypointImages = images
		}
	}

	// Get trip info for driver and vehicle (only if dispatched/in_transit/completed)
	if order.Status == "dispatched" || order.Status == "in_transit" || order.Status == "completed" {
		// Get trip directly (fetches latest trip for this order)
		trip = &entity.Trip{}
		err = u.db.NewSelect().
			Model(trip).
			Relation("Driver").
			Relation("Vehicle").
			Where("order_id = ?", order.ID).
			Where("trips.is_deleted = false").
			Scan(ctx)
		if err == nil {
			if trip.Driver != nil {
				response.Driver = &DriverInfo{
					DriverID: trip.Driver.ID.String(),
					Name:     trip.Driver.Name,
				}
			}
			if trip.Vehicle != nil {
				response.Vehicle = &VehicleInfo{
					VehicleID:   trip.Vehicle.ID.String(),
					PlateNumber: trip.Vehicle.PlateNumber,
				}
			}
		}
	}

	return response, nil
}
