module github.com/logistics-id/onward-tms/entity

go 1.24.4

require (
	github.com/google/uuid v1.6.0
	github.com/logistics-id/engine/common v0.0.19-dev
	github.com/uptrace/bun v1.2.7
)

require (
	github.com/golang-jwt/jwt/v5 v5.3.0 // indirect
	github.com/jinzhu/inflection v1.0.0 // indirect
	github.com/puzpuzpuz/xsync/v3 v3.4.0 // indirect
	github.com/tmthrgd/go-hex v0.0.0-20190904060850-447a3041c3bc // indirect
	github.com/vmihailenco/msgpack/v5 v5.4.1 // indirect
	github.com/vmihailenco/tagparser/v2 v2.0.0 // indirect
	golang.org/x/crypto v0.41.0 // indirect
	golang.org/x/sys v0.35.0 // indirect
)

replace github.com/logistics-id/engine v0.0.19-dev => ../../engine
