# Backend API (`backend/`)

Express + MongoDB API for the Food Waste platform.

## Stack

- Node.js (ES modules)
- Express 4
- MongoDB + Mongoose
- JWT authentication
- `express-validator` request validation

## Directory Layout

```text
backend/
  server.js
  src/
    app.js
    config/
      db.js
    controllers/
    middleware/
    models/
    routes/
    utils/
```

## Run Locally

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Required variables:

- `NODE_ENV=development`
- `PORT=5000`
- `MONGO_URI=mongodb://localhost:27017/food-waste`
- `JWT_SECRET=<strong-secret>`
- `JWT_EXPIRES_IN=7d`
- `CLIENT_URL=http://localhost:5173`

### 3. Start

```bash
npm run dev
```

Health endpoint:

```http
GET /api/health
```

## Scripts

- `npm start`: Start production server (`node server.js`)
- `npm run dev`: Start with nodemon

## API Modules

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (protected)

### Donations

- `GET /api/donations` (role-scoped listing)
- `POST /api/donations` (donor only)
- `GET /api/donations/:id`
- `PATCH /api/donations/:id/cancel` (donor/admin)
- `PATCH /api/donations/:id/accept` (ngo)
- `POST /api/donations/:id/assign` (ngo)
- `PATCH /api/donations/:id/pickup` (volunteer)
- `PATCH /api/donations/:id/deliver` (volunteer)

### Volunteer

- `GET /api/volunteer/available`
- `GET /api/volunteer/assignments`
- `GET /api/volunteer/history`

### NGOs

- `GET /api/ngos`
- `GET /api/ngos/nearest?lng=&lat=&maxDistance=`
- `GET /api/ngos/volunteers` (ngo/admin)

### Admin

- `GET /api/admin/stats`
- `GET /api/admin/users?role=&isActive=&page=&limit=`
- `PATCH /api/admin/users/:id/toggle`
- `GET /api/admin/donations?status=&page=&limit=`
- `PATCH /api/admin/donations/:id/cancel`

## Role-Based Access

Roles are defined in `src/utils/constants.js`:

- `donor`
- `ngo`
- `volunteer`
- `admin`

`protect` middleware enforces authentication.
`authorize(...)` middleware enforces role permissions.

## Core Domain Lifecycle

Donation statuses:

1. `available`
2. `accepted`
3. `pickedUp`
4. `delivered`
5. `cancelled`

Typical flow:

1. Donor creates donation.
2. NGO accepts donation.
3. NGO assigns volunteer (or volunteer self-assigns during pickup if unassigned).
4. Volunteer marks pickup.
5. Volunteer marks delivered.
6. Delivery and impact logs are persisted.

## Data Models

- `User`: identity + role + location (+ optional NGO profile)
- `Donation`: food listing, freshness, lifecycle, assignments, impact
- `VolunteerAssignment`: NGO-volunteer handoff state
- `Delivery`: pickup/delivery proof and status
- `ImpactLog`: immutable analytics record per successful delivery

## Important Behaviors

- Freshness score is computed at creation and refreshed during reads.
- Donation creation can suggest nearest NGOs using geospatial lookup.
- Environmental impact is calculated when delivery is confirmed.
- `sendResponse` utility normalizes API response shape.
- Errors are centralized through `AppError` + global middleware.

## Response Envelope

Most endpoints respond in this structure:

```json
{
  "success": true,
  "message": "...",
  "data": { }
}
```

## Docker

This service is containerized with `backend/Dockerfile` and is started by root `docker-compose.yml` as service `backend` on port `5000`.

## Troubleshooting

- `MONGO_URI is not defined`: verify `.env` exists and is loaded.
- CORS errors: align `CLIENT_URL` with frontend dev origin.
- `401 Unauthorized`: ensure JWT is sent in `Authorization: Bearer <token>`.
- Nearest NGO search empty: verify donation has real coordinates (not `[0, 0]`).
