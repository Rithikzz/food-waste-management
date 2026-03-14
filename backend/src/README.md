# Backend Source Guide (`backend/src/`)

Internal API implementation for the backend service.

## Folders

- `config/`: infrastructure wiring (`db.js`)
- `controllers/`: request handlers and business logic
- `middleware/`: auth, RBAC, validation, and error handling
- `models/`: Mongoose schemas and indexes
- `routes/`: route-to-controller mapping
- `utils/`: shared helpers (token generation, scoring, matching, impact, response format)

## Request Flow

1. Route receives request.
2. Validation middleware runs (`express-validator` + `validateRequest`).
3. `protect` middleware verifies JWT when required.
4. `authorize` middleware validates role permissions.
5. Controller executes domain logic.
6. Controller returns standardized envelope via `sendResponse`.
7. Errors are forwarded to global error middleware.

## Core Utilities

- `freshnessScore.js`: computes donation freshness and labels
- `ngoMatcher.js`: geospatial NGO matching logic
- `impactCalculator.js`: converts delivered quantity into impact metrics
- `generateToken.js`: JWT creation
- `catchAsync.js`: async error wrapper for controllers
- `AppError.js`: operational error class

## Domain Lifecycle

Donation statuses:

- `available`
- `accepted`
- `pickedUp`
- `delivered`
- `cancelled`

Assignment statuses:

- `pending`
- `accepted`
- `inProgress`
- `completed`
- `rejected`
- `cancelled`
