# Antar Matchmaking Service - HuggingFace Spaces

FROM golang:1.21-alpine AS builder

RUN apk add --no-cache gcc musl-dev sqlite-dev

WORKDIR /app

ENV GOPROXY=https://proxy.golang.org,direct

# Copy go.mod first
COPY go.mod ./

# Copy source files BEFORE go mod tidy
COPY *.go ./

# Now tidy and download
RUN go mod tidy
RUN go mod download

# Build with CGO for SQLite
RUN CGO_ENABLED=1 GOOS=linux go build -a -ldflags '-linkmode external -extldflags "-static"' -o matchmaking .

FROM alpine:3.19

RUN apk add --no-cache ca-certificates sqlite-libs

WORKDIR /app

COPY --from=builder /app/matchmaking .

# Use /tmp for SQLite database (writable on HuggingFace)
ENV PORT=7860
ENV DATABASE_PATH=/tmp/data
ENV ENVIRONMENT=production
ENV JWT_SECRET=change-this-in-production
ENV AUTH_SERVICE_URL=https://loginx-auth.hf.space

EXPOSE 7860

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:7860/health || exit 1

CMD ["./matchmaking"]