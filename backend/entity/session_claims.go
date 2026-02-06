package entity

import (
	"time"

	"github.com/logistics-id/engine/common"
)

// Session represents authentication session
type Session struct {
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
	ExpiresAt    time.Time `json:"expires_at,omitempty"`
	User         *User     `json:"user"`
}

// TMSSessionClaims represents the JWT claims for TMS service
type TMSSessionClaims struct {
	*common.SessionClaims
	CompanyID string `json:"company_id,omitempty"`
	UserID    string `json:"user_id,omitempty"`
	Role      string `json:"role,omitempty"`
}

// GetBase — untuk kompatibilitas GetContextSession
func (t *TMSSessionClaims) GetBase() *common.SessionClaims {
	return t.SessionClaims
}
