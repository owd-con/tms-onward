package entity

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// TripWaypointReport represents denormalized report data in MongoDB
type TripWaypointReport struct {
	ID primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`

	// Order info
	OrderNumber  string `bson:"order_number" json:"order_number"`
	CustomerName string `bson:"customer_name" json:"customer_name"`

	// Trip info
	TripCode           string `bson:"trip_code" json:"trip_code"`
	TripID             string `bson:"trip_id" json:"trip_id"`
	DriverName         string `bson:"driver_name" json:"driver_name"`
	DriverID           string `bson:"driver_id" json:"driver_id"`
	VehiclePlateNumber string `bson:"vehicle_plate_number" json:"vehicle_plate_number"`
	VehicleID          string `bson:"vehicle_id" json:"vehicle_id"`

	// Shipment info
	ShipmentNumber string `bson:"shipment_number" json:"shipment_number"`
	ShipmentID     string `bson:"shipment_id" json:"shipment_id"`

	// Waypoint info
	WaypointType   string     `bson:"waypoint_type" json:"waypoint_type"`
	ShipmentStatus string     `bson:"shipment_status" json:"shipment_status"`
	LocationName   string     `bson:"location_name" json:"location_name"`
	Address        string     `bson:"address" json:"address"`
	ReceivedBy     *string    `bson:"received_by,omitempty" json:"received_by,omitempty"`
	FailedReason   *string    `bson:"failed_reason,omitempty" json:"failed_reason,omitempty"`
	CompletedAt    *time.Time `bson:"completed_at,omitempty" json:"completed_at,omitempty"`

	// Metadata
	CompanyID string    `bson:"company_id" json:"company_id"`
	UpdatedAt time.Time `bson:"updated_at" json:"updated_at"`
}
