package entity

import (
	"time"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

type Province struct {
	bun.BaseModel `bun:"table:provinces,alias:provinces"`

	ID        uuid.UUID `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	CountryID uuid.UUID `bun:"country_id,notnull" json:"country_id"`
	Code      string    `bun:"code,notnull,unique" json:"code"`
	Name      string    `bun:"name,notnull" json:"name"`
	CreatedAt time.Time `bun:"created_at,default:current_timestamp" json:"created_at"`
	UpdatedAt time.Time `bun:"updated_at,default:current_timestamp" json:"updated_at"`

	Cities []*City `bun:"rel:has-many,join:id=province_id" json:"cities,omitempty"`
}
