// Package publisher provides event publishing functionality for RabbitMQ.
// This includes notification event publishers for delivery status updates.
package publisher

import (
	"context"
	"encoding/json"

	"github.com/logistics-id/onward-tms/entity"

	"github.com/logistics-id/engine/broker/rabbitmq"
)

// NotificationEvent represents a notification event
type NotificationEvent struct {
	Type      string                 `json:"type"`
	Title     string                 `json:"title"`
	Body      string                 `json:"body"`
	CompanyID string                 `json:"company_id"`
	UserID    string                 `json:"user_id,omitempty"`
	Data      map[string]interface{} `json:"data,omitempty"`
}

// PublishFailedDelivery - Publish failed delivery notification event
func PublishFailedDelivery(ctx context.Context, waypoint *entity.OrderWaypoint, order *entity.Order, trip *entity.Trip) error {
	event := NotificationEvent{
		Type:      "failed_delivery",
		Title:     "Pengiriman Gagal",
		Body:      "Pengiriman untuk order " + order.OrderNumber + " gagal pada " + waypoint.LocationName,
		CompanyID: order.CompanyID.String(),
		UserID:    trip.DriverID.String(),
		Data: map[string]interface{}{
			"order_id":     order.ID.String(),
			"order_number": order.OrderNumber,
			"waypoint_id":  waypoint.ID.String(),
			"trip_id":      trip.ID.String(),
			"trip_number":  trip.TripNumber,
		},
	}

	return publishEvent(ctx, "notification.failed_delivery", event)
}

// PublishDelivered - Publish delivered notification event
func PublishDelivered(ctx context.Context, waypoint *entity.OrderWaypoint, order *entity.Order, trip *entity.Trip, recipientName string) error {
	event := NotificationEvent{
		Type:      "delivered",
		Title:     "Pengiriman Berhasil",
		Body:      "Pengiriman untuk order " + order.OrderNumber + " telah berhasil. Penerima: " + recipientName,
		CompanyID: order.CompanyID.String(),
		UserID:    trip.DriverID.String(),
		Data: map[string]interface{}{
			"order_id":       order.ID.String(),
			"order_number":   order.OrderNumber,
			"waypoint_id":    waypoint.ID.String(),
			"trip_id":        trip.ID.String(),
			"trip_number":    trip.TripNumber,
			"recipient_name": recipientName,
		},
	}

	return publishEvent(ctx, "notification.delivered", event)
}

// Removed: PublishOrderCreated - Not required per current notification requirements
// func PublishOrderCreated(ctx context.Context, order *entity.Order, customer *entity.Customer) error

// Removed: PublishOrderCancelled - Not required per current notification requirements
// func PublishOrderCancelled(ctx context.Context, order *entity.Order, reason string) error

// Removed: PublishTripCompleted - Not required per current notification requirements
// func PublishTripCompleted(ctx context.Context, trip *entity.Trip) error

func publishEvent(ctx context.Context, routingKey string, event NotificationEvent) error {
	// Marshal event to JSON
	body, err := json.Marshal(event)
	if err != nil {
		return err
	}

	// Publish to RabbitMQ
	return rabbitmq.Publish(ctx, routingKey, body)
}
