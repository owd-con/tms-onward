// Package subscriber provides event subscription and handling for RabbitMQ.
package subscriber

import (
	"context"
	"encoding/json"
	"log"

	"github.com/google/uuid"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/event/publisher"
	"github.com/logistics-id/onward-tms/src/service/email"
	"github.com/logistics-id/onward-tms/src/usecase"

	amqp "github.com/rabbitmq/amqp091-go"
)

// SubscribeDeliveryFailed handles failed delivery notification events
func SubscribeDeliveryFailed(event interface{}, msg amqp.Delivery) error {
	ctx := context.Background()
	uc := usecase.NewFactory().WithContext(ctx)

	// Parse event to NotificationEvent
	eventJSON, err := json.Marshal(event)
	if err != nil {
		log.Printf("[Notification] Failed to marshal event: %v", err)
		return msg.Ack(false)
	}

	var req publisher.NotificationEvent
	if err := json.Unmarshal(eventJSON, &req); err != nil {
		log.Printf("[Notification] Failed to unmarshal event: %v", err)
		return msg.Ack(false)
	}

	// 1. Save notification to database
	notification := &entity.Notification{
		CompanyID: uuid.MustParse(req.CompanyID),
		Title:     req.Title,
		Body:      req.Body,
		Type:      req.Type,
		Data:      "", // will be set from JSON
	}

	// Parse data for storage
	if req.Data != nil {
		dataJSON, _ := json.Marshal(req.Data)
		notification.Data = string(dataJSON)
	}

	if req.UserID != "" {
		parsedID := uuid.MustParse(req.UserID)
		notification.UserID = &parsedID
	}

	// Save using notification usecase
	if err := uc.Notification.Create(notification); err != nil {
		log.Printf("[Notification] Failed to save: %v", err)
		return msg.Ack(false)
	}

	log.Printf("[Notification] Saved: Type=%s, Title=%s", req.Type, req.Title)

	// 2. Send email for failed delivery
	if err := processFailedDeliveryEmail(ctx, uc, &req); err != nil {
		log.Printf("[Notification] Failed to send email: %v", err)
		// Don't fail notification for email errors
	}

	return msg.Ack(true)
}

// SubscribeDeliveryCompleted handles delivery success notification events
func SubscribeDeliveryCompleted(event interface{}, msg amqp.Delivery) error {
	ctx := context.Background()
	uc := usecase.NewFactory().WithContext(ctx)

	// Parse event to NotificationEvent
	eventJSON, err := json.Marshal(event)
	if err != nil {
		log.Printf("[Notification] Failed to marshal event: %v", err)
		return msg.Ack(false)
	}

	var req publisher.NotificationEvent
	if err := json.Unmarshal(eventJSON, &req); err != nil {
		log.Printf("[Notification] Failed to unmarshal event: %v", err)
		return msg.Ack(false)
	}

	// 1. Save notification to database
	notification := &entity.Notification{
		CompanyID: uuid.MustParse(req.CompanyID),
		Title:     req.Title,
		Body:      req.Body,
		Type:      req.Type,
		Data:      "", // will be set from JSON
	}

	// Parse data for storage
	if req.Data != nil {
		dataJSON, _ := json.Marshal(req.Data)
		notification.Data = string(dataJSON)
	}

	if req.UserID != "" {
		parsedID := uuid.MustParse(req.UserID)
		notification.UserID = &parsedID
	}

	// Save using notification usecase
	if err := uc.Notification.Create(notification); err != nil {
		log.Printf("[Notification] Failed to save: %v", err)
		return msg.Ack(false)
	}

	log.Printf("[Notification] Saved: Type=%s, Title=%s", req.Type, req.Title)

	// 2. Send email for delivery success
	if err := processDeliveryCompletedEmail(ctx, uc, &req); err != nil {
		log.Printf("[Notification] Failed to send email: %v", err)
		// Don't fail notification for email errors
	}

	return msg.Ack(true)
}

// processFailedDeliveryEmail sends email for failed delivery events
func processFailedDeliveryEmail(ctx context.Context, uc *usecase.Factory, req *publisher.NotificationEvent) error {
	// Extract order_id from data
	orderID, _ := req.Data["order_id"].(string)
	if orderID == "" {
		return nil
	}

	// Fetch order to get customer email
	order, err := uc.Order.GetByID(orderID)
	if err != nil {
		return err
	}

	// Fetch waypoint to get location name
	waypointID, _ := req.Data["waypoint_id"].(string)
	waypoint, err := uc.Trip.GetTripWaypointByID(waypointID)
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
	emailService := email.NewEmailService()
	emailData := &email.FailedDeliveryData{
		OrderNumber:  req.Data["order_number"].(string),
		TripNumber:   req.Data["trip_number"].(string),
		LocationName: waypoint.LocationName,
		Address:      waypoint.Address,
		Timestamp:    req.PublishedAt.Format("2006-01-02 15:04:05"),
		Notes:        req.Body,
		DashboardURL: "https://tms-onward.com/dashboard",
		Year:         req.PublishedAt.Year(),
	}

	return emailService.SendFailedDeliveryToUser(ctx, customer.Email, "id", emailData)
}

// processDeliveryCompletedEmail sends email for delivery success events
func processDeliveryCompletedEmail(ctx context.Context, uc *usecase.Factory, req *publisher.NotificationEvent) error {
	// Extract order_id from data
	orderID, _ := req.Data["order_id"].(string)
	if orderID == "" {
		return nil
	}

	// Fetch order to get customer email
	order, err := uc.Order.GetByID(orderID)
	if err != nil {
		return err
	}

	// Fetch waypoint to get location name
	waypointID, _ := req.Data["waypoint_id"].(string)
	waypoint, err := uc.Trip.GetTripWaypointByID(waypointID)
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
	emailService := email.NewEmailService()
	recipientName, _ := req.Data["recipient_name"].(string)
	emailData := &email.DeliverySuccessData{
		OrderNumber:   req.Data["order_number"].(string),
		TripNumber:    req.Data["trip_number"].(string),
		LocationName:  waypoint.LocationName,
		Address:       waypoint.Address,
		RecipientName: recipientName,
		Timestamp:     req.PublishedAt.Format("2006-01-02 15:04:05"),
		DashboardURL:  "https://tms-onward.com/dashboard",
		Year:          req.PublishedAt.Year(),
	}

	return emailService.SendDeliverySuccessToUser(ctx, customer.Email, "id", emailData)
}

