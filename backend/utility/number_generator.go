// Package utility provides utility functions for number generation
package utility

import (
	"context"
	"fmt"
	"time"

	"github.com/uptrace/bun"
)

// NumberType defines the type of number to generate
type NumberType string

const (
	NumberTypeOrder    NumberType = "ORD"
	NumberTypeTrip     NumberType = "TRP"
	NumberTypeShipment NumberType = "SHP"
)

// GenerateNumberWithRandom generates a number with format PREFIX-YYYYMMDD-XXXX where XXXX is random
// Used for: Order, Shipment, Trip (non-sequential)
func GenerateNumberWithRandom(prefix NumberType) string {
	now := time.Now()
	dateStr := now.Format("20060102")
	randomNum := fmt.Sprintf("%04d", now.Nanosecond()%10000)
	return fmt.Sprintf("%s-%s-%s", prefix, dateStr, randomNum)
}

// GenerateNumberWithSequence generates a sequential number with format PREFIX-YYYYMMDD-XXXX
// Queries database to get last number for today and increments it
// Used for: Trip (sequential for better tracking)
func GenerateNumberWithSequence(ctx context.Context, db bun.IDB, prefix NumberType, tableName string) (string, error) {
	now := time.Now()
	dateStr := now.Format("20060102")
	prefixStr := string(prefix)

	// Get last number for today
	var lastNumber string
	columnName := prefixStr + "_number"
	err := db.NewSelect().
		TableExpr(tableName).
		ColumnExpr(columnName).
		Where(columnName+" LIKE ?", prefixStr+"-"+dateStr+"-%").
		OrderExpr(columnName + " DESC").
		Limit(1).
		Scan(ctx, &lastNumber)

	// If error but no result found, continue with default sequence
	if err != nil && lastNumber == "" {
		// No records for today, start from sequence 1
		lastNumber = ""
	} else if err != nil {
		return "", fmt.Errorf("failed to get last %s number: %w", prefixStr, err)
	}

	// Extract sequence from last number
	lastSeq := 0
	if lastNumber != "" {
		// Parse last 4 digits
		_, err := fmt.Sscanf(lastNumber, prefixStr+"-"+dateStr+"-%d", &lastSeq)
		if err == nil {
			lastSeq++
		}
	}

	// Format: PREFIX-YYYYMMDD-XXXX (4-digit with leading zeros)
	return fmt.Sprintf("%s-%s-%04d", prefixStr, dateStr, lastSeq+1), nil
}
