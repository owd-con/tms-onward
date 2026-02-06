package auth

import (
	"testing"

	"github.com/logistics-id/engine/validate"
	"github.com/stretchr/testify/assert"
)

func TestLoginRequest_Validate_Success(t *testing.T) {
	req := &loginRequest{
		Email:    "test@example.com",
		Password: "password123",
	}

	v := validate.New().Request(req)

	assert.True(t, v.Valid)
}

func TestLoginRequest_Validate_MissingEmail(t *testing.T) {
	req := &loginRequest{
		Password: "password123",
	}

	v := validate.New().Request(req)

	assert.False(t, v.Valid)
	assert.NotEmpty(t, v.GetError("email"))
}

func TestLoginRequest_Validate_MissingPassword(t *testing.T) {
	req := &loginRequest{
		Email: "test@example.com",
	}

	v := validate.New().Request(req)

	assert.False(t, v.Valid)
	assert.NotEmpty(t, v.GetError("password"))
}

func TestLoginRequest_Validate_InvalidEmailFormat(t *testing.T) {
	req := &loginRequest{
		Email:    "invalid-email",
		Password: "password123",
	}

	v := validate.New().Request(req)

	assert.False(t, v.Valid)
	assert.NotEmpty(t, v.GetError("email"))
}

func TestLoginRequest_Messages(t *testing.T) {
	req := &loginRequest{}

	messages := req.Messages()

	assert.NotNil(t, messages)
}
