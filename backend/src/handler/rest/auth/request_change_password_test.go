package auth

import (
	"testing"

	"github.com/logistics-id/engine/validate"
	"github.com/stretchr/testify/assert"
)

func TestChangePasswordRequest_Validate_Success(t *testing.T) {
	req := &changePasswordRequest{
		OldPassword:        "oldpassword",
		NewPassword:        "newpassword123",
		ConfirmNewPassword: "newpassword123",
	}

	v := validate.New().Request(req)

	assert.True(t, v.Valid)
}

func TestChangePasswordRequest_Validate_MissingOldPassword(t *testing.T) {
	req := &changePasswordRequest{
		NewPassword:        "newpassword123",
		ConfirmNewPassword: "newpassword123",
	}

	v := validate.New().Request(req)

	assert.False(t, v.Valid)
	assert.NotEmpty(t, v.GetError("old_password"))
}

func TestChangePasswordRequest_Validate_MissingNewPassword(t *testing.T) {
	req := &changePasswordRequest{
		OldPassword: "oldpassword",
	}

	v := validate.New().Request(req)

	assert.False(t, v.Valid)
	assert.NotEmpty(t, v.GetError("new_password"))
}

func TestChangePasswordRequest_Validate_NewPasswordTooShort(t *testing.T) {
	req := &changePasswordRequest{
		OldPassword:        "oldpassword",
		NewPassword:        "short",
		ConfirmNewPassword: "short",
	}

	v := validate.New().Request(req)

	assert.False(t, v.Valid)
	assert.NotEmpty(t, v.GetError("new_password"))
}

func TestChangePasswordRequest_Validate_PasswordMismatch(t *testing.T) {
	req := &changePasswordRequest{
		OldPassword:        "oldpassword",
		NewPassword:        "newpassword123",
		ConfirmNewPassword: "password456",
	}

	v := validate.New().Request(req)

	assert.False(t, v.Valid)
	assert.NotEmpty(t, v.GetError("confirm_new_password"))
}

func TestChangePasswordRequest_Messages(t *testing.T) {
	req := &changePasswordRequest{}

	messages := req.Messages()

	assert.NotNil(t, messages)
}
