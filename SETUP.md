# CodeLens AI - Setup Guide

## Prerequisites

- Docker & Docker Compose
- OR_API_KEY from OpenRouter (https://openrouter.ai/keys)

## Quick Start

### 1. Set Environment Variables

Create a `.env` file in the project root:

```bash
# Required: Get from https://openrouter.ai/keys
OR_API_KEY=your_api_key_here

# Optional: Custom model (defaults to openrouter/auto)
OR_MODEL=openrouter/auto

# Optional: Custom base URL
OR_BASE=https://openrouter.ai/api/v1
```

Or pass as environment variables when running:

```bash
export OR_API_KEY=your_api_key_here
export OR_MODEL=openrouter/auto
docker compose up
```

### 2. Start Services

```bash
docker compose up
```

This starts:
- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:3000
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/grafana123)

### 3. Access the App

- Frontend: http://localhost:3000
- Create account or login
- Use the Editor to analyze code
- View history and stats on Dashboard

## Troubleshooting

### 401 Unauthorized Error

**Error**: `OpenRouter 401: Missing Authentication header`

**Solution**: Make sure `OR_API_KEY` is set:

```bash
# Check if it's exported
echo $OR_API_KEY

# If empty, set it
export OR_API_KEY=your_api_key_here
docker compose down
docker compose up
```

### Backend won't start

Check logs:
```bash
docker compose logs backend
```

Make sure all required environment variables are set:
- OR_API_KEY ✓
- MONGO_URI (auto-configured)
- REDIS_URL (auto-configured)
- JWT_SECRET (auto-configured)

### Frontend can't connect to backend

Make sure backend is healthy:
```bash
docker compose ps
curl http://localhost:5000/health
```

## Features

### Dashboard
- Real-time stats (auto-refreshes every 10s)
- Analysis trends by mode and language
- Prometheus metrics integration

### History
- Search, filter, and sort analyses
- Expand/collapse code snippets with syntax highlighting
- Copy code, re-run analysis, mark as favorite
- Bulk actions: delete, export as JSON
- Line count and character statistics

### Editor
- 8 programming languages supported
- 4 analysis modes: Review, Explain, Refactor, Test
- Chat follow-ups for deeper analysis
- Cache optimization (1-hour TTL)

## API Endpoints

```
POST   /api/auth/register          - Create account
POST   /api/auth/login             - Login
GET    /api/auth/me                - Get current user

POST   /api/analyze                - Run code analysis
POST   /api/analyze/chat           - Ask follow-up questions

GET    /api/history                - Get user analyses (paginated)
GET    /api/history/stats          - Get aggregate stats
DELETE /api/history/:id            - Delete analysis
```

## Monitoring

- **Prometheus**: Tracks metrics, latency, cache hits, DB operations
- **Grafana**: Pre-configured dashboard at http://localhost:3001
- Metrics refresh every 15 seconds
