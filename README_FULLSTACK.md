# JUW Marketplace – Full-stack integration build

## Includes
- Existing React/TypeScript customer storefront and administrative screens, refreshed styling.
- New Node.js HTTP API in `server/` with JSON-file persistence and atomic saves.
- Public catalog, server-validated ordering with server-side pricing and stock decrements, support ticket creation.
- Firebase Admin token verification and allowlisted admin UIDs for privileged endpoints.
- Customer checkout connected to the backend; catalog loads from backend; cart and wishlist persist locally.
- Admin product, order, ticket, settings actions are connected to authenticated APIs and refreshed after save. Some secondary seller/customer/review actions still use local state.

## Local setup
1. Open project in VS Code, run `npm install`, then `npm run dev`.
2. In another terminal: `cd server` then `npm install` then `npm start`.
3. Frontend `.env` should contain `VITE_API_URL=http://localhost:4000`. Use `.env.example`.
4. Server environment settings: `PORT=4000`, `FRONTEND_ORIGIN=http://localhost:5173`.
5. For admin API access create a Firebase project, enable an Authentication sign-in provider, download the Firebase **service account JSON**, keep it outside public directories, set `FIREBASE_SERVICE_ACCOUNT_PATH` and `FIREBASE_ADMIN_UIDS` (comma-separated Firebase UIDs). **Never** put service-account credentials into `VITE_` environment variables.
6. Fetch the user's Firebase ID token from your frontend auth client and send it as `Authorization: Bearer <token>` when calling `/api/admin/*`.

## Limitations / launch blockers
- The current storefront has mock legacy user/previous orders and support views; newly submitted checkout orders flow to server and UI confirmation; customer order history lookup still needs account-based authentication. Admin secondary seller/customer/review sections remain partially mock-state based. Orders list reflects backend state after successful admin sign-in.
- Firebase Email/Password admin login is implemented through the Firebase REST sign-in endpoint. Customer accounts and full signup flows are not implemented.
- Payment methods are recorded but **no payment gateway or payment verification is connected**. Never mark an order PAID without payment provider or manual admin verification.
- File-backed JSON storage is useful for development or a single server instance, **not for production scale or serverless**. Use Firestore or PostgreSQL and transactional stock reservation for launch.
- CORS is restricted to configured origin; production also requires HTTPS, abuse/rate controls, authenticated order lookup, input validation hardening, audit logs and deployment setup.
- `server/data.json` is local persistent state and is ignored in git; removing it resets server data to seed catalog.
- Existing seller information is not revealed by the public API; catalog returns only product properties. Keep seller contact hidden in the customer UI.

## API paths
`GET /api/health`, `GET /api/catalog`, `GET /api/products/:id`, `POST /api/orders`, `POST /api/support`.
Firebase-protected admin: `GET /api/admin/bootstrap`, `POST /api/admin/products`, `PATCH/DELETE /api/admin/products/:id`, `PATCH /api/admin/orders/:id`, `PATCH /api/admin/support/:id`, `PATCH /api/admin/settings`.
