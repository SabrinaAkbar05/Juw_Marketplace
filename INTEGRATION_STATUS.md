# JUW Marketplace — integration build (October 2026)

## Implemented in this build
- Firebase Admin authentication with authorized admin UID list.
- Products in Firestore (seller submission, admin moderation, public catalog).
- Sellers and seller verification status in Firestore.
- Orders in Firestore, with checkout stock decrements in a single Firestore transaction, server-calculated totals and COD only. Guest COD checkout is supported; signed-in buyers are linked by UID.
- Admin order status/payment status, support ticket replies/status, reviews and customer status update endpoints in Firestore.
- Seller-specific order views filter order line items by seller ID.
- Settings in Firestore (document `settings/marketplace`).
- Cloudinary secure seller image upload API: `POST /api/seller/images`, JSON `{ "image":"data:image/jpeg;base64,..." }`, Bearer Firebase token, 2 MB max image.
- Admin dashboard initializes with empty records and computes analytics from actual saved orders, rather than sample figures.
- Catalog initially shows empty real Firestore product listings rather than seed products. Categories/services are read from Firestore collections and may be empty.
- CORS supports comma-separated `FRONTEND_ORIGINS`, default 5173 and 5174.

## Important unfinished/needs live testing
- Cloudinary upload endpoint is implemented but Seller Portal still needs a file-picker/upload UI wired to it; seller product UI currently supports image URL entry.
- Some landing-page ventures/events and other marketing panels still reference static demo arrays. Treat them as sample content until migrated.
- Customer order history display still uses client context; connect authenticated `/api/orders/me` and customer login in the frontend for persistent order history.
- Support frontend creates an optimistic local ticket; authentication and request feedback need UI refinement.
- No real payment processor; only COD is accepted. Do NOT imply online payment was taken.
- Customer sign-up/auth flows and review submission require additional work.
- Customer carts remain browser-local, not Firestore or user-linked.
- API collections `customers`, `reviews`, `categories`, `services` start empty; do not import fake seed data.
- Direct client Firestore access should stay denied by rules; Firebase Admin SDK performs server writes.
- Production hardening required: rate limits, structured logging, image validation beyond MIME string, paginated queries, stronger input schema validation, multi-role authorization tests, and hosting.
- The live Firebase project, Cloudinary credentials and build are not accessible in this sandbox. Validate all workflows locally before presenting as end-to-end complete.

## Windows setup
1. Extract this ZIP. `npm install` from project root and `cd server && npm install` in another terminal.
2. Copy `.env.example` to `.env` at root. Add your Firebase **web** config and `VITE_API_URL=http://localhost:4000`.
3. Copy `server/.env.example` to `server/.env`. Configure `FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json`, `FIREBASE_ADMIN_UIDS`, Cloudinary variables and `FRONTEND_ORIGINS=http://localhost:5173,http://localhost:5174`.
4. Keep `server/firebase-service-account.json` local and NEVER commit it. Keep `.env` files private.
5. Start `cd server; npm start`. Check `http://localhost:4000/api/health`. Start frontend with `npm run dev` from root.
6. Test seller application -> admin verify -> seller product add -> admin approve -> customer catalog -> COD checkout -> admin order, in that order.
7. Old seller applications stored in `server/data.json` do NOT automatically transfer to Firestore. Re-apply with a fresh account or migrate verified real records manually using an audited, one-time script; do not delete old data without backup.

## Security notes
- The uploaded ZIP contained local environment files and node_modules; this deliverable deliberately excludes all `.env`, service account credentials, `data.json`, `node_modules` and compiled builds.
- Firebase `configured:true` means the Admin SDK initialized. It does not guarantee permissions, data migration or full end-to-end readiness.
- Avoid publicly exposing the backend without adding abuse protection and completing authorization review.
