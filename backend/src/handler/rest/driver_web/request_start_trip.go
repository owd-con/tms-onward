package driver_web

import (
	"context"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
)

type startTripRequest struct {
	TripID string `param:"id" valid:"required"`

	trip          *entity.Trip
	tripWaypoints []entity.TripWaypoint

	ctx     context.Context
	uc      *usecase.Factory
	session *entity.TMSSessionClaims
}

func (r *startTripRequest) Validate() *validate.Response {
	v := validate.NewResponse()

	// Validate session exists
	if r.session == nil {
		v.SetError("session.invalid", "This session not found.")
	}

	// Validate user_id exists (driver ID)
	if r.session != nil && r.session.UserID == "" {
		v.SetError("user.invalid", "This user is not associated with a driver account.")
	}

	// Validate trip exists
	trip, err := r.uc.Trip.GetByID(r.TripID)
	if err != nil {
		v.SetError("id.invalid", "Trip not found or invalid.")
	} else {
		r.trip = trip
	}

	if r.trip != nil {
		if r.trip.Status != "dispatched" {
			v.SetError("id.invalid", "Trip must be in Dispatched status to be started.")
		}

		// Validate: trip must belong to the authenticated driver
		// For driver web, session.UserID is the Driver's user_id
		if r.trip.Driver != nil {
			if r.trip.Driver.UserID.String() != r.session.UserID {
				v.SetError("id.invalid", "This trip is not assigned to you.")
			}
		}

		if r.trip.User != nil {
			if r.trip.User.ID.String() != r.session.UserID {
				v.SetError("id.invalid", "This trip is not assigned to you.")
			}
		}
	}

	return v
}

func (r *startTripRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *startTripRequest) execute() (*rest.ResponseBody, error) {
	err := r.uc.Trip.Start(r.trip)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseMessage("Trip started successfully"), nil
}

func (r *startTripRequest) with(ctx context.Context, uc *usecase.Factory) *startTripRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}
