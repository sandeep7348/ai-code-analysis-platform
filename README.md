
# CodeLens AI

<p align="center">
  <b>AI-Powered Intelligent Code Analysis Platform</b>
</p>

<p align="center">
  Automated Code Review • Refactoring • Test Generation • Observability • Analytics
</p>

---

## 📖 Overview

**CodeLens AI** is a production-style full-stack platform that leverages Large Language Models (LLMs) to provide intelligent code analysis capabilities for developers. 

The platform enables automated code review, code explanation, refactoring suggestions, and unit test generation through **OpenRouter-powered AI** integration while maintaining enterprise-grade observability, caching, authentication, and monitoring infrastructure.

---

## ✨ Key Features

* **AI Analysis:** Automated code review, natural language explanations, and refactoring suggestions.
* **Test Generation:** Instant AI-generated unit tests for multiple programming languages.
* **Security:** Secure JWT-based authentication and user authorization.
* **Performance:** Redis caching layer for optimized API response times and LLM costs.
* **Persistence:** MongoDB-based storage for analysis history and user data.
* **Observability:** Real-time Prometheus metrics and interactive Grafana dashboards.
* **Deployment:** Fully Dockerized multi-service environment for easy setup.

---

## 🏗 System Architecture

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

## 🛠 Technology Stack

### Frontend

* **Framework:** React.js
* **State/Data:** Axios, Recharts
* **UI/UX:** React Hot Toast

### Backend

* **Runtime:** Node.js (Express.js)
* **Database:** MongoDB
* **Cache:** Redis
* **Security:** JWT Authentication
* **Logging:** Winston

### AI & DevOps

* **LLM Provider:** OpenRouter API
* **Containerization:** Docker, Docker Compose
* **Monitoring:** Prometheus, Grafana

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone [https://github.com/sandeep7348/ai-code-analysis-platform.git](https://github.com/sandeep7348/ai-code-analysis-platform.git)
cd ai-code-analysis-platform

```

### 2. Environment Configuration

Create a `.env` file in the `backend/` directory:

```env
OR_API_KEY=your_openrouter_api_key
OR_BASE=[https://openrouter.ai/api/v1](https://openrouter.ai/api/v1)
OR_MODEL=meta-llama/llama-3.3-8b-instruct:free
PORT=5000
JWT_SECRET=your_secure_jwt_secret
CORS_ORIGIN=http://localhost:3000
MONGO_URI=mongodb://mongodb:27017/codelens
REDIS_URL=redis://redis:6379

```

### 3. Run Application

```bash
docker-compose up --build

```

---

## 📊 Application Services

| Service | URL |
| --- | --- |
| **Frontend** | `http://localhost:3000` |
| **Backend API** | `http://localhost:5000` |
| **Grafana Dashboard** | `http://localhost:3001` |
| **Prometheus Metrics** | `http://localhost:9090` |

---

## 🔌 API Reference

### AI Analysis

`POST /api/analyze`

**Payload:**

```json
{
  "code": "function add(a, b) { return a + b }",
  "language": "javascript",
  "mode": "review" 
}

```

*Supported Modes: `review`, `explain`, `refactor`, `test*`

---

## 📈 Monitoring & Observability

The platform includes integrated monitoring for performance analysis:

* API request rates and duration analytics.
* AI Model response latency.
* Redis cache hit/miss ratio.
* **Grafana Credentials:** `admin` / `grafana123`

---

## 📸 Screenshots

<p align="center">
<b>Main Dashboard</b>




<img src="./screenshots/dashboard.png" width="800" alt="CodeLens Dashboard">
</p>

<p align="center">
<b>AI Analysis Results</b>




<img src="./screenshots/analysis.png" width="800" alt="AI Analysis">
</p>

<p align="center">
<b>Grafana Monitoring</b>




<img src="./screenshots/grafana.png" width="800" alt="Grafana Metrics">
</p>

---

## 👤 Author

**Sandeep Choudhary**
[GitHub Profile](https://github.com/sandeep7348)

```

```
