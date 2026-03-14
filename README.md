# Food Waste Management Platform

Full-stack platform for rescuing surplus food and coordinating handoff between donors, NGOs, volunteers, and admins.

## What This Repo Contains

- `backend/`: Express + MongoDB API (auth, donation lifecycle, NGO matching, volunteer operations, admin analytics)
- `frontend/`: Primary React web app used by Docker deployment
- `src/` (root app): Secondary React client variant in the root workspace

The production Docker stack targets `frontend/` + `backend/`.

## Key Features

- Role-based access control: `donor`, `ngo`, `volunteer`, `admin`
- Full donation workflow: `available -> accepted -> pickedUp -> delivered` (+ `cancelled`)
- Freshness scoring with urgency hints
- Geo-aware nearest NGO suggestions
- Volunteer assignment and delivery confirmation
- Environmental impact tracking: meals, CO2 offset, water saved
- Admin dashboard with status, category, and monthly trend analytics

## Architecture

### Backend

- Runtime: Node.js, Express, Mongoose
- Auth: JWT bearer token
- Data store: MongoDB
- API base: `/api`
- Health check: `GET /api/health`

### Frontend

- Runtime: React + Vite + Axios
- API access: relative `/api` requests
- In Docker: served by Nginx, `/api` reverse-proxied to backend service

## Repository Structure

```text
food-waste/
	docker-compose.yml
	backend/
		src/
			config/
			controllers/
			middleware/
			models/
			routes/
			utils/
	frontend/
		src/
			components/
			context/
			pages/
			routes/
			services/
	src/
		components/
		context/
		pages/
		services/
```

## Quick Start (Docker, Recommended)

### 1. Start all services

```bash
docker compose up --build
```

### 2. Access

- Frontend: `http://localhost`
- Backend health: `http://localhost:5000/api/health`
- MongoDB: `mongodb://localhost:27017/food-waste`

### 3. Stop

```bash
docker compose down
```

### 4. Stop and remove DB volume

```bash
docker compose down -v
```

## Local Development (Without Docker)

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### Frontend (Primary)

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173` and proxies `/api` to backend `http://localhost:5000`.

### Root Frontend Variant

```bash
npm install
npm run dev
```

This runs the root app (`src/`) and currently proxies `/api` to `http://localhost:5001` via `vite.config.js`, which differs from backend default `5000`.

## Environment Configuration

Backend environment variables (`backend/.env.example`):

- `NODE_ENV`
- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `CLIENT_URL`

Security note: use a strong `JWT_SECRET` in any shared or production environment.

## API Surface (Summary)

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/donations`
- `POST /api/donations`
- `GET /api/donations/:id`
- `PATCH /api/donations/:id/cancel`
- `PATCH /api/donations/:id/accept`
- `POST /api/donations/:id/assign`
- `PATCH /api/donations/:id/pickup`
- `PATCH /api/donations/:id/deliver`
- `GET /api/volunteer/available`
- `GET /api/volunteer/assignments`
- `GET /api/volunteer/history`
- `GET /api/ngos`
- `GET /api/ngos/nearest`
- `GET /api/ngos/volunteers`
- `GET /api/admin/stats`
- `GET /api/admin/users`
- `PATCH /api/admin/users/:id/toggle`
- `GET /api/admin/donations`
- `PATCH /api/admin/donations/:id/cancel`

See module docs for details:

- `backend/README.md`
- `frontend/README.md`
- `src/README.md`

## Known Nuances

- Two frontend implementations exist: `frontend/` (primary) and root `src/` (secondary).
- Token storage keys differ between frontends (`fw_token` vs `token`).
- Dev proxy ports differ between frontends (`5000` vs `5001`).

## Engineering Notes

- API responses use a shared envelope via `sendResponse` utility.
- Error handling is centralized through custom `AppError` + global middleware.
- Donation freshness and impact are calculated server-side.
- Mongo geospatial indexes are used for NGO proximity queries.
