# CodeLens AI

<p align="center">
  <b>AI-Powered Intelligent Code Analysis Platform</b>
</p>

<p align="center">
  Automated Code Review • Refactoring • Test Generation • Observability • Analytics
</p>

---

## Overview

CodeLens AI is a production-style full-stack platform that leverages Large Language Models (LLMs) to provide intelligent code analysis capabilities for developers.

The platform enables automated code review, code explanation, refactoring suggestions, and unit test generation through OpenRouter-powered AI integration while maintaining enterprise-grade observability, caching, authentication, and monitoring infrastructure.

---

# Key Features

- AI-powered code review and analysis
- Intelligent code explanation in natural language
- Automated code refactoring suggestions
- AI-generated unit tests
- JWT authentication and authorization
- MongoDB-based history persistence
- Redis caching layer for optimized performance
- Prometheus metrics collection
- Grafana monitoring dashboards
- Dockerized multi-service deployment
- Real-time analytics dashboard
- Multi-language support

---

# System Architecture

```text
Frontend (React.js)
        │
        ▼
Backend API (Express.js)
        │
 ┌──────┴──────┐
 ▼             ▼
MongoDB      Redis
(Storage)    (Caching)
        │
        ▼
OpenRouter API
(LLM Integration)
        │
        ▼
Prometheus + Grafana
(Monitoring & Analytics)
```

---

# Technology Stack

## Frontend
- React.js
- Axios
- Recharts
- React Hot Toast

## Backend
- Node.js
- Express.js
- MongoDB
- Redis
- JWT Authentication
- Winston Logger

## AI Integration
- OpenRouter API
- Large Language Models (LLMs)

## Monitoring & DevOps
- Docker
- Docker Compose
- Prometheus
- Grafana

---

# Project Structure

```text
codelens-ai/
│
├── backend/
│   ├── routes/
│   ├── src/
│   │   ├── middleware/
│   │   ├── metrics/
│   │   ├── models/
│   │   └── index.js
│   │
│   ├── Dockerfile
│   ├── package.json
│   └── .env
│
├── frontend/
│
├── grafana/
├── prometheus/
│
├── docker-compose.yml
└── README.md
```

---

# Environment Configuration

Create a `.env` file inside the backend directory.

```env
OR_API_KEY=your_openrouter_api_key

OR_BASE=https://openrouter.ai/api/v1

OR_MODEL=meta-llama/llama-3.3-8b-instruct:free

PORT=5000

JWT_SECRET=your_secure_jwt_secret

CORS_ORIGIN=http://localhost:3000

MONGO_URI=mongodb://mongodb:27017/codelens

REDIS_URL=redis://redis:6379
```

---

# Installation

## Clone Repository

```bash
git clone https://github.com/your-username/codelens-ai.git

cd codelens-ai
```

---

# Run Application

```bash
docker compose up --build
```

---

# Application Services

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| Grafana Dashboard | http://localhost:3001 |
| Prometheus Metrics | http://localhost:9090 |

---

# API Endpoints

## Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Authenticate user |
| GET | `/api/auth/me` | Get authenticated user |

---

## AI Analysis

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/analyze` | Analyze submitted code |

### Supported Analysis Modes

- `review`
- `explain`
- `refactor`
- `test`

---

## History

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/history` | Fetch analysis history |
| GET | `/api/history/stats` | Fetch dashboard analytics |
| DELETE | `/api/history/:id` | Delete analysis |

---

# Example API Request

```json
{
  "code": "console.log('Hello World')",
  "language": "javascript",
  "mode": "review"
}
```

---

# Monitoring & Observability

The platform includes integrated monitoring infrastructure for performance analysis and operational insights.

## Metrics Tracked

- API request rates
- AI response latency
- Redis cache hit ratio
- MongoDB operations
- Request duration analytics
- Backend health status

---

## Grafana Credentials

```text
Username: admin
Password: grafana123
```

---

# Supported Languages

- JavaScript
- TypeScript
- Python
- C++
- Java
- Go
- Rust

---

# Future Enhancements

- GitHub integration
- Real-time collaboration
- AI coding assistant
- Team workspaces
- Exportable reports
- Secure code execution sandbox
- CI/CD integration

---

# Author

**Sandeep Choudhary**

---


---

# Screenshots

Add project screenshots here:

- Dashboard
- AI Analysis
- History Page
- Grafana Monitoring
- Prometheus Metrics
