package usecase

import "context"

type Factory struct {
	User          *UserUsecase
	Auth          *AuthUsecase
	Company       *CompanyUsecase
	Address       *AddressUsecase
	Customer      *CustomerUsecase
	Vehicle       *VehicleUsecase
	Driver        *DriverUsecase
	PricingMatrix *PricingMatrixUsecase
	Order         *OrderUsecase
	Shipment      *ShipmentUsecase
	Waypoint      *WaypointUsecase
	WaypointImage *WaypointImageUsecase
	Trip          *TripUsecase
	Exception     *ExceptionUsecase
	Notification  *NotificationUsecase
	Dashboard     *DashboardUsecase
	Report        *ReportUsecase
	Tracking      *TrackingUsecase
	Onboarding    *OnboardingUsecase
	Upload        *UploadUsecase
}

func NewFactory() *Factory {
	upload, _ := NewUploadUsecase()
	driverUsecase := NewDriverUsecase()
	userUsecase := NewUserUsecase()

	// Wire up circular dependencies
	driverUsecase.UserUsecase = userUsecase
	userUsecase.DriverUsecase = driverUsecase

	return &Factory{
		User:          userUsecase,
		Auth:          NewAuthUsecase(),
		Company:       NewCompanyUsecase(),
		Address:       NewAddressUsecase(),
		Customer:      NewCustomerUsecase(),
		Vehicle:       NewVehicleUsecase(),
		Driver:        driverUsecase,
		PricingMatrix: NewPricingMatrixUsecase(),
		Order:         NewOrderUsecase(),
		Shipment:      NewShipmentUsecase(),
		Waypoint:      NewWaypointUsecase(),
		WaypointImage: NewWaypointImageUsecase(),
		Trip:          NewTripUsecase(),
		Exception:     NewExceptionUsecase(),
		Notification:  NewNotificationUsecase(),
		Dashboard:     NewDashboardUsecase(),
		Report:        NewReportUsecase(),
		Tracking:      NewTrackingUsecase(),
		Onboarding:    NewOnboardingUsecase(),
		Upload:        upload,
	}
}

func (f *Factory) WithContext(ctx context.Context) *Factory {
	user := f.User.WithContext(ctx)
	driver := f.Driver.WithContext(ctx)

	// Re-wire circular dependencies after WithContext
	// This ensures the new instances have references to each other with proper context
	user.DriverUsecase = driver
	driver.UserUsecase = user

	return &Factory{
		User:          user,
		Auth:          f.Auth.WithContext(ctx),
		Company:       f.Company.WithContext(ctx),
		Address:       f.Address.WithContext(ctx),
		Customer:      f.Customer.WithContext(ctx),
		Vehicle:       f.Vehicle.WithContext(ctx),
		Driver:        driver,
		PricingMatrix: f.PricingMatrix.WithContext(ctx),
		Order:         f.Order.WithContext(ctx),
		Shipment:      f.Shipment.WithContext(ctx),
		Waypoint:      f.Waypoint.WithContext(ctx),
		WaypointImage: f.WaypointImage.WithContext(ctx),
		Trip:          f.Trip.WithContext(ctx),
		Exception:     f.Exception.WithContext(ctx),
		Notification:  f.Notification.WithContext(ctx),
		Dashboard:     f.Dashboard.WithContext(ctx),
		Report:        f.Report.WithContext(ctx),
		Tracking:      f.Tracking,
		Onboarding:    f.Onboarding.WithContext(ctx),
		Upload:        f.Upload.WithContext(ctx),
	}
}
