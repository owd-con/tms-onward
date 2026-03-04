// Package publisher provides event publishing for RabbitMQ.
package publisher

import (
	"context"
	"time"

	"github.com/logistics-id/engine/broker/rabbitmq"
	"github.com/logistics-id/onward-tms/entity"
)

// NotificationEvent represents a notification event payload
type NotificationEvent struct {
	Type       string                 `json:"type"`
	Title      string                 `json:"title"`
	Body       string                 `json:"body"`
	CompanyID  string                 `json:"company_id"`
	UserID     string                 `json:"user_id,omitempty"`
	Data       map[string]interface{} `json:"data,omitempty"`
	PublishedAt time.Time              `json:"published_at"`
}

// DeliveryFailed publishes failed delivery notification event
func DeliveryFailed(ctx context.Context, tripWaypoint *entity.TripWaypoint, order *entity.Order, trip *entity.Trip, reason string) {
	rabbitmq.Publish(ctx, "notification.failed_delivery", &NotificationEvent{
		Type:      "delivery_failed",
		Title:     "Pengiriman Gagal",
		Body:      reason,
		CompanyID: trip.CompanyID.String(),
		Data: map[string]interface{}{
			"order_id":     order.ID.String(),
			"order_number": order.OrderNumber,
			"trip_id":      trip.ID.String(),
			"trip_number":  trip.TripNumber,
			"waypoint_id":  tripWaypoint.ID.String(),
			"reason":       reason,
		},
		PublishedAt: time.Now(),
	})
}

// DeliveryCompleted publishes delivery success notification event
func DeliveryCompleted(ctx context.Context, tripWaypoint *entity.TripWaypoint, order *entity.Order, trip *entity.Trip, recipientName string) {
	rabbitmq.Publish(ctx, "notification.delivered", &NotificationEvent{
		Type:      "delivery_completed",
		Title:     "Pengiriman Berhasil",
		Body:      "Pengiriman telah berhasil diselesaikan",
		CompanyID: trip.CompanyID.String(),
		Data: map[string]interface{}{
			"order_id":       order.ID.String(),
			"order_number":   order.OrderNumber,
			"trip_id":        trip.ID.String(),
			"trip_number":    trip.TripNumber,
			"waypoint_id":    tripWaypoint.ID.String(),
			"recipient_name": recipientName,
		},
		PublishedAt: time.Now(),
	})
}
