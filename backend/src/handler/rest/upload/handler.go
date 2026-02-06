// Package upload handles file upload operations using S3 presigned URLs.
package upload

import (
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/onward-tms/src/middleware"
	"github.com/logistics-id/onward-tms/src/usecase"
)

type handler struct {
	uc *usecase.Factory
}

// RegisterHandler registers REST handlers for file upload operations.
func RegisterHandler(s *rest.RestServer, factory *usecase.Factory) {
	h := &handler{uc: factory}

	// Upload routes
	s.POST("/upload/presigned-url", h.getPresignedURL, middleware.WithActiveCheck(s))
}

// getPresignedUrl handles POST /upload/presigned-url
// @Summary Generate presigned URL for S3 upload
// @Description Generate a presigned URL untuk upload file langsung ke S3 tanpa melalui backend
// @Tags upload
// @Accept json
// @Produce json
// @Param request body upload.presignedURLRequest true "Presigned URL request"
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /upload/presigned-url [post]
func (h *handler) getPresignedURL(ctx *rest.Context) (err error) {
	var req presignedURLRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(h.uc)); err == nil {
		res, err = req.execute()
	}
	return ctx.Respond(res, err)
}
