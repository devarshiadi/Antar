# Antar API Gateway - HuggingFace Spaces

FROM golang:1.21-alpine AS builder

RUN apk add --no-cache gcc musl-dev

WORKDIR /app

ENV GOPROXY=https://proxy.golang.org,direct

# Copy go.mod first
COPY go.mod ./

# Copy source files BEFORE go mod tidy
COPY *.go ./

# Tidy and download
RUN go mod tidy
RUN go mod download

# Build
RUN CGO_ENABLED=0 GOOS=linux go build -a -ldflags '-s -w' -o gateway .

FROM alpine:3.19

RUN apk add --no-cache ca-certificates

WORKDIR /app

COPY --from=builder /app/gateway .

ENV PORT=7860
ENV ENVIRONMENT=production
ENV AUTH_SERVICE_URL=https://loginx-auth.hf.space
ENV MATCHMAKING_SERVICE_URL=https://loginx-matchmakingservice.hf.space
ENV CHAT_SERVICE_URL=https://loginx-chatservice.hf.space
ENV LOCATION_SERVICE_URL=https://loginx-locationservice.hf.space

EXPOSE 7860

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:7860/health || exit 1

CMD ["./gateway"]