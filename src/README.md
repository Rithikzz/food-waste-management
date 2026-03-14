# Root Frontend Variant (`src/`)

This directory contains a second React client implementation at repository root.

## Why It Exists

The repo currently has two frontend code paths:

- `frontend/` (primary, Docker-targeted, React 18)
- root `src/` (secondary variant, React 19 dependencies at root)

Use this app only if you intentionally want to run the root workspace frontend.

## Run This Variant

From repo root:

```bash
npm install
npm run dev
```

## Important Differences vs `frontend/`

- Local storage token key is `token` (not `fw_token`).
- `vite.config.js` proxies `/api` to `http://localhost:5001`.
- Includes `DonationContext` abstraction used by this variant.

If backend runs on `5000` (default), update root `vite.config.js` proxy or run backend on `5001`.

## Structure

```text
src/
  App.jsx
  main.jsx
  components/
  context/
    AuthContext.jsx
    DonationContext.jsx
  pages/
  services/api.js
```

## Recommendation

For team development and containerized runs, prefer `frontend/`.
