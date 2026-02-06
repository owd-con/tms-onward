package i18n

import (
	"context"

	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/transport/rest"
)

type getTranslationsRequest struct {
	uc      *usecase.Factory
	ctx     context.Context
	lang    string
}

func (r *getTranslationsRequest) get() (*rest.ResponseBody, error) {
	translations, err := r.uc.I18n.GetTranslations(r.lang)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(translations), nil
}

func (r *getTranslationsRequest) with(ctx context.Context, uc *usecase.Factory) *getTranslationsRequest {
	r.ctx = ctx
	r.uc = uc
	return r
}
