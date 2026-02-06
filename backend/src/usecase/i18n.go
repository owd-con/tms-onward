// Package usecase provides business logic for internationalization (i18n) service.
package usecase

import (
	"encoding/json"
	"errors"
)

type I18nUsecase struct {
	translations map[string]map[string]interface{}
}

type TranslationResponse struct {
	Language string                 `json:"language"`
	Data     map[string]interface{} `json:"data"`
}

func NewI18nUsecase() *I18nUsecase {
	uc := &I18nUsecase{
		translations: make(map[string]map[string]interface{}),
	}

	// Load translations
	uc.loadTranslations()

	return uc
}

// loadTranslations loads all available translations
func (u *I18nUsecase) loadTranslations() {
	// Indonesian translations
	idTranslations := map[string]interface{}{
		"common": map[string]interface{}{
			"welcome":      "Selamat Datang",
			"login":        "Masuk",
			"logout":       "Keluar",
			"save":         "Simpan",
			"cancel":       "Batal",
			"delete":       "Hapus",
			"edit":         "Edit",
			"search":       "Cari",
			"loading":      "Memuat...",
			"no_data":      "Tidak ada data",
			"confirm":      "Konfirmasi",
			"back":         "Kembali",
			"next":         "Lanjut",
			"submit":       "Kirim",
			"close":        "Tutup",
			"yes":          "Ya",
			"no":           "Tidak",
			"total":        "Total",
			"status":       "Status",
			"date":         "Tanggal",
			"time":         "Waktu",
			"action":       "Aksi",
			"success":      "Berhasil",
			"error":        "Error",
			"warning":      "Peringatan",
			"info":         "Informasi",
		},
		"order": map[string]interface{}{
			"title":           "Order",
			"order_number":    "Nomor Order",
			"customer":        "Pelanggan",
			"status":          "Status",
			"order_type":      "Tipe Order",
			"ftl":             "Full Truck Load (FTL)",
			"ltl":             "Less Than Truck Load (LTL)",
			"price":           "Harga",
			"created_at":      "Dibuat pada",
			"updated_at":      "Diperbarui pada",
			"status_pending":  "pending",
			"status_assigned": "Assigned",
			"status_ongoing":  "Ongoing",
			"status_completed": "Selesai",
			"status_cancelled": "Dibatalkan",
			"create_order":    "Buat Order Baru",
			"view_order":      "Lihat Detail Order",
			"cancel_order":    "Batalkan Order",
		},
		"trip": map[string]interface{}{
			"title":            "Trip",
			"trip_number":      "Nomor Trip",
			"driver":           "Driver",
			"vehicle":          "Kendaraan",
			"status":           "Status",
			"created_at":       "Dibuat pada",
			"started_at":       "Mulai pada",
			"completed_at":     "Selesai pada",
			"status_pending":   "pending",
			"status_ongoing":   "Berjalan",
			"status_completed": "Selesai",
			"status_cancelled": "Dibatalkan",
			"create_trip":      "Buat Trip Baru",
			"start_trip":       "Mulai Trip",
			"complete_trip":    "Selesaikan Trip",
		},
		"driver": map[string]interface{}{
			"title":         "Driver",
			"name":          "Nama",
			"phone":         "Telepon",
			"license_number": "Nomor SIM",
			"status":        "Status",
			"status_active": "Aktif",
			"status_inactive": "Tidak Aktif",
			"create_driver": "Tambah Driver Baru",
			"edit_driver":   "Edit Driver",
		},
		"vehicle": map[string]interface{}{
			"title":        "Kendaraan",
			"plate_number": "Plat Nomor",
			"type":         "Tipe",
			"capacity":     "Kapasitas",
			"status":       "Status",
			"status_active": "Aktif",
			"status_inactive": "Tidak Aktif",
			"status_maintenance": "Maintenance",
			"create_vehicle": "Tambah Kendaraan Baru",
			"edit_vehicle":   "Edit Kendaraan",
		},
		"customer": map[string]interface{}{
			"title":    "Pelanggan",
			"name":     "Nama",
			"email":    "Email",
			"phone":    "Telepon",
			"address":  "Alamat",
			"create_customer": "Tambah Pelanggan Baru",
			"edit_customer":   "Edit Pelanggan",
		},
		"waypoint": map[string]interface{}{
			"title":           "Waypoint",
			"location_name":   "Nama Lokasi",
			"address":         "Alamat",
			"type":            "Tipe",
			"type_pickup":     "Pickup",
			"type_delivery":   "Delivery",
			"status":          "Status",
			"status_pending":  "pending",
			"status_in_progress": "Dalam Perjalanan",
			"status_completed": "Selesai",
			"status_failed":   "Gagal",
			"notes":           "Catatan",
		},
		"dashboard": map[string]interface{}{
			"title":                  "Dashboard",
			"today_orders":           "Order Hari Ini",
			"active_trips":           "Trip Aktif",
			"pending_waypoints":      "Waypoint Pending",
			"completed_trips":        "Trip Selesai",
		},
		"report": map[string]interface{}{
			"title":           "Laporan",
			"order_report":    "Laporan Order",
			"trip_report":     "Laporan Trip",
			"revenue_report":  "Laporan Pendapatan",
			"exception_report": "Laporan Exception",
			"driver_performance": "Performa Driver",
			"from_date":       "Dari Tanggal",
			"to_date":         "Sampai Tanggal",
			"export_excel":    "Export Excel",
		},
		"notification": map[string]interface{}{
			"title":                  "Notifikasi",
			"failed_delivery":        "Pengiriman Gagal",
			"delivered":              "Pengiriman Berhasil",
			"order_created":          "Order Baru",
			"order_cancelled":        "Order Dibatalkan",
			"trip_completed":         "Trip Selesai",
			"mark_as_read":           "Tandai Telah Dibaca",
		},
		"exception": map[string]interface{}{
			"title":              "Exception",
			"failed_orders":      "Order Gagal",
			"failed_waypoints":   "Waypoint Gagal",
			"reschedule":         "Jadwal Ulang",
			"reschedule_waypoint": "Jadwal Ulang Waypoint",
		},
	}

	// English translations
	enTranslations := map[string]interface{}{
		"common": map[string]interface{}{
			"welcome":     "Welcome",
			"login":       "Login",
			"logout":      "Logout",
			"save":        "Save",
			"cancel":      "Cancel",
			"delete":      "Delete",
			"edit":        "Edit",
			"search":      "Search",
			"loading":     "Loading...",
			"no_data":     "No data",
			"confirm":     "Confirm",
			"back":        "Back",
			"next":        "Next",
			"submit":      "Submit",
			"close":       "Close",
			"yes":         "Yes",
			"no":          "No",
			"total":       "Total",
			"status":      "Status",
			"date":        "Date",
			"time":        "Time",
			"action":      "Action",
			"success":     "Success",
			"error":       "Error",
			"warning":     "Warning",
			"info":        "Info",
		},
		"order": map[string]interface{}{
			"title":            "Order",
			"order_number":     "Order Number",
			"customer":         "Customer",
			"status":           "Status",
			"order_type":       "Order Type",
			"ftl":              "Full Truck Load (FTL)",
			"ltl":              "Less Than Truck Load (LTL)",
			"price":            "Price",
			"created_at":       "Created At",
			"updated_at":       "Updated At",
			"status_pending":   "pending",
			"status_assigned":  "Assigned",
			"status_ongoing":   "Ongoing",
			"status_completed": "completed",
			"status_cancelled": "cancelled",
			"create_order":     "Create New Order",
			"view_order":       "View Order Details",
			"cancel_order":     "Cancel Order",
		},
		"trip": map[string]interface{}{
			"title":            "Trip",
			"trip_number":      "Trip Number",
			"driver":           "Driver",
			"vehicle":          "Vehicle",
			"status":           "Status",
			"created_at":       "Created At",
			"started_at":       "Started At",
			"completed_at":     "Completed At",
			"status_pending":   "pending",
			"status_ongoing":   "Ongoing",
			"status_completed": "completed",
			"status_cancelled": "cancelled",
			"create_trip":      "Create New Trip",
			"start_trip":       "Start Trip",
			"complete_trip":    "Complete Trip",
		},
		"driver": map[string]interface{}{
			"title":          "Driver",
			"name":           "Name",
			"phone":          "Phone",
			"license_number": "License Number",
			"status":         "Status",
			"status_active":  "Active",
			"status_inactive": "Inactive",
			"create_driver":  "Create New Driver",
			"edit_driver":    "Edit Driver",
		},
		"vehicle": map[string]interface{}{
			"title":             "Vehicle",
			"plate_number":      "Plate Number",
			"type":              "Type",
			"capacity":          "Capacity",
			"status":            "Status",
			"status_active":     "Active",
			"status_inactive":   "Inactive",
			"status_maintenance": "Maintenance",
			"create_vehicle":    "Create New Vehicle",
			"edit_vehicle":      "Edit Vehicle",
		},
		"customer": map[string]interface{}{
			"title":           "Customer",
			"name":            "Name",
			"email":           "Email",
			"phone":           "Phone",
			"address":         "Address",
			"create_customer": "Create New Customer",
			"edit_customer":   "Edit Customer",
		},
		"waypoint": map[string]interface{}{
			"title":              "Waypoint",
			"location_name":      "Location Name",
			"address":            "Address",
			"type":               "Type",
			"type_pickup":        "Pickup",
			"type_delivery":      "Delivery",
			"status":             "Status",
			"status_pending":     "pending",
			"status_in_progress": "In Progress",
			"status_completed":   "completed",
			"status_failed":      "failed",
			"notes":              "Notes",
		},
		"dashboard": map[string]interface{}{
			"title":             "Dashboard",
			"today_orders":      "Today's Orders",
			"active_trips":      "Active Trips",
			"pending_waypoints": "Pending Waypoints",
			"completed_trips":   "Completed Trips",
		},
		"report": map[string]interface{}{
			"title":                "Reports",
			"order_report":         "Order Report",
			"trip_report":          "Trip Report",
			"revenue_report":       "Revenue Report",
			"exception_report":     "Exception Report",
			"driver_performance":   "Driver Performance",
			"from_date":            "From Date",
			"to_date":              "To Date",
			"export_excel":         "Export Excel",
		},
		"notification": map[string]interface{}{
			"title":             "Notifications",
			"failed_delivery":   "Delivery Failed",
			"delivered":         "Delivered",
			"order_created":     "Order Created",
			"order_cancelled":   "Order Cancelled",
			"trip_completed":    "Trip Completed",
			"mark_as_read":      "Mark as Read",
		},
		"exception": map[string]interface{}{
			"title":              "Exception",
			"failed_orders":      "Failed Orders",
			"failed_waypoints":   "Failed Waypoints",
			"reschedule":         "Reschedule",
			"reschedule_waypoint": "Reschedule Waypoint",
		},
	}

	u.translations["id"] = idTranslations
	u.translations["en"] = enTranslations
}

