# Truck Sales & Marketing Platform

A real-time web application for truck sales and marketing with multi-role authentication, advanced search, live chat, analytics, and AI-based recommendations.

## Live Demo

- **Frontend:** https://house-price-app-5prja65z.devinapps.com
- **Backend API:** https://app-gfdfimhs.fly.dev

## Features

- **Multi-Role Authentication** — Admin, Dealer, and Customer roles with JWT-based auth
- **Truck Listings** — Full CRUD with images, specifications, and availability status
- **Advanced Search & Filtering** — Filter by brand, fuel type, condition, price range, load capacity
- **Lead Generation & Inquiry Management** — Submit and track inquiries with status updates
- **Booking System** — Book trucks with status management (pending/confirmed/completed/cancelled)
- **Live Chat** — Real-time messaging between customers and dealers
- **Analytics Dashboard** — Sales trends, lead statistics, revenue tracking with charts
- **In-App Notifications** — Notification center with mark-as-read functionality
- **AI Recommendations** — Suggests trucks based on browsing behavior
- **Mobile Responsive** — Fully responsive design with Tailwind CSS
- **Docker Ready** — Dockerfile for both backend and frontend + docker-compose.yml

## Tech Stack

### Backend
- **Framework:** FastAPI (Python)
- **Database:** SQLite with persistent volume support
- **Auth:** JWT with bcrypt password hashing
- **Real-time:** WebSocket support for inventory updates and chat

### Frontend
- **Framework:** React + Vite + TypeScript
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Icons:** Lucide React
- **HTTP Client:** Axios
- **Routing:** React Router DOM

## Getting Started

### Backend Setup

```bash
cd backend
pip install poetry
poetry install
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Docker Setup

```bash
cd backend
docker-compose up --build
```

This starts both the backend (port 8000) and frontend (port 3000).

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | Register a new user |
| `/auth/login` | POST | Login and get JWT token |
| `/auth/me` | GET | Get current user info |
| `/trucks` | GET | List trucks with filtering |
| `/trucks/{id}` | GET | Get truck details |
| `/trucks` | POST | Create truck listing (dealer/admin) |
| `/trucks/{id}` | PUT | Update truck (dealer/admin) |
| `/trucks/{id}` | DELETE | Delete truck (dealer/admin) |
| `/leads` | GET/POST | Lead/inquiry management |
| `/bookings` | GET/POST | Booking management |
| `/chat/messages` | GET/POST | Chat messages |
| `/chat/conversations` | GET | List conversations |
| `/notifications` | GET | Get notifications |
| `/analytics/dashboard` | GET | Dashboard analytics |
| `/recommendations` | GET | AI truck recommendations |

## Test Accounts

| Role | Username | Password |
|------|----------|----------|
| Dealer | demo_dealer | demo123 |

Or register a new account as Customer or Dealer.

## Project Structure

```
truck-sales/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app with CORS, WebSocket, routes
│   │   ├── database.py       # SQLite database setup and schema
│   │   ├── auth.py           # JWT authentication utilities
│   │   ├── models/           # Pydantic models
│   │   └── routers/          # API route handlers
│   │       ├── auth_router.py
│   │       ├── trucks_router.py
│   │       ├── leads_router.py
│   │       ├── bookings_router.py
│   │       ├── chat_router.py
│   │       ├── notifications_router.py
│   │       ├── analytics_router.py
│   │       └── recommendations_router.py
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # Main app with routing
│   │   ├── context/          # Auth context
│   │   ├── components/       # Navbar, ProtectedRoute
│   │   ├── pages/            # All page components
│   │   └── services/         # API client
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
└── README.md
```
