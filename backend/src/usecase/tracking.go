// Package usecase provides business logic for public tracking service.
package usecase

import (
	"context"
	"errors"

	"github.com/logistics-id/engine/ds/postgres"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/uptrace/bun"
)

type TrackingUsecase struct {
	db bun.IDB
}

// TrackingResponse represents the public tracking information
type TrackingResponse struct {
	OrderNumber     string             `json:"order_number"`
	Status          string             `json:"status"`
	OrderType       string             `json:"order_type"`
	CustomerName    string             `json:"customer_name"`
	CreatedAt       string             `json:"created_at"`
	WaypointHistory []WaypointHistory  `json:"waypoint_history"`
	WaypointImages  []WaypointImageInfo `json:"waypoint_images,omitempty"`
	Driver          *DriverInfo        `json:"driver,omitempty"`
	Vehicle         *VehicleInfo       `json:"vehicle,omitempty"`
}

type WaypointHistory struct {
	WaypointID    string    `json:"waypoint_id"`
	LocationName  string    `json:"location_name"`
	Address       string    `json:"address"`
	Type          string    `json:"type"`     // pickup or delivery
	Status        string    `json:"status"`
	OldStatus     string    `json:"old_status,omitempty"`
	Notes         string    `json:"notes,omitempty"`
	ChangedAt     string    `json:"changed_at"`
}

type WaypointImageInfo struct {
	WaypointImageID string   `json:"waypoint_image_id"`
	Type            string   `json:"type"` // "pod" | "failed"
	RecipientName   string   `json:"recipient_name,omitempty"`
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
		Where("order_number = ?", orderNumber).
		Where("is_deleted = false").
		Scan(ctx)
	if err != nil {
		return nil, errors.New("order not found")
	}

	response := &TrackingResponse{
		OrderNumber:  order.OrderNumber,
		Status:       order.Status,
		OrderType:    order.OrderType,
		CustomerName: order.Customer.Name,
		CreatedAt:    order.CreatedAt.Format("2006-01-02 15:04:05"),
	}

	// Get waypoints for this order
	var waypoints []*entity.OrderWaypoint
	err = u.db.NewSelect().
		Model(&waypoints).
		Where("order_id = ?", order.ID).
		Where("is_deleted = false").
		Order("sequence_number ASC").
		Scan(ctx)
	if err != nil {
		return nil, err
	}

	// Get waypoint logs for history
	var waypointLogs []*entity.WaypointLog
	err = u.db.NewSelect().
		Model(&waypointLogs).
		Relation("OrderWaypoint").
		Where("order_waypoint_id IN (?)", bun.In(getWaypointIDs(waypoints))).
		Order("created_at ASC").
		Scan(ctx)
	if err != nil {
		return nil, err
	}

	// Build waypoint history
	history := make([]WaypointHistory, 0)
	for _, log := range waypointLogs {
		if log.OrderWaypoint != nil {
			history = append(history, WaypointHistory{
				WaypointID:   log.OrderWaypoint.ID.String(),
				LocationName: log.OrderWaypoint.LocationName,
				Address:      log.OrderWaypoint.LocationAddress,
				Type:         log.OrderWaypoint.Type,
				Status:       log.NewStatus,
				OldStatus:    log.OldStatus,
				Notes:        log.Notes,
				ChangedAt:    log.CreatedAt.Format("2006-01-02 15:04:05"),
			})
		}
	}
	response.WaypointHistory = history

	// Get waypoint images (POD/failed) for this order
	// Get trip_waypoints for this order
	var tripWaypoints []*entity.TripWaypoint
	err = u.db.NewSelect().
		Model(&tripWaypoints).
		Where("order_waypoint_id IN (?)", bun.In(getWaypointIDs(waypoints))).
		Where("is_deleted = false").
		Scan(ctx)
	if err == nil && len(tripWaypoints) > 0 {
		// Get waypoint images for these trip_waypoints
		var waypointImages []*entity.WaypointImage
		tripWaypointIDs := make([]string, len(tripWaypoints))
		for i, tw := range tripWaypoints {
			tripWaypointIDs[i] = tw.ID.String()
		}

		err = u.db.NewSelect().
			Model(&waypointImages).
			Where("trip_waypoint_id IN (?)", bun.In(tripWaypointIDs)).
			Where("is_deleted = false").
			Order("created_at ASC").
			Scan(ctx)
		if err == nil {
			images := make([]WaypointImageInfo, 0)
			for _, wi := range waypointImages {
				imageInfo := WaypointImageInfo{
					WaypointImageID: wi.ID.String(),
					Type:            wi.Type,
					Photos:          wi.Images, // Already []string from TEXT[]
					SubmittedAt:     wi.CreatedAt.Format("2006-01-02 15:04:05"),
				}
				if wi.SignatureURL != nil {
					imageInfo.SignatureURL = *wi.SignatureURL
				}

				// Get recipient name from trip_waypoint.received_by or order_waypoint.contact_name
				for _, tw := range tripWaypoints {
					if tw.ID == wi.TripWaypointID {
						if tw.ReceivedBy != nil {
							imageInfo.RecipientName = *tw.ReceivedBy
						}
						break
					}
				}

				images = append(images, imageInfo)
			}
			response.WaypointImages = images
		}
	}

	// Get trip info for driver and vehicle (only if dispatched/in_transit/completed)
	if order.Status == "dispatched" || order.Status == "in_transit" || order.Status == "completed" {
		// Get trip directly (1 order = 1 trip after dispatch removal)
		trip := &entity.Trip{}
		err = u.db.NewSelect().
			Model(trip).
			Relation("Driver").
			Relation("Vehicle").
			Where("order_id = ?", order.ID).
			Where("is_deleted = false").
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

// getWaypointIDs extracts IDs from waypoints
func getWaypointIDs(waypoints []*entity.OrderWaypoint) []string {
	ids := make([]string, len(waypoints))
	for i, wp := range waypoints {
		ids[i] = wp.ID.String()
	}
	return ids
}
