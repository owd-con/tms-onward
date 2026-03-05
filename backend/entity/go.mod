module github.com/logistics-id/onward-tms/entity

go 1.24.4

require (
	github.com/enigma-id/region-id v0.1.3
	github.com/google/uuid v1.6.0
	github.com/logistics-id/engine/common v0.0.19-dev
	github.com/uptrace/bun v1.2.16
	go.mongodb.org/mongo-driver v1.17.9
)

require (
	github.com/golang-jwt/jwt/v5 v5.3.0 // indirect
	github.com/jinzhu/inflection v1.0.0 // indirect
	github.com/puzpuzpuz/xsync/v3 v3.5.1 // indirect
	github.com/tmthrgd/go-hex v0.0.0-20190904060850-447a3041c3bc // indirect
	github.com/vmihailenco/msgpack/v5 v5.4.1 // indirect
	github.com/vmihailenco/tagparser/v2 v2.0.0 // indirect
	golang.org/x/crypto v0.45.0 // indirect
	golang.org/x/sys v0.38.0 // indirect
)

replace github.com/logistics-id/engine v0.0.19-dev => ../../engine
