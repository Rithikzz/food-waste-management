# Frontend Source Guide (`frontend/src/`)

Primary web client source code.

## Folders

- `components/`: reusable UI pieces (cards, tables, form controls, status indicators)
- `context/`: global auth state
- `pages/`: route-level screens
- `routes/`: route guard (`ProtectedRoute`)
- `services/`: Axios API client and endpoint modules

## App Composition

- Entry point: `main.jsx`
- Router + layout: `App.jsx`
- Global auth provider: `context/AuthContext.jsx`

## Data Flow

1. Page/component calls a function from `services/api.js`.
2. Axios interceptor injects JWT from localStorage (`fw_token`).
3. Backend returns standardized envelope (`{ success, message, data }`).
4. Page updates local component state and renders UI.

## Role-Aware UI

Protected routing and action buttons depend on role:

- Donor: create/cancel donations
- NGO: accept donations
- Volunteer: pickup/deliver assigned donations
- Admin: analytics + moderation views

## Design Notes

- Tailwind utility classes are used for layout and styling.
- Freshness and urgency are rendered from backend-computed fields.
- Donations support both card and table presentation modes.
