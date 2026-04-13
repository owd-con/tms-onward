// Package middleware provides HTTP middleware for the TMS application.
// This includes authentication, authorization, and session validation middleware.
package middleware

import (
	"fmt"
	"net/http"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/ds/redis"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/onward-tms/entity"
)

// WithActiveCheck adds CheckUserActive middleware to Restricted middleware
// If permission provided: check JWT + permission + active status
// If no permission: check JWT + active status only
func WithActiveCheck(s *rest.RestServer, permission ...string) []func(http.Handler) http.Handler {
	return append(s.Restricted(permission...), CheckUserActive())
}

// CheckUserActive middleware checks if user and company are still active
// It verifies the session exists in Redis, which ensures the user hasn't been deactivated
// Returns 401 if session is invalid (user deactivated) or Redis is unavailable
//
// Middleware logic:
// 1. Get TMSSessionClaims from context (set by JWT middleware)
// 2. Extract UserID and JTI (JWT ID) from session claims
// 3. Check Redis key: onward-tms:session:{userID}:{jti}
// 4. If key exists → user and company are active, proceed
// 5. If key doesn't exist → user has been deactivated, return 401
func CheckUserActive() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := &rest.Context{
				Context:  r.Context(),
				Request:  r,
				Response: w,
			}

			// Get TMSSessionClaims from context (set by JWT middleware)
			session := common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx.Context)

			if session == nil || session.GetBase() == nil {
				ctx.Error(http.StatusUnauthorized, rest.MsgUnauthorized, "User or company has been deactivated")
				return
			}

			// Extract UserID and JTI from session
			// UserID from TMSSessionClaims, JTI from SessionClaims.ID (via GetBase())
			userID := session.UserID
			jti := session.GetBase().ID

			if userID == "" {
				ctx.Error(http.StatusUnauthorized, rest.MsgUnauthorized, "User or company has been deactivated")
				return
			}

			// Check Redis for active session
			// Key format: onward-tms:session:{userID}:{jti}
			// This ensures the user hasn't been deactivated (which would delete all sessions)
			var redisKey string
			if jti != "" {
				redisKey = fmt.Sprintf("onward-tms:session:%s:%s", userID, jti)
			} else {
				// Fallback to user-level key if JTI is not available
				redisKey = fmt.Sprintf("onward-tms:session:%s", userID)
			}

			// Try to read from Redis
			// If key doesn't exist, user has been deactivated or session is invalid
			var sessionData interface{}
			err := redis.Read(ctx.Context, redisKey, &sessionData)
			if err != nil {
				// Redis error - session might be invalid or Redis is down
				// For security, we treat this as session invalid
				ctx.Error(http.StatusUnauthorized, rest.MsgUnauthorized, "User or company has been deactivated")
				return
			}

			// Session is valid, proceed to next handler
			next.ServeHTTP(w, r)
		})
	}
}
