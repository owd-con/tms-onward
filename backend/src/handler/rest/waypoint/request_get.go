package waypoint

import (
	"context"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
)

type getRequest struct {
	// For /waypoint/logs
	OrderID        string `query:"order_id"`
	TripWaypointID string `query:"trip_waypoint_id"`

	// For /waypoint/images
	TripID string `query:"trip_id"`

	uc      *usecase.Factory
	ctx     context.Context
	session *entity.TMSSessionClaims
}

func (r *getRequest) listLogs() (*rest.ResponseBody, error) {
	var data any
	var err error

	// Choose query method based on filter
	if r.TripWaypointID != "" {
		data, err = r.uc.Waypoint.GetLogsByTripWaypointID(r.TripWaypointID)
	} else {
		data, err = r.uc.Waypoint.GetLogsByOrderID(r.OrderID)
	}

	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(data), nil
}

func (r *getRequest) listImages() (*rest.ResponseBody, error) {
	var data any
	var err error

	// Choose query method based on filter
	if r.TripWaypointID != "" {
		data, err = r.uc.WaypointImage.GetByTripWaypointID(r.TripWaypointID)
	} else {
		data, err = r.uc.WaypointImage.GetByTripID(r.TripID)
	}

	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(data), nil
}

func (r *getRequest) with(ctx context.Context, uc *usecase.Factory) *getRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}
