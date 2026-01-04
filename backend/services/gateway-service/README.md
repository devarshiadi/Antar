# Antar API Gateway

This is the main entry point for the Antar backend. It routes requests to the appropriate microservices.

## Interaction

Apps should send requests to this gateway, which then forwards them:

- `/api/auth/*` -> Auth Service
- `/api/users/*` -> Auth Service
- `/api/rides/*` -> Matchmaking Service
- `/api/matches/*` -> Matchmaking Service
- `/api/chat/*` -> Chat Service
- `/api/location/*` -> Location Service

## Deployment

Deploy this folder to HuggingFace Spaces using the Docker SDK.

### Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Port to listen on (default: 7860 for HF) |
| `AUTH_SERVICE_URL` | URL of the Auth Service |
| `MATCHMAKING_SERVICE_URL` | URL of the Matchmaking Service |
| `CHAT_SERVICE_URL` | URL of the Chat Service |
| `LOCATION_SERVICE_URL` | URL of the Location Service |
