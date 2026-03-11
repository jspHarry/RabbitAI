# Sales Insight Automator

> **Rabbitt AI — AI Cloud DevOps Engineer Assessment**  
> Upload CSV/XLSX sales data → Groq Llama 3 generates an executive briefing → Delivered to your inbox.

---

## Live Demo

| Service | URL |
|---|---|
| Frontend | `https://sales-insight.vercel.app` *(replace with your deploy URL)* |
| Backend API | `https://sales-insight-api.onrender.com` *(replace with your deploy URL)* |
| Swagger Docs | `https://sales-insight-api.onrender.com/api/docs` |

---

## Architecture Overview

```
┌──────────────────────┐      multipart/form-data      ┌────────────────────────┐
│   Next.js Frontend   │ ───────────────────────────►  │  Express.js Backend     │
│   (Vercel)           │ ◄─────────────────────────── │  (Render)               │
└──────────────────────┘      JSON response            └────────┬───────────────┘
                                                                │
                                          ┌─────────────────────┼─────────────────────┐
                                          ▼                     ▼                     ▼
                                   ┌─────────────┐    ┌───────────────┐    ┌────────────────┐
                                   │  CSV/XLSX   │    │  Groq API     │    │  SMTP/Email    │
                                   │  Parser     │    │  Llama 3-70b  │    │  (Nodemailer)  │
                                   └─────────────┘    └───────────────┘    └────────────────┘
```

**Flow:**
1. User uploads `.csv` or `.xlsx` and enters recipient email
2. Multer parses and validates the file (type, size, content)
3. `csv-parse` / `xlsx` converts the file to a structured text preview
4. Groq Llama 3-70b generates a 4-section executive briefing
5. Nodemailer sends a styled HTML email to the recipient
6. Frontend displays success/error state in real-time

---

## Running Locally with Docker Compose

