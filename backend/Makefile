GOCACHE ?= /tmp/portfolio-go-cache
SQLC_VERSION ?= v1.31.1

.PHONY: build check generate test test-race vet

build:
	CCACHE_DISABLE=1 GOCACHE=$(GOCACHE) go build ./cmd/api

generate:
	CCACHE_DISABLE=1 GOCACHE=$(GOCACHE) go run github.com/sqlc-dev/sqlc/cmd/sqlc@$(SQLC_VERSION) generate

test:
	CCACHE_DISABLE=1 GOCACHE=$(GOCACHE) go test ./...

test-race:
	CCACHE_DISABLE=1 GOCACHE=$(GOCACHE) go test -race ./...

vet:
	CCACHE_DISABLE=1 GOCACHE=$(GOCACHE) go vet ./...

check: generate test vet
	git diff --check

