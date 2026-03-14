# Food Waste Management System

Full-stack application for food donation lifecycle management.

## Codebase Analysis

### High-level structure

- `backend/`: Express + MongoDB REST API with auth, donations, NGOs, volunteer, and admin modules.
- `frontend/`: React + Vite client with dashboards and donation flows.
- `src/` (root): another React app snapshot/variant (likely older or parallel implementation).

### Runtime observations

- Backend supports configurable `PORT`, Mongo via `MONGO_URI`, JWT auth via `JWT_SECRET`.
- API health endpoint is `GET /api/health`.
- Frontend API client uses relative `/api` routes, so reverse proxying works well in containers.
- Port mismatch exists in current local configs:
	- `frontend/vite.config.js` proxies to `5000`
	- root `vite.config.js` proxies to `5001`
- Repository currently contains `backend/.env` with sensitive values. Rotate credentials and keep only `.env.example` in source control.

## Dockerized Setup

This repository now includes:

- `docker-compose.yml`: MongoDB + backend + frontend orchestration
- `backend/Dockerfile`: production Node API image
- `frontend/Dockerfile`: multi-stage build (Vite build -> Nginx runtime)
- `frontend/nginx.conf`: SPA routing + `/api` proxy to backend
- `.dockerignore` files for backend/frontend

### Start everything

```bash
docker compose up --build
```

### Access services

- Frontend: `http://localhost`
- Backend health: `http://localhost:5000/api/health`
- MongoDB: `mongodb://localhost:27017/food-waste`

### Stop

```bash
docker compose down
```

### Stop and remove DB volume

```bash
docker compose down -v
```

## Environment notes

- Compose injects backend env vars directly, including a placeholder JWT secret.
- Update `JWT_SECRET` for production deployment.
- If needed, move env vars to a dedicated env file and reference it from `docker-compose.yml`.