### Prerequisites
- Docker & Docker Compose v2+
- A [Groq API Key](https://console.groq.com/keys)
- SMTP credentials (e.g. [Gmail App Password](https://support.google.com/accounts/answer/185833))

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/your-org/sales-insight-automator.git
cd sales-insight-automator

# 2. Configure backend environment
cp backend/.env.example backend/.env
# Edit backend/.env — fill in GROQ_API_KEY, SMTP_* values

# 3. Configure frontend environment
cp frontend/.env.example frontend/.env
# NEXT_PUBLIC_API_URL defaults to http://localhost:4000 — no change needed locally

# 4. Start the entire stack
docker compose up --build

# Frontend → http://localhost:3000
# Backend  → http://localhost:4000
# Swagger  → http://localhost:4000/api/docs
```

### Stopping
```bash
docker compose down
```

---

## Running Without Docker (Development)

```bash
# Backend
cd backend
npm install
cp .env.example .env    # fill in your values
npm run dev             # starts on :4000 with nodemon

# Frontend (new terminal)
cd frontend
npm install
cp .env.example .env
npm run dev             # starts on :3000
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | HTTP port (default: `4000`) |
| `FRONTEND_URL` | No | CORS origin allow-list |
| `API_KEY` | No | If set, all API requests must include `x-api-key: <value>` header |
| `GROQ_API_KEY` | **Yes** | Groq console API key |
| `SMTP_HOST` | **Yes** | SMTP server hostname |
| `SMTP_PORT` | No | SMTP port (default: `587`) |
| `SMTP_SECURE` | No | `"true"` for port 465 TLS |
| `SMTP_USER` | **Yes** | SMTP login / sender address |
| `SMTP_PASS` | **Yes** | SMTP password or app password |
| `BACKEND_URL` | No | Public URL shown in Swagger (for deployed env) |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | No | Backend base URL (default: `http://localhost:4000`) |
| `NEXT_PUBLIC_API_KEY` | No | Forwarded as `x-api-key` header if backend key auth is enabled |

---

## Security Implementation

### 1. HTTP Header Hardening (Helmet)
`helmet` is applied globally and sets secure defaults: `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Content-Security-Policy`, and more. This defends against a wide range of injection and clickjacking attacks.

### 2. Rate Limiting
Two layers of rate limiting via `express-rate-limit`:
- **General limiter**: 60 requests/minute per IP across all `/api` routes
- **Upload limiter**: 20 requests/15-minutes per IP on `POST /api/upload`

This prevents brute-force abuse, DoS through resource exhaustion (Groq API costs, SMTP limits), and enumeration attacks.

### 3. API Key Authentication
An optional bearer-style `x-api-key` guard middleware is applied before all routes. When `API_KEY` is set in the environment, every inbound request must supply a matching header — otherwise the server returns `401 Unauthorized`. This provides a lightweight access control layer suitable for internal tooling without the overhead of OAuth.

### 4. File Upload Validation (Defense-in-Depth)
Multer is configured with:
- **Extension allowlist**: only `.csv`, `.xlsx`, `.xls` accepted at the filter level
- **10 MB hard limit**: prevents large payload attacks
- **Memory storage** (not disk): files never touch the filesystem — parsed in-memory and discarded after the request, reducing surface area for path traversal or stale file attacks

### 5. Input Sanitization
Recipient email is validated server-side with a regex before any downstream call is made — preventing injection into email headers.

### 6. Non-root Docker User
Both Dockerfiles create a dedicated `appuser` system account and switch to it before starting the process (`USER appuser`). Even if a process is compromised, it cannot modify system files.

### 7. CORS
`cors` is configured to only allow the `FRONTEND_URL` origin in production, blocking unauthorized cross-origin requests.

---

## CI/CD Pipeline

GitHub Actions (`.github/workflows/ci.yml`) triggers on all Pull Requests to `main`:

| Job | Steps |
|---|---|
| `backend` | Checkout → Node setup → `npm ci` → ESLint → Docker build |
| `frontend` | Checkout → Node setup → `npm ci` → ESLint → `next build` → Docker build |
| `compose-check` | `docker compose config` syntax validation |

The pipeline ensures no broken builds or lint regressions reach `main`.

---

## API Reference

Full interactive documentation is available at `/api/docs` (Swagger UI).

### `POST /api/upload`
Upload a sales data file and trigger AI analysis + email delivery.

**Headers**
```
Content-Type: multipart/form-data
x-api-key: <your-key>  (if API_KEY env is set)
```

**Form fields**
| Field | Type | Description |
|---|---|---|
| `file` | File | `.csv` or `.xlsx`, max 10 MB |
| `email` | string | Recipient email for the briefing |

**200 Response**
```json
{
  "message": "Analysis complete. Briefing sent to your inbox.",
  "rowsAnalyzed": 6,
  "recipient": "exec@company.com"
}
```

### `GET /api/health`
Returns `{ "status": "ok", "timestamp": "..." }` — useful for Render/uptime monitors.

---

## Project Structure

```
sales-insight-automator/
├── backend/
│   ├── src/
│   │   ├── index.js              # Express app, middleware wiring
│   │   ├── swagger.js            # OpenAPI spec config
│   │   ├── routes/
│   │   │   └── upload.js         # POST /api/upload with JSDoc annotations
│   │   ├── services/
│   │   │   ├── parser.js         # CSV + XLSX → text preview
│   │   │   ├── groq.js           # Groq Llama 3 prompt + completion
│   │   │   └── email.js          # Nodemailer HTML email sender
│   │   └── middleware/
│   │       └── security.js       # Rate limiters + API key guard
│   ├── Dockerfile                # Multi-stage, non-root
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── app/
│   │   ├── layout.js             # Root layout + Google Fonts
│   │   ├── page.js               # Home page
│   │   └── globals.css           # Design system variables
│   ├── components/
│   │   └── UploadForm.jsx        # File drop zone, email input, status states
│   ├── Dockerfile                # Multi-stage Next.js standalone
│   ├── next.config.js
│   └── .env.example
├── .github/
│   └── workflows/
│       └── ci.yml                # PR validation pipeline
├── docker-compose.yml            # Full stack orchestration
└── README.md
```

---

## Deployment

### Backend → Render
1. Connect your GitHub repo to [Render](https://render.com)
2. Create a **Web Service**, set root dir to `backend/`
3. Build command: `npm ci` · Start command: `node src/index.js`
4. Add all environment variables from `backend/.env.example`

### Frontend → Vercel
1. Import the repo on [Vercel](https://vercel.com)
2. Set the root directory to `frontend/`
3. Add `NEXT_PUBLIC_API_URL` pointing to your Render backend URL

---

## Sample Test Data

The `sales_q1_2026.csv` below can be used for end-to-end testing:

```csv
Date,Product_Category,Region,Units_Sold,Unit_Price,Revenue,Status
2026-01-05,Electronics,North,150,1200,180000,Shipped
2026-01-12,Home Appliances,South,45,450,20250,Shipped
2026-01-20,Electronics,East,80,1100,88000,Delivered
2026-02-15,Electronics,North,210,1250,262500,Delivered
2026-02-28,Home Appliances,North,60,400,24000,Cancelled
2026-03-10,Electronics,West,95,1150,109250,Shipped
```

---

*Built for the Rabbitt AI AI Cloud DevOps Engineer assessment.*
