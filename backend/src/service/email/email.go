// Package email provides email service functionality for sending notifications.
// This includes SMTP-based email delivery with HTML and plain text templates.
package email

import (
	"bytes"
	"context"
	"fmt"
	"net/smtp"
	"os"
	"path/filepath"
	"strings"
	"text/template"
	"time"

	"github.com/logistics-id/engine"
	"go.uber.org/zap"
)

// Service defines the email service interface
type Service interface {
	SendDeliverySuccess(ctx context.Context, data *DeliverySuccessData) error
	SendFailedDelivery(ctx context.Context, data *FailedDeliveryData) error
	SendEmail(ctx context.Context, to []string, subject string, htmlBody string, textBody string) error

	// ToUser methods for sending to specific recipients
	SendDeliverySuccessToUser(ctx context.Context, to string, language string, data *DeliverySuccessData) error
	SendFailedDeliveryToUser(ctx context.Context, to string, language string, data *FailedDeliveryData) error
}

// SMTPConfig holds SMTP configuration
type SMTPConfig struct {
	Host     string
	Port     string
	Username string
	Password string
	From     string
}

// EmailService implements the Service interface
type EmailService struct {
	config *SMTPConfig
}

// DeliverySuccessData contains data for delivery success email
type DeliverySuccessData struct {
	OrderNumber   string
	TripNumber    string
	LocationName  string
	Address       string
	RecipientName string
	Timestamp     string
	PodImageURL   string
	DashboardURL  string
	Year          int
}

// FailedDeliveryData contains data for failed delivery email
type FailedDeliveryData struct {
	OrderNumber  string
	TripNumber   string
	LocationName string
	Address      string
	Timestamp    string
	Notes        string
	DashboardURL string
	Year         int
}

// Removed: OrderCreatedData - Not required per current notification requirements
// Removed: OrderCancelledData - Not required per current notification requirements
// Removed: TripCompletedData - Not required per current notification requirements

// NewEmailService creates a new email service instance
func NewEmailService() Service {
	return &EmailService{
		config: &SMTPConfig{
			Host:     getEnv("SMTP_HOST", "localhost"),
			Port:     getEnv("SMTP_PORT", "587"),
			Username: getEnv("SMTP_USER", ""),
			Password: getEnv("SMTP_PASS", ""),
			From:     getEnv("SMTP_FROM", "noreply@tms-onward.com"),
		},
	}
}

// getEnv retrieves environment variable or returns default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getTemplatePath returns the absolute path to the template file
func (s *EmailService) getTemplatePath(templateName string) string {
	basePath := os.Getenv("TEMPLATE_PATH")
	if basePath == "" {
		basePath = "./templates/email"
	}
	return filepath.Join(basePath, templateName)
}

// parseTemplate parses and executes the email template
func (s *EmailService) parseTemplate(templateFile string, data interface{}) (string, error) {
	templatePath := s.getTemplatePath(templateFile)
	tmpl, err := template.New(filepath.Base(templatePath)).ParseFiles(templatePath)
	if err != nil {
		return "", fmt.Errorf("failed to parse template %s: %w", templatePath, err)
	}
	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return "", fmt.Errorf("failed to execute template %s: %w", templatePath, err)
	}
	return buf.String(), nil
}

// SendEmail sends an email using SMTP
func (s *EmailService) SendEmail(ctx context.Context, to []string, subject string, htmlBody string, textBody string) error {
	if s.config.Host == "localhost" && s.config.Username == "" {
		engine.Logger.Info("SMTP not configured, skipping email send")
		return nil
	}
	auth := smtp.PlainAuth("", s.config.Username, s.config.Password, s.config.Host)
	var msg strings.Builder
	msg.WriteString(fmt.Sprintf("From: %s\r\n", s.config.From))
	msg.WriteString(fmt.Sprintf("To: %s\r\n", strings.Join(to, ",")))
	msg.WriteString(fmt.Sprintf("Subject: %s\r\n", subject))
	msg.WriteString("MIME-version: 1.0;\r\n")
	msg.WriteString("Content-Type: multipart/alternative; boundary=\"boundary\"\r\n\r\n")
	if textBody != "" {
		msg.WriteString("--boundary\r\n")
		msg.WriteString("Content-Type: text/plain; charset=\"UTF-8\"\r\n\r\n")
		msg.WriteString(textBody)
		msg.WriteString("\r\n\r\n")
	}
	msg.WriteString("--boundary\r\n")
	msg.WriteString("Content-Type: text/html; charset=\"UTF-8\"\r\n\r\n")
	msg.WriteString(htmlBody)
	msg.WriteString("\r\n\r\n")
	msg.WriteString("--boundary--\r\n")
	addr := fmt.Sprintf("%s:%s", s.config.Host, s.config.Port)
	err := smtp.SendMail(addr, auth, s.config.From, to, []byte(msg.String()))
	if err != nil {
		engine.Logger.Error("Failed to send email", zap.Error(err), zap.Strings("to", to), zap.String("subject", subject))
		return fmt.Errorf("failed to send email: %w", err)
	}
	engine.Logger.Info("Email sent successfully", zap.Strings("to", to), zap.String("subject", subject))
	return nil
}

