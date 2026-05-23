# syntax=docker/dockerfile:1.7

# Build stage: compile only the API binary from the multi-binary repo.
FROM golang:1.25-alpine AS builder
WORKDIR /src

# Cache dependency downloads first.
COPY go.mod go.sum ./
RUN go mod download

# Copy the backend source and build cmd/api only.
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=arm64 \
    go build -trimpath -ldflags='-s -w' -o /out/api ./cmd/api

# Runtime stage: small attack surface image.
FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /app
COPY --from=builder /out/api /app/api

EXPOSE 8081
ENV PORT=8081
ENTRYPOINT ["/app/api"]
