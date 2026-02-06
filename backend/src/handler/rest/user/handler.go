// Package user provides HTTP handlers for user management operations.
// This includes user CRUD operations, activation/deactivation, and profile management.
package user

import (
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/onward-tms/src/middleware"
	"github.com/logistics-id/onward-tms/src/usecase"
)

type handler struct {
	uc *usecase.UserUsecase
}

func RegisterHandler(s *rest.RestServer) {
	h := &handler{uc: usecase.NewUserUsecase()}

	s.GET("/user", h.list, middleware.WithActiveCheck(s))
	s.POST("/user", h.create, middleware.WithActiveCheck(s))
	s.GET("/user/{id}", h.show, middleware.WithActiveCheck(s))
	s.PUT("/user/{id}", h.update, middleware.WithActiveCheck(s))
	s.DELETE("/user/{id}", h.delete, middleware.WithActiveCheck(s))
	s.PUT("/user/{id}/activate", h.activate, middleware.WithActiveCheck(s))
	s.PUT("/user/{id}/deactivate", h.deactivate, middleware.WithActiveCheck(s))
}

// list handles GET /user
// @Summary List users
// @Description Get paginated list of users
// @Tags user
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /user [get]
func (h *handler) list(ctx *rest.Context) (err error) {
	var req getRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.list()
	}

	return ctx.Respond(res, err)
}

// show handles GET /user/{id}
// @Summary Get user by ID
// @Description Get detailed information about a specific user
// @Tags user
// @Accept json
// @Produce json
// @Param id path string true "User ID"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /user/{id} [get]
func (h *handler) show(ctx *rest.Context) (err error) {
	var req getRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.detail()
	}
	return ctx.Respond(res, err)
}

// create handles POST /user
// @Summary Create new user
// @Description Create a new user
// @Tags user
// @Accept json
// @Produce json
// @Param request body user.createRequest true "Create user request"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /user [post]
func (h *handler) create(ctx *rest.Context) (err error) {
	var req createRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}
	return ctx.Respond(res, err)
}

// update handles PUT /user/{id}
// @Summary Update user by ID
// @Description Update user data. If user role is "driver", name and phone will be synced to associated driver automatically. Driver role cannot be changed. Password update should be done from user page.
// @Tags user
// @Accept json
// @Produce json
// @Param id path string true "User ID"
// @Param request body user.updateRequest true "Update user request"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /user/{id} [put]
func (h *handler) update(ctx *rest.Context) (err error) {
	var res *rest.ResponseBody
	var req updateRequest

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}

	return ctx.Respond(res, err)
}

// delete handles DELETE /user/{id}
// @Summary Delete user by ID
// @Description Soft delete user. If user role is "driver", associated driver will also be soft deleted (cascade).
// @Tags user
// @Accept json
// @Produce json
// @Param id path string true "User ID"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /user/{id} [delete]
func (h *handler) delete(ctx *rest.Context) (err error) {
	var res *rest.ResponseBody
	var req deleteRequest

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}
	return ctx.Respond(res, err)
}

// activate handles PUT /user/{id}/activate
// @Summary Activate user
// @Description Activate a deactivated user
// @Tags user
// @Accept json
// @Produce json
// @Param id path string true "User ID"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /user/{id}/activate [put]
func (h *handler) activate(ctx *rest.Context) (err error) {
	var res *rest.ResponseBody
	var req activateRequest

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}
	return ctx.Respond(res, err)
}

// deactivate handles PUT /user/{id}/deactivate
// @Summary Deactivate user
// @Description Deactivate a user (soft delete)
// @Tags user
// @Accept json
// @Produce json
// @Param id path string true "User ID"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /user/{id}/deactivate [put]
func (h *handler) deactivate(ctx *rest.Context) (err error) {
	var res *rest.ResponseBody
	var req deactivateRequest

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}

	return ctx.Respond(res, err)
}