// getLanguageSuffix returns the language suffix for templates
func getLanguageSuffix(language string) string {
	if strings.ToLower(language) == "en" {
		return "_en"
	}
	return "_id"
}

// SendDeliverySuccess sends delivery success notification email
func (s *EmailService) SendDeliverySuccess(ctx context.Context, data *DeliverySuccessData) error {
	if data.Timestamp == "" {
		data.Timestamp = time.Now().Add(7 * time.Hour).Format("2006-01-02 15:04:05")
	}
	if data.Year == 0 {
		data.Year = time.Now().Year()
	}
	htmlBody, err := s.parseTemplate("delivered_id.html", data)
	if err != nil {
		return err
	}
	textBody := s.generateDeliverySuccessTextPlain(data, "id")
	subject := fmt.Sprintf("Pengiriman Berhasil - Order %s", data.OrderNumber)
	return s.SendEmail(ctx, []string{}, subject, htmlBody, textBody)
}

// SendDeliverySuccessToUser sends delivery success email to specific user
func (s *EmailService) SendDeliverySuccessToUser(ctx context.Context, to string, language string, data *DeliverySuccessData) error {
	if data.Timestamp == "" {
		data.Timestamp = time.Now().Add(7 * time.Hour).Format("2006-01-02 15:04:05")
	}
	if data.Year == 0 {
		data.Year = time.Now().Year()
	}
	langSuffix := getLanguageSuffix(language)
	templateName := fmt.Sprintf("delivered%s.html", langSuffix)
	htmlBody, err := s.parseTemplate(templateName, data)
	if err != nil {
		return err
	}
	textBody := s.generateDeliverySuccessTextPlain(data, language)
	var subject string
	if langSuffix == "_en" {
		subject = fmt.Sprintf("Delivery Successful - Order %s", data.OrderNumber)
	} else {
		subject = fmt.Sprintf("Pengiriman Berhasil - Order %s", data.OrderNumber)
	}
	return s.SendEmail(ctx, []string{to}, subject, htmlBody, textBody)
}

// generateDeliverySuccessTextPlain generates plain text version for delivery success
func (s *EmailService) generateDeliverySuccessTextPlain(data *DeliverySuccessData, language string) string {
	var b strings.Builder
	if language == "en" {
		b.WriteString("Delivery Successful\n")
		b.WriteString("===================\n\n")
		b.WriteString(fmt.Sprintf("Congratulations! Delivery for order %s has been successfully completed.\n\n", data.OrderNumber))
		b.WriteString("Delivery Details:\n")
		b.WriteString(fmt.Sprintf("- Order Number: %s\n", data.OrderNumber))
		b.WriteString(fmt.Sprintf("- Trip Number: %s\n", data.TripNumber))
		b.WriteString(fmt.Sprintf("- Destination: %s\n", data.LocationName))
		b.WriteString(fmt.Sprintf("- Address: %s\n", data.Address))
		b.WriteString(fmt.Sprintf("- Recipient Name: %s\n", data.RecipientName))
		b.WriteString(fmt.Sprintf("- Delivery Time: %s\n", data.Timestamp))
		if data.PodImageURL != "" {
			b.WriteString(fmt.Sprintf("- Proof of Delivery: %s\n", data.PodImageURL))
		}
	} else {
		b.WriteString("Pengiriman Berhasil\n")
		b.WriteString("====================\n\n")
		b.WriteString(fmt.Sprintf("Selamat! Pengiriman untuk order %s telah berhasil diselesaikan.\n\n", data.OrderNumber))
		b.WriteString("Detail Pengiriman:\n")
		b.WriteString(fmt.Sprintf("- Nomor Order: %s\n", data.OrderNumber))
		b.WriteString(fmt.Sprintf("- Nomor Trip: %s\n", data.TripNumber))
		b.WriteString(fmt.Sprintf("- Lokasi Tujuan: %s\n", data.LocationName))
		b.WriteString(fmt.Sprintf("- Alamat: %s\n", data.Address))
		b.WriteString(fmt.Sprintf("- Nama Penerima: %s\n", data.RecipientName))
		b.WriteString(fmt.Sprintf("- Waktu Pengiriman: %s\n", data.Timestamp))
		if data.PodImageURL != "" {
			b.WriteString(fmt.Sprintf("- Bukti Pengiriman: %s\n", data.PodImageURL))
		}
	}
	b.WriteString(fmt.Sprintf("\nDashboard: %s\n", data.DashboardURL))
	b.WriteString(fmt.Sprintf("\n© %d TMS Onward. All rights reserved.\n", data.Year))
	return b.String()
}

