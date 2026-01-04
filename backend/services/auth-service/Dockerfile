FROM golang:1.21-alpine AS builder

RUN apk add --no-cache gcc musl-dev sqlite-dev

WORKDIR /app

ENV GOPROXY=https://proxy.golang.org,direct

# Copy ONLY go.mod first, let go generate go.sum
COPY go.mod ./

# Download and generate fresh go.sum
RUN go mod download

# Copy source code
COPY *.go ./

# Tidy to ensure everything is correct
RUN go mod tidy

# Build
RUN CGO_ENABLED=1 GOOS=linux go build -a -ldflags '-linkmode external -extldflags "-static"' -o auth .

# Runtime stage
FROM alpine:3.19

RUN apk add --no-cache ca-certificates sqlite-libs

WORKDIR /app

COPY --from=builder /app/auth .

ENV PORT=7860
ENV DATABASE_PATH=/tmp/data
ENV ENVIRONMENT=production
ENV JWT_SECRET=change-this-in-production

EXPOSE 7860

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:7860/health || exit 1

CMD ["./auth"]