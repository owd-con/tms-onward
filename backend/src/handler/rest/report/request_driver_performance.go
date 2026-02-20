package report

import (
	"context"
	"fmt"
	"io/ioutil"
	"strings"
	"time"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"
	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/xuri/excelize/v2"
)

type getDriverPerformanceRequest struct {
	usecase.ReportQueryOptions

	// Query parameters
	Downloadable bool `query:"downloadable"`

	uc      *usecase.ReportUsecase
	ctx     context.Context
	session *entity.TMSSessionClaims
}

func (r *getDriverPerformanceRequest) get() (*rest.ResponseBody, error) {
	// Set limit to 100000 if downloadable to fetch all data for Excel export
	if r.Downloadable {
		r.Limit = 100000
	}

	opts := r.BuildQueryOption()
	opts.Session = r.session

	data, total, err := r.uc.GetDriverPerformance(opts)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(data, rest.BuildMeta(r.Page, r.Limit, total)), nil
}

func (r *getDriverPerformanceRequest) with(ctx context.Context, uc *usecase.ReportUsecase) *getDriverPerformanceRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}

func (r *getDriverPerformanceRequest) getDownload(data any, c *rest.Context) error {
	items, ok := data.([]*usecase.DriverPerformanceReport)
	if !ok {
		return fmt.Errorf("invalid data type")
	}

	f := excelize.NewFile()
	sheet := "Sheet1" // Use default sheet name

	// Create header style (bold + center align)
	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true},
		Alignment: &excelize.Alignment{Horizontal: "center"},
	})

	// Create headers starting from row 1
	headers := []string{"Driver Name", "Total Trips", "Completed Trips", "On Time Trips", "On Time Rate"}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheet, cell, h)
		f.SetCellStyle(sheet, cell, cell, headerStyle)
	}

	// Fill data starting from row 2
	for i, item := range items {
		row := i + 2
		f.SetCellValue(sheet, fmt.Sprintf("A%d", row), item.DriverName)
		f.SetCellValue(sheet, fmt.Sprintf("B%d", row), item.TotalTrips)
		f.SetCellValue(sheet, fmt.Sprintf("C%d", row), item.CompletedTrips)
		f.SetCellValue(sheet, fmt.Sprintf("D%d", row), item.OnTimeTrips)
		f.SetCellValue(sheet, fmt.Sprintf("E%d", row), item.OnTimeRate)
	}

	// Set headers for download
	c.Response.Header().Set("Content-Type", "application/octet-stream")
	c.Response.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=Driver-Performance-Report-%s.xlsx", time.Now().Format("20060102150405")))
	c.Response.Header().Set("Content-Transfer-Encoding", "binary")
	c.Response.Header().Set("Access-Control-Expose-Headers", "Content-Disposition")

	buf, _ := f.WriteToBuffer()
	v, _ := ioutil.ReadAll(strings.NewReader(buf.String()))
	c.Response.Write(v)

	return nil
}
