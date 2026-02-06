// Package auth provides HTTP handlers for authentication operations.
// This includes login, registration, logout, and password management.
package auth

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/middleware"
	"github.com/logistics-id/onward-tms/src/usecase"
)

type handler struct {
	uc *usecase.AuthUsecase
}

// login handles POST /auth/login
// @Summary Login
// @Description Authenticate user and return tokens
// @Tags auth
// @Accept json
// @Produce json
// @Param request body loginRequest true "Login request"
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.ResponseBody
// @Router /auth/login [post]
func (h *handler) login(ctx *rest.Context) (err error) {
	var req loginRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}

	return ctx.Respond(res, err)
}

// signup handles POST /auth/register
// @Summary Register
// @Description Register new company and admin user
// @Tags auth
// @Accept json
// @Produce json
// @Param request body signupRequest true "Signup request"
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.ResponseBody
// @Router /auth/register [post]
func (h *handler) signup(ctx *rest.Context) (err error) {
	var req signupRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}

	return ctx.Respond(res, err)
}

// logout handles POST /auth/logout
// @Summary Logout
// @Description Invalidate current session
// @Tags auth
// @Accept json
// @Produce json
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.ResponseBody
// @Router /auth/logout [post]
func (h *handler) logout(ctx *rest.Context) (err error) {
	// Get session from context (set by JWT middleware)
	session := common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	if session == nil || session.GetBase() == nil || session.UserID == "" {
		return ctx.Error(http.StatusUnauthorized, rest.MsgUnauthorized, "user not authenticated")
	}

	// Get JTI from session
	jti := session.GetBase().ID
	if jti == "" {
		return ctx.Error(http.StatusInternalServerError, rest.MsgInternalError, "session ID not found")
	}

	userID, err := uuid.Parse(session.UserID)
	if err != nil {
		return ctx.Error(http.StatusBadRequest, rest.MsgBadRequest, "invalid user id")
	}

	// Logout user with context and JTI
	if err = h.uc.WithContext(ctx.Context).Logout(userID, jti); err != nil {
		return ctx.Error(http.StatusInternalServerError, rest.MsgInternalError, "failed to logout")
	}

	return ctx.Respond(rest.NewResponseMessage("logged out successfully"), nil)
}

// changePassword handles PUT /auth/password
// @Summary Change Password
// @Description Change user password
// @Tags auth
// @Accept json
// @Produce json
// @Param request body changePasswordRequest true "Change password request"
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.ResponseBody
// @Router /auth/password [put]
func (h *handler) changePassword(ctx *rest.Context) (err error) {
	var req changePasswordRequest
	var res *rest.ResponseBody

	// Get user ID from context (set by JWT middleware)
	userID := ctx.Query("user_id")
	if userID == "" {
		return ctx.Error(http.StatusUnauthorized, rest.MsgUnauthorized, "user not authenticated")
	}

	if err = ctx.Bind(req.with(ctx, h.uc, userID)); err == nil {
		res, err = req.execute()
	}

	return ctx.Respond(res, err)
}

// RegisterHandler registers auth routes
func RegisterHandler(s *rest.RestServer) {
	h := &handler{
		uc: usecase.NewAuthUsecase(),
	}

	// Public routes (no authentication required)
	s.POST("/auth/login", h.login, nil)
	s.POST("/auth/register", h.signup, nil)

	// Protected routes (authentication required)
	s.POST("/auth/logout", h.logout, middleware.WithActiveCheck(s))
	s.PUT("/auth/password", h.changePassword, middleware.WithActiveCheck(s))
}
