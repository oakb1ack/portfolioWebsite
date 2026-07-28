# syntax=docker/dockerfile:1
FROM docker.io/library/golang:1.26-alpine AS build
WORKDIR /src
COPY go.mod go.sum* ./
RUN go mod download
COPY . .
ARG VERSION=development
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w -X main.version=${VERSION}" -o /out/portfolio-api ./cmd/api

FROM gcr.io/distroless/static-debian13:nonroot
COPY --from=build /out/portfolio-api /portfolio-api
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/portfolio-api"]
