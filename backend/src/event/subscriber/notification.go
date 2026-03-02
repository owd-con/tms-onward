// Package subscriber provides event subscription and handling for RabbitMQ.
// This includes notification event subscribers that process delivery events and send emails.
package subscriber

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/google/uuid"
	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/service/email"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/broker/rabbitmq"
)

// NotificationSubscriber handles notification events from RabbitMQ
type NotificationSubscriber struct {
	notificationUsecase *usecase.NotificationUsecase
	uc                  *usecase.Factory
	emailService        email.Service
}

// NewNotificationSubscriber creates a new notification subscriber
func NewNotificationSubscriber() *NotificationSubscriber {
	return &NotificationSubscriber{
		notificationUsecase: usecase.NewNotificationUsecase(),
		uc:                  usecase.NewFactory(),
		emailService:        email.NewEmailService(),
	}
}

// NotificationEvent represents a notification event from RabbitMQ
type NotificationEvent struct {
	Type      string                 `json:"type"`
	Title     string                 `json:"title"`
	Body      string                 `json:"body"`
	CompanyID string                 `json:"company_id"`
	UserID    string                 `json:"user_id,omitempty"`
	Data      map[string]interface{} `json:"data,omitempty"`
}

// NotificationEventData represents the data payload in notification events
type NotificationEventData struct {
	OrderID       string `json:"order_id"`
	OrderNumber   string `json:"order_number"`
	CustomerID    string `json:"customer_id,omitempty"`
	CustomerName  string `json:"customer_name,omitempty"`
	WaypointID    string `json:"waypoint_id,omitempty"`
	TripID        string `json:"trip_id,omitempty"`
	TripNumber    string `json:"trip_number,omitempty"`
	RecipientName string `json:"recipient_name,omitempty"`
	Reason        string `json:"reason,omitempty"`
}

// SubscribeFailedDelivery subscribes to failed delivery events
func (s *NotificationSubscriber) SubscribeFailedDelivery() error {
	return rabbitmq.Subscribe("notification.failed_delivery", s.handleFailedDelivery)
}

// SubscribeDelivered subscribes to delivered events
func (s *NotificationSubscriber) SubscribeDelivered() error {
	return rabbitmq.Subscribe("notification.delivered", s.handleDelivered)
}

// Removed: SubscribeOrderCreated - Not required per current notification requirements
// Removed: SubscribeOrderCancelled - Not required per current notification requirements
// Removed: SubscribeTripCompleted - Not required per current notification requirements

// handleFailedDelivery processes failed delivery notification event
func (s *NotificationSubscriber) handleFailedDelivery(event NotificationEvent, delivery amqp.Delivery) error {
	return s.handleNotificationEvent(event, delivery, s.processFailedDelivery)
}

// handleDelivered processes delivered notification event
func (s *NotificationSubscriber) handleDelivered(event NotificationEvent, delivery amqp.Delivery) error {
	return s.handleNotificationEvent(event, delivery, s.processDelivered)
}

// Removed: handleOrderCreated - Not required per current notification requirements
// Removed: handleOrderCancelled - Not required per current notification requirements
// Removed: handleTripCompleted - Not required per current notification requirements

// handleNotificationEvent is the generic handler that saves notification and sends email
func (s *NotificationSubscriber) handleNotificationEvent(event NotificationEvent, delivery amqp.Delivery, emailProcessor func(context.Context, *usecase.Factory, *NotificationEvent, *NotificationEventData, string) error) error {
	ctx := context.Background()
	uc := s.uc.WithContext(ctx)

	// Parse data JSON from event
	var eventData NotificationEventData
	if event.Data != nil {
		dataJSON, _ := json.Marshal(event.Data)
		if err := json.Unmarshal(dataJSON, &eventData); err != nil {
			log.Printf("Failed to parse event data: %v", err)
			return err
		}
	}

	// Create notification record
	notification := &entity.Notification{
		CompanyID: uuid.MustParse(event.CompanyID),
		Title:     event.Title,
		Body:      event.Body,
		Type:      event.Type,
	}

	// Parse data JSON for storage
	dataJSON, _ := json.Marshal(event.Data)
	notification.Data = string(dataJSON)

	// Add recipient user if specified
	if event.UserID != "" {
		notification.UserID = uuid.MustParse(event.UserID)
	}

	// Save notification to database
	if err := s.notificationUsecase.Create(notification); err != nil {
		log.Printf("Failed to save notification: %v", err)
		return err
	}

	log.Printf("[Notification] Saved: Type=%s, Title=%s, UserID=%s", event.Type, event.Title, event.UserID)

	// Fetch company for language settings
	company, err := uc.Company.GetByID(event.CompanyID)
	if err != nil {
		log.Printf("Failed to fetch company %s: %v", event.CompanyID, err)
		// Continue with default language even if company fetch fails
		company = &entity.Company{Language: "id"}
	}

	// Send email - processor handles nil check
	if emailProcessor != nil {
		if err := emailProcessor(ctx, uc, &event, &eventData, company.Language); err != nil {
			log.Printf("Failed to send email notification: %v", err)
			// Don't return error for email failures - notification is already saved
		}
	}

	return nil
}

