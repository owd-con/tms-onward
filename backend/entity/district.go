package entity

import (
	"time"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

type District struct {
	bun.BaseModel `bun:"table:districts,alias:districts"`

	ID        uuid.UUID `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	CityID    uuid.UUID `bun:"city_id,notnull" json:"city_id"`
	Code      string    `bun:"code,notnull,unique" json:"code"`
	Name      string    `bun:"name,notnull" json:"name"`
	CreatedAt time.Time `bun:"created_at,default:current_timestamp" json:"created_at"`
	UpdatedAt time.Time `bun:"updated_at,default:current_timestamp" json:"updated_at"`

	City     *City      `bun:"rel:belongs-to,join:city_id=id" json:"city,omitempty"`
	Villages []*Village `bun:"rel:has-many,join:id=district_id" json:"villages,omitempty"`
}
