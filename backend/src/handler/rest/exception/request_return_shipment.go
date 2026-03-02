package exception

import (
	"context"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
)

type returnShipmentRequest struct {
	ID           string `json:"-" valid:"required|uuid"`        // From URL parameter
	ReturnedNote string `json:"returned_note" valid:"required"` // required - alasan barang dikembalikan ke origin

	shipment *entity.Shipment

	uc      *usecase.Factory
	ctx     context.Context
	session *entity.TMSSessionClaims
}

func (r *returnShipmentRequest) Validate() *validate.Response {
	v := validate.NewResponse()
	var err error

	// Fetch shipment
	if r.ID != "" {
		r.shipment, err = r.uc.Shipment.GetByID(r.ID)
		if err != nil {
			v.SetError("id.invalid", "Shipment not found.")
		}
	}

	// Validate shipment status must be "failed"
	if r.shipment != nil && r.shipment.Status != "failed" {
		v.SetError("id.invalid", "Shipment must be in failed status to be marked as returned.")
	}

	return v
}

func (r *returnShipmentRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *returnShipmentRequest) execute() (*rest.ResponseBody, error) {
	// Update shipment status and returned_note
	// Note: shipment sudah divalidasi di Validate(), pasti tidak nil
	err := r.uc.Exception.ReturnShipment(r.ctx, r.shipment, r.ReturnedNote, r.session.DisplayName)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(r.shipment), nil
}

func (r *returnShipmentRequest) with(ctx context.Context, uc *usecase.Factory) *returnShipmentRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}
