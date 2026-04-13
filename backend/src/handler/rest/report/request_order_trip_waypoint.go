package report

import (
	"context"
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/xuri/excelize/v2"
)

type getOrderTripWaypointRequest struct {
	usecase.ReportQueryOptions

	// Query parameters
	Downloadable bool `query:"downloadable"`

	uc      *usecase.ReportUsecase
	ctx     context.Context
	session *entity.TMSSessionClaims
}

func (r *getOrderTripWaypointRequest) get() (*rest.ResponseBody, error) {
	// Set limit to 100000 if downloadable to fetch all data for Excel export
	if r.Downloadable {
		r.Limit = 100000
	}

	opts := r.BuildQueryOption()
	opts.Session = r.session

	data, total, err := r.uc.GetOrderTripWaypointReport(opts)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(data, rest.BuildMeta(r.Page, r.Limit, total)), nil
}

func (r *getOrderTripWaypointRequest) with(ctx context.Context, uc *usecase.ReportUsecase) *getOrderTripWaypointRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}

func (r *getOrderTripWaypointRequest) getDownload(data any, c *rest.Context) error {
	items, ok := data.([]*entity.TripWaypointReport)
	if !ok {
		return fmt.Errorf("invalid data type")
	}

	f := excelize.NewFile()
	sheet := "Sheet1" // Use default sheet name

	// Create header style (bold + center align)
	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true},
		Alignment: &excelize.Alignment{Horizontal: "center"},
	})

	// Create headers starting from row 1
	headers := []string{
		"Order Number",
		"Customer Name",
		"Trip Code",
		"Driver Name",
		"Vehicle Plate Number",
		"Shipment Number",
		"Waypoint Location",
		"Waypoint Type",
		"Waypoint Status",
		"Received By",
		"Failed Reason",
		"Completed At",
	}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheet, cell, h)
		f.SetCellStyle(sheet, cell, cell, headerStyle)
	}

	// Fill data starting from row 2
	for i, item := range items {
		row := i + 2
		f.SetCellValue(sheet, fmt.Sprintf("A%d", row), item.OrderNumber)
		f.SetCellValue(sheet, fmt.Sprintf("B%d", row), item.CustomerName)
		f.SetCellValue(sheet, fmt.Sprintf("C%d", row), item.TripCode)
		f.SetCellValue(sheet, fmt.Sprintf("D%d", row), item.DriverName)
		f.SetCellValue(sheet, fmt.Sprintf("E%d", row), item.VehiclePlateNumber)
		f.SetCellValue(sheet, fmt.Sprintf("F%d", row), item.ShipmentNumber)

		// Combine location_name and address for waypoint location
		waypointLocation := fmt.Sprintf("%s, %s", item.LocationName, item.Address)
		f.SetCellValue(sheet, fmt.Sprintf("G%d", row), waypointLocation)

		f.SetCellValue(sheet, fmt.Sprintf("H%d", row), item.WaypointType)
		f.SetCellValue(sheet, fmt.Sprintf("I%d", row), item.ShipmentStatus)

		if item.ReceivedBy != nil {
			f.SetCellValue(sheet, fmt.Sprintf("J%d", row), *item.ReceivedBy)
		} else {
			f.SetCellValue(sheet, fmt.Sprintf("J%d", row), "")
		}
		if item.FailedReason != nil {
			f.SetCellValue(sheet, fmt.Sprintf("K%d", row), *item.FailedReason)
		} else {
			f.SetCellValue(sheet, fmt.Sprintf("K%d", row), "")
		}
		if item.CompletedAt != nil {
			f.SetCellValue(sheet, fmt.Sprintf("L%d", row), item.CompletedAt.Add(7*time.Hour).Format("2006-01-02 15:04:05"))
		} else {
			f.SetCellValue(sheet, fmt.Sprintf("L%d", row), "")
		}
	}

	// Set headers for download
	c.Response.Header().Set("Content-Type", "application/octet-stream")
	c.Response.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=Trip-Waypoint-Report-%s.xlsx", time.Now().Add(7*time.Hour).Format("20060102150405")))
	c.Response.Header().Set("Content-Transfer-Encoding", "binary")
	c.Response.Header().Set("Access-Control-Expose-Headers", "Content-Disposition")

	buf, _ := f.WriteToBuffer()
	v, _ := io.ReadAll(strings.NewReader(buf.String()))
	c.Response.Write(v)

	return nil
}
