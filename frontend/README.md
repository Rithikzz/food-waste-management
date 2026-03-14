# Frontend App (`frontend/`)

Primary React client for the Food Waste platform. This is the frontend used in Docker deployment.

## Stack

- React 18
- Vite
- React Router
- Axios
- Tailwind CSS
- React Icons

## Directory Layout

```text
frontend/
  src/
    App.jsx
    main.jsx
    index.css
    components/
    context/
    pages/
    routes/
    services/
```

## Run Locally

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Start dev server

```bash
npm run dev
```

Default URL: `http://localhost:5173`

Dev proxy: `/api` -> `http://localhost:5000` (configured in `frontend/vite.config.js`).

## Build and Preview

```bash
npm run build
npm run preview
```

## Auth and Session

- Auth state is managed in `src/context/AuthContext.jsx`.
- JWT token is stored in localStorage key `fw_token`.
- API request interceptor attaches `Authorization: Bearer <token>`.
- Response interceptor clears token and redirects to `/login` on `401`.

## Routing

Defined in `src/App.jsx`.

Public routes:

- `/`
- `/login`
- `/register`

Protected routes:

- `/donate` (`donor`)
- `/donations` (any authenticated user)
- `/volunteer` (`volunteer`)
- `/admin` (`admin`)

Route guard is implemented in `src/routes/ProtectedRoute.jsx`.

## Page Modules

- `HomePage`: landing and product intro
- `LoginPage`: sign-in flow
- `RegisterPage`: role-aware sign-up flow
- `DonateFoodPage`: donation creation with freshness and NGO suggestions
- `DonationsPage`: table/cards view with search, status filter, urgent filter
- `VolunteerDashboard`: active assignments and delivery history
- `AdminDashboard`: platform analytics and donation oversight

## API Integration

API layer is in `src/services/api.js`:

- `authAPI`
- `donationsAPI`
- `volunteerAPI`
- `ngoAPI`
- `adminAPI`

All calls use `baseURL: /api`.

## UX Details

- Donation form submits backend-compatible payload shape (`quantity`, `pickupLocation`, timestamps).
- Freshness bars appear for actionable states (`available`, `accepted`).
- Urgent pickup badges and highlighting are driven by server-calculated `isUrgentPickup`.
- Admin dashboard consumes flat stats plus trend and category arrays from `/api/admin/stats`.

## Docker Deployment

`frontend/Dockerfile` builds static assets and serves with Nginx.

`frontend/nginx.conf`:

- serves SPA with `try_files ... /index.html`
- proxies `/api/` to `http://backend:5000`

The container exposes port `80`.

## Troubleshooting

- Blank data in UI: verify backend is running at `http://localhost:5000`.
- Frequent redirects to login: token may be invalid or expired.
- CORS issues in non-Docker dev: check backend `CLIENT_URL`.
- No nearest NGO suggestions: donation may have missing/zero coordinates.
