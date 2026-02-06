package upload

import (
	"context"
	"strings"

	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
)

// presignedURLRequest handles POST /upload/presigned-url
// Generate presigned URL untuk upload file langsung ke S3
type presignedURLRequest struct {
	Filename    string `json:"filename" valid:"required"`    // Nama file (misal: "signature.jpg")
	ContentType string `json:"contentType" valid:"required"` // Content type (misal: "image/jpeg")

	uc      *usecase.Factory
	ctx     context.Context
	session any // Could be typed to *entity.TMSSessionClaims if needed
}

func (r *presignedURLRequest) Validate() *validate.Response {
	v := validate.NewResponse()

	// Validate filename is not empty
	if r.Filename == "" {
		v.SetError("filename.required", "Filename is required.")
	}

	// Validate contentType is not empty
	if r.ContentType == "" {
		v.SetError("contentType.required", "Content type is required.")
	}

	// Validate contentType is image/* (hanya izinkan image)
	if r.ContentType != "" && !strings.HasPrefix(r.ContentType, "image/") {
		v.SetError("contentType.invalid", "Only image content types are allowed.")
	}

	return v
}

func (r *presignedURLRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *presignedURLRequest) execute() (*rest.ResponseBody, error) {
	// Generate presigned URL menggunakan Upload usecase
	response, err := r.uc.Upload.GeneratePresignedPutURL(r.Filename, r.ContentType)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(response), nil
}

func (r *presignedURLRequest) with(uc *usecase.Factory) *presignedURLRequest {
	r.uc = uc
	return r
}