// GetTranslations retrieves translations for a specific language
func (u *I18nUsecase) GetTranslations(lang string) (*TranslationResponse, error) {
	// Normalize language code
	if lang == "" {
		lang = "id" // Default to Indonesian
	}

	// Check if language is supported
	translations, exists := u.translations[lang]
	if !exists {
		// Return Indonesian as fallback
		translations = u.translations["id"]
		lang = "id"
	}

	return &TranslationResponse{
		Language: lang,
		Data:     translations,
	}, nil
}

// GetTranslationByKey retrieves a specific translation key
func (u *I18nUsecase) GetTranslationByKey(lang, key string) (string, error) {
	response, err := u.GetTranslations(lang)
	if err != nil {
		return "", err
	}

	// Parse key path (e.g., "common.welcome")
	return getNestedValue(response.Data, key)
}

// getNestedValue retrieves a value from nested map using dot notation
func getNestedValue(data map[string]interface{}, key string) (string, error) {
	keys := parseKey(key)
	current := interface{}(data)

	for _, k := range keys {
		switch v := current.(type) {
		case map[string]interface{}:
			val, exists := v[k]
			if !exists {
				return "", errors.New("key not found")
			}
			current = val
		default:
			return "", errors.New("invalid key path")
		}
	}

	if result, ok := current.(string); ok {
		return result, nil
	}

	// If not a string, convert to JSON
	jsonBytes, err := json.Marshal(current)
	if err != nil {
		return "", err
	}

	return string(jsonBytes), nil
}

// parseKey splits a key string by dots
func parseKey(key string) []string {
	var keys []string
	current := ""

	for _, ch := range key {
		if ch == '.' {
			if current != "" {
				keys = append(keys, current)
				current = ""
			}
		} else {
			current += string(ch)
		}
	}

	if current != "" {
		keys = append(keys, current)
	}

	return keys
}
