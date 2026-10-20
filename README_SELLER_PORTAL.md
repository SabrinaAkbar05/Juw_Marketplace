# JUW Marketplace — three-portal full-stack development edition

This project combines **Customer** (`/`), **Seller** (`/seller`) and **Admin** (`/admin`) experiences.

## Start locally
1. Requires Node.js 20+ (Node.js 22 recommended).
2. `npm install` in the `juw-shop` folder.
3. `cd server && npm install` for the API, then return to the project root.
4. Copy `.env.example` to `.env`, set `VITE_FIREBASE_API_KEY` and `VITE_API_URL=http://localhost:4000`.
5. Copy `server/.env.example` to `server/.env` and set `FIREBASE_SERVICE_ACCOUNT_PATH` to the JSON path, `FIREBASE_ADMIN_UIDS` to approved admin Firebase UIDs.
6. Start backend: `cd server && npm start` (environment variables must be supplied by your shell or dotenv runner; the zero-dependency HTTP entrypoint does not automatically load `.env`). For Node 22+, you can use `node --env-file=.env index.mjs` from `server`.
7. In a second terminal run `npm run dev` from the project root.

## Seller onboarding
- Enable Email/Password in Firebase Authentication and create seller accounts in the Firebase Console (or implement self-registration, not provided here).
- A signed-in user can submit a seller application at `/seller`.
- An authorized admin reviews the application at `/admin/sellers` and approves it.
- The approved seller can submit products for moderation, edit their own products (which resubmits them for approval), review inventory, and see orders containing their products.
- Admin approves pending products at `/admin/approvals`.
- Seller-only endpoints verify the Firebase ID token and link to one seller record by `firebaseUid`.
- Sample seller records shipped as seeded demonstration data have no linked Firebase UID; those accounts cannot sign in until onboarded.

## Scope and limitations
This is a working **development foundation**, not production-ready software. The API persists to `server/data.json` (created on first write), not a hosted database; storage is single-process only. Checkout supports order placement and stock validation, but real payment verification, refunds, notification delivery, transactional inventory control, hosting, comprehensive security and end-to-end testing require additional work. The customer pages and some admin sections still include legacy mock/state behavior. Firebase keys and authorized UIDs are not included. For production, migrate persistence to a transactional database and implement audit logging, rate limits, input validation, resilient token refresh, media upload, and signed-in customer order ownership. No direct buyer-to-seller messaging is included.

## Files
- `src/pages/seller/SellerPortal.tsx` — responsive seller dashboard and onboarding.
- `server/index.mjs` — seller and admin APIs.
- `src/context/AdminContext.tsx` — server-backed seller approve/suspend actions.
- `src/App.tsx` — portal routing.

This package includes a lightweight web-optimized hero video to avoid the previous 52 MB download issue.
