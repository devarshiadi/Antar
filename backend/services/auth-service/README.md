# 🔐 Antar Auth Service

Standalone authentication microservice for the Antar ride-sharing app.

## 🚀 Deploy to HuggingFace Spaces

1. Create a new HuggingFace Space with **Docker** SDK
2. Upload this entire folder to the Space
3. Set environment variables in Space settings:
   - `JWT_SECRET`: Your secret key for JWT tokens
4. The Space will automatically build and run

## 📡 API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Health check | No |
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login | No |
| POST | `/api/auth/verify-otp` | Verify OTP (demo: 123456) | No |
| GET | `/api/users/me` | Get profile | Yes |
| PUT | `/api/users/me` | Update profile | Yes |
| POST | `/api/users/switch-role` | Switch rider/passenger | Yes |

## 🧪 Test Locally

```bash
# Build and run with Docker
docker build -t antar-auth .
docker run -p 7860:7860 antar-auth

# Or run with Go directly
go run main.go
```

## 📝 Example Requests

### Register
```bash
curl -X POST http://localhost:7860/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","phone_number":"+919876543210","password":"password123"}'
```

### Login
```bash
curl -X POST http://localhost:7860/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"+919876543210","password":"password123"}'
```

### Verify OTP (Demo)
```bash
curl -X POST http://localhost:7860/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"+919876543210","otp_code":"123456"}'
```

### Switch Role
```bash
curl -X POST http://localhost:7860/api/users/switch-role \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role":"rider"}'
```

## 🔧 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 7860 | Server port |
| `JWT_SECRET` | (change me) | JWT signing secret |
| `JWT_EXPIRY_HOURS` | 72 | Token expiry in hours |
| `DATABASE_PATH` | ./data | SQLite database path |
| `ENVIRONMENT` | development | production/development |