// SendFailedDelivery sends failed delivery notification email
func (s *EmailService) SendFailedDelivery(ctx context.Context, data *FailedDeliveryData) error {
	if data.Timestamp == "" {
		data.Timestamp = time.Now().Add(7 * time.Hour).Format("2006-01-02 15:04:05")
	}
	if data.Year == 0 {
		data.Year = time.Now().Year()
	}
	htmlBody, err := s.parseTemplate("failed_delivery_id.html", data)
	if err != nil {
		return err
	}
	textBody := s.generateFailedDeliveryTextPlain(data, "id")
	subject := fmt.Sprintf("Pengiriman Gagal - Order %s", data.OrderNumber)
	return s.SendEmail(ctx, []string{}, subject, htmlBody, textBody)
}

// SendFailedDeliveryToUser sends failed delivery email to specific user
func (s *EmailService) SendFailedDeliveryToUser(ctx context.Context, to string, language string, data *FailedDeliveryData) error {
	if data.Timestamp == "" {
		data.Timestamp = time.Now().Add(7 * time.Hour).Format("2006-01-02 15:04:05")
	}
	if data.Year == 0 {
		data.Year = time.Now().Year()
	}
	langSuffix := getLanguageSuffix(language)
	templateName := fmt.Sprintf("failed_delivery%s.html", langSuffix)
	htmlBody, err := s.parseTemplate(templateName, data)
	if err != nil {
		return err
	}
	textBody := s.generateFailedDeliveryTextPlain(data, language)
	var subject string
	if langSuffix == "_en" {
		subject = fmt.Sprintf("Delivery Failed - Order %s", data.OrderNumber)
	} else {
		subject = fmt.Sprintf("Pengiriman Gagal - Order %s", data.OrderNumber)
	}
	return s.SendEmail(ctx, []string{to}, subject, htmlBody, textBody)
}

// generateFailedDeliveryTextPlain generates plain text version for failed delivery
func (s *EmailService) generateFailedDeliveryTextPlain(data *FailedDeliveryData, language string) string {
	var b strings.Builder
	if language == "en" {
		b.WriteString("Delivery Failed\n")
		b.WriteString("===============\n\n")
		b.WriteString(fmt.Sprintf("Attention: Delivery for order %s has failed at the destination location.\n\n", data.OrderNumber))
		b.WriteString("Delivery Details:\n")
		b.WriteString(fmt.Sprintf("- Order Number: %s\n", data.OrderNumber))
		b.WriteString(fmt.Sprintf("- Trip Number: %s\n", data.TripNumber))
		b.WriteString(fmt.Sprintf("- Failed Location: %s\n", data.LocationName))
		b.WriteString(fmt.Sprintf("- Address: %s\n", data.Address))
		b.WriteString(fmt.Sprintf("- Time: %s\n", data.Timestamp))
		b.WriteString(fmt.Sprintf("- Notes: %s\n", data.Notes))
	} else {
		b.WriteString("Pengiriman Gagal\n")
		b.WriteString("================\n\n")
		b.WriteString(fmt.Sprintf("Perhatian: Pengiriman untuk order %s mengalami kegagalan pada lokasi tujuan.\n\n", data.OrderNumber))
		b.WriteString("Detail Pengiriman:\n")
		b.WriteString(fmt.Sprintf("- Nomor Order: %s\n", data.OrderNumber))
		b.WriteString(fmt.Sprintf("- Nomor Trip: %s\n", data.TripNumber))
		b.WriteString(fmt.Sprintf("- Lokasi Gagal: %s\n", data.LocationName))
		b.WriteString(fmt.Sprintf("- Alamat: %s\n", data.Address))
		b.WriteString(fmt.Sprintf("- Waktu: %s\n", data.Timestamp))
		b.WriteString(fmt.Sprintf("- Catatan: %s\n", data.Notes))
	}
	b.WriteString(fmt.Sprintf("\nDashboard: %s\n", data.DashboardURL))
	b.WriteString(fmt.Sprintf("\n© %d TMS Onward. All rights reserved.\n", data.Year))
	return b.String()
}

// Removed: SendOrderCreated and SendOrderCreatedToUser - Not required per current notification requirements

// Removed: SendOrderCancelled and SendOrderCancelledToUser - Not required per current notification requirements

// Removed: SendTripCompleted and SendTripCompletedToUser - Not required per current notification requirements
