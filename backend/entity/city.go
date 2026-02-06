package entity

import (
	"time"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

type City struct {
	bun.BaseModel `bun:"table:cities,alias:cities"`

	ID         uuid.UUID `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	ProvinceID uuid.UUID `bun:"province_id,notnull" json:"province_id"`
	Code       string    `bun:"code,notnull,unique" json:"code"`
	Name       string    `bun:"name,notnull" json:"name"`
	Type       string    `bun:"type,notnull" json:"type"`
	CreatedAt  time.Time `bun:"created_at,default:current_timestamp" json:"created_at"`
	UpdatedAt  time.Time `bun:"updated_at,default:current_timestamp" json:"updated_at"`

	Province  *Province   `bun:"rel:belongs-to,join:province_id=id" json:"province,omitempty"`
	Districts []*District `bun:"rel:has-many,join:id=city_id" json:"districts,omitempty"`
}