// processFailedDelivery sends email for failed delivery events
func (s *NotificationSubscriber) processFailedDelivery(ctx context.Context, uc *usecase.Factory, event *NotificationEvent, data *NotificationEventData, language string) error {
	// Fetch order to get customer email
	order, err := uc.Order.GetByID(data.OrderID)
	if err != nil {
		return err
	}

	// Fetch waypoint to get location name
	waypoint, err := uc.Trip.GetTripWaypointByID(data.WaypointID)
	if err != nil {
		return err
	}

	// Get customer email
	customer, err := uc.Customer.GetByID(order.CustomerID.String())
	if err != nil {
		return err
	}

	if customer.Email == "" {
		log.Printf("[FailedDelivery] No email for customer %s", order.CustomerID.String())
		return nil
	}

	// Prepare email data
	emailData := &email.FailedDeliveryData{
		OrderNumber:  data.OrderNumber,
		TripNumber:   data.TripNumber,
		LocationName: waypoint.LocationName,
		Address:      waypoint.Address,
		Timestamp:    time.Now().Format("2006-01-02 15:04:05"),
		Notes:        "Delivery failed at this location. Please check with the driver.",
		DashboardURL: "https://tms-onward.com/dashboard",
		Year:         time.Now().Year(),
	}

	return s.emailService.SendFailedDeliveryToUser(ctx, customer.Email, language, emailData)
}

// processDelivered sends email for delivery success events
func (s *NotificationSubscriber) processDelivered(ctx context.Context, uc *usecase.Factory, event *NotificationEvent, data *NotificationEventData, language string) error {
	// Fetch order to get customer email
	order, err := uc.Order.GetByID(data.OrderID)
	if err != nil {
		return err
	}

	// Fetch waypoint to get location name
	waypoint, err := uc.Trip.GetTripWaypointByID(data.WaypointID)
	if err != nil {
		return err
	}

	// Get customer email
	customer, err := uc.Customer.GetByID(order.CustomerID.String())
	if err != nil {
		return err
	}

	if customer.Email == "" {
		log.Printf("[Delivered] No email for customer %s", order.CustomerID.String())
		return nil
	}

	// Prepare email data
	emailData := &email.DeliverySuccessData{
		OrderNumber:   data.OrderNumber,
		TripNumber:    data.TripNumber,
		LocationName:  waypoint.LocationName,
		Address:       waypoint.Address,
		RecipientName: data.RecipientName,
		Timestamp:     time.Now().Format("2006-01-02 15:04:05"),
		DashboardURL:  "https://tms-onward.com/dashboard",
		Year:          time.Now().Year(),
	}

	return s.emailService.SendDeliverySuccessToUser(ctx, customer.Email, language, emailData)
}

// Removed: processOrderCreated - Not required per current notification requirements

// Removed: processOrderCancelled - Not required per current notification requirements

// Removed: processTripCompleted - Not required per current notification requirements

// RegisterAllSubscribers registers all notification subscribers
func RegisterAllSubscribers() error {
	subscriber := NewNotificationSubscriber()

	// Subscribe to required notification events only
	if err := subscriber.SubscribeFailedDelivery(); err != nil {
		return err
	}

	if err := subscriber.SubscribeDelivered(); err != nil {
		return err
	}

	// Removed: OrderCreated, OrderCancelled, TripCompleted subscriptions - not required

	return nil
}
