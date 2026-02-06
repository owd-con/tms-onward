package src

import (
	"log"

	"github.com/logistics-id/onward-tms/src/event/subscriber"
)

// RegisterSubscriber registers all event subscribers
func RegisterSubscriber() {
	// Register notification subscribers
	if err := subscriber.RegisterAllSubscribers(); err != nil {
		log.Printf("Failed to register notification subscribers: %v", err)
	}

	// Register subscribers for order events
	// rabbitmq.Subscribe("order.created", handleOrderCreated)
	// rabbitmq.Subscribe("order.updated", handleOrderUpdated)
	// rabbitmq.Subscribe("order.cancelled", handleOrderCancelled)

	// Register subscribers for trip events
	// rabbitmq.Subscribe("trip.started", handleTripStarted)
	// rabbitmq.Subscribe("trip.completed", handleTripCompleted)
	// rabbitmq.Subscribe("trip.cancelled", handleTripCancelled)

	// Register subscribers for dispatch events
	// rabbitmq.Subscribe("dispatch.created", handleDispatchCreated)
	// rabbitmq.Subscribe("dispatch.updated", handleDispatchUpdated)

	// Register subscribers for waypoint events
	// rabbitmq.Subscribe("waypoint.completed", handleWaypointCompleted)
	// rabbitmq.Subscribe("waypoint.failed", handleWaypointFailed)

	// Register subscribers for POD events
	// rabbitmq.Subscribe("pod.submitted", handlePODSubmitted)
}
