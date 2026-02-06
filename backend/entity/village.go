package entity

import (
	"encoding/json"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

type Village struct {
	bun.BaseModel `bun:"table:villages,alias:villages"`

	ID         uuid.UUID `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	DistrictID uuid.UUID `bun:"district_id,notnull" json:"district_id"`
	Code       string    `bun:"code,notnull,unique" json:"code"`
	Name       string    `bun:"name,notnull" json:"name"`
	Type       string    `bun:"type" json:"type"`
	PostalCode string    `bun:"postal_code,notnull" json:"postal_code"`
	Latitude   float64   `bun:"latitude" json:"latitude"`
	Longitude  float64   `bun:"longitude" json:"longitude"`
	CreatedAt  time.Time `bun:"created_at,default:current_timestamp" json:"created_at"`
	UpdatedAt  time.Time `bun:"updated_at,default:current_timestamp" json:"updated_at"`

	District *District `bun:"rel:belongs-to,join:district_id=id" json:"district,omitempty"`
}

func (v *Village) MarshalJSON() ([]byte, error) {
	type Alias Village

	alias := &struct {
		*Alias
		AliasName string `json:"alias_name"`
	}{
		Alias:     (*Alias)(v),
		AliasName: v.GetAlias(),
	}

	return json.Marshal(alias)
}

func (v *Village) GetAlias() string {
	var parts []string

	if v.District != nil && v.District.City != nil && v.District.City.Province != nil {
		parts = append(parts, v.District.City.Province.Name)
	}
	if v.District != nil && v.District.City != nil {
		parts = append(parts, v.District.City.Name)
	}
	if v.District != nil {
		parts = append(parts, v.District.Name)
	}
	parts = append(parts, v.Name)
	parts = append(parts, v.PostalCode)

	return strings.Join(parts, ", ")
}
