# JUW Marketplace — Netlify Full-Stack Deployment Guide

This guide details how to deploy the **JUW Marketplace** full-stack application (React/Vite frontend + Node.js/Firestore backend) onto **Netlify** using a single GitHub repository and a single unified public website domain.

---

## 1. Architecture Overview

```
                      https://<your-site>.netlify.app
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
            /api/* (API Calls)              /* (Web Routes)
                    │                               │
                    ▼                               ▼
       /.netlify/functions/api/:splat          dist/index.html
                    │                        (React SPA Router)
                    ▼
          netlify/functions/api.mjs
                    │
                    ▼
             server/index.mjs
      (Serverless Express/Node Handler)
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
  Cloud Firestore         Cloudinary
(Authoritative DB)     (Image Storage)
```

- **Single Domain:** Frontend and backend communicate via relative `/api/...` endpoints on the same domain (e.g., `https://juw-shop.netlify.app/api/catalog`).
- **No CORS Friction:** Same-origin requests in production eliminate cross-origin restrictions.
- **Serverless Backend:** `server/index.mjs` executes inside Netlify Functions without calling `app.listen()`.
- **Authoritative Database:** Cloud Firestore manages products, categories, orders, sellers, users, and audit logs.
- **Cloudinary Integration:** Product and category images are uploaded via serverless base64 endpoints directly to Cloudinary.

---

## 2. Pre-Deployment Git Checklist

Make sure sensitive files are **NEVER** committed to Git. The project `.gitignore` is already pre-configured to exclude:

```gitignore
.env
.env.*
!.env.example
*.local
firebase-service-account*.json
*service-account*.json
.netlify
node_modules
dist
```

### Initializing Git & Pushing to GitHub
```bash
# Push latest commit containing bundling and credential fixes:
git push origin main

# NOTE: If Netlify Secret Scanner flags earlier commit history:
# Squash into a single clean commit and force push:
git reset --soft HEAD~1
git commit -m "feat: complete full-stack JUW Marketplace for Netlify deployment"
git push -f origin main
```

---

## 3. Netlify Project Setup

1. Log in to [Netlify](https://app.netlify.com/).
2. Click **Add new site** > **Import an existing project**.
3. Select **GitHub** and authorize access to your `juw-shop` repository.
4. Verify the **Build settings** (Netlify will read these automatically from `netlify.toml`):
   - **Base directory:** *(leave blank / project root)*
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Functions directory:** `netlify/functions`
5. Do **NOT** click "Deploy" immediately — configure your Environment Variables first (see below).

---

## 4. Environment Variables Configuration

In Netlify, go to **Site configuration** > **Environment variables** > **Add a variable** (or **Import from .env**).

Add the following required variables:

### A. Frontend Environment Variables (Vite)
| Variable Name | Description | Example / Location |
| :--- | :--- | :--- |
| `VITE_API_URL` | Leave **EMPTY** in Netlify production to use relative `/api` paths | *(leave empty)* |
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key | Firebase Console > Project Settings > General > Web App |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | `<project-id>.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | `<project-id>` |
| `VITE_FIREBASE_APP_ID` | Firebase Web App ID | `1:1234567890:web:abcdef123456` |

### B. Backend & Database Credentials (Netlify Functions)
| Variable Name | Description | Example / Location |
| :--- | :--- | :--- |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | **Recommended:** Paste the entire contents of your Firebase Service Account JSON file as a single-line or multi-line string. | `{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}` |
| `FIREBASE_ADMIN_UIDS` | Comma-separated Firebase UIDs of Super Administrator users | `AiBU3zLcpXWPM4osYn2kFnpPt7l2,your_uid_here` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Cloud Name | Cloudinary Dashboard > Dashboard > Product Environment Credentials |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | Cloudinary Dashboard > Settings > API Keys |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | Cloudinary Dashboard > Settings > API Keys |
| `NODE_VERSION` | Node.js Runtime Version | `20` |

> [!TIP]
> **Alternative Firebase Admin Credential Format:**
> If you prefer not to paste JSON, you can set individual variables instead:
> - `FIREBASE_PROJECT_ID`
> - `FIREBASE_CLIENT_EMAIL`
> - `FIREBASE_PRIVATE_KEY` (ensure `\n` in the private key string is preserved)

---

## 5. Deploying the Site

1. In Netlify, click **Deploy site** (or trigger a deploy under **Deploys** > **Trigger deploy**).
2. Monitor the build logs:
   - Netlify runs `npm run build` (`tsc && vite build`).
   - Netlify Function packager bundles `netlify/functions/api.mjs` and its dependencies.
3. Once deployed, Netlify will assign a live URL like `https://juw-shop.netlify.app`.

---

## 6. Post-Deployment Verification Checklist

Test your live site using this step-by-step checklist:

### 1. API Health Check
Open your browser and navigate to:
```
https://<your-site>.netlify.app/api/health
```
**Expected Response:**
```json
{
  "ok": true,
  "storage": "firestore",
  "firebaseConfigured": true,
  "firestoreConnected": true,
  "productSource": "firestore",
  "sellerOrderSource": "firestore"
}
```

### 2. Public Catalog & Categories
- Visit `https://<your-site>.netlify.app/api/categories` to confirm Firestore category seeding (13 categories).
- Visit `https://<your-site>.netlify.app/categories` to verify frontend rendering and images.
- Visit `https://<your-site>.netlify.app/shop` to verify product catalog listing.

### 3. Customer Authentication & Orders
- Sign up / sign in with a student email (`@juw.edu.pk` or guest).
- Add products to cart and proceed to Checkout (`/checkout`).
- Choose **Campus Pickup** or **Standard Delivery** (COD) and complete order.
- Verify order confirmation appears with order ID and invoice breakdown.

### 4. Seller Portal & Image Upload
- Navigate to `/seller`.
- Apply or log in as a verified seller.
- Create a new product and upload a photo using the file input.
- Confirm image uploads to Cloudinary and returns a `res.cloudinary.com` URL.

### 5. Admin Portal
- Navigate to `/admin`.
- Verify the compact 260px sidebar and 72px collapsed toggle.
- Navigate to **Categories**:
  - Test adding a category with an uploaded photo.
  - Test reassigning products or archiving categories.
- Navigate to **Product Approvals** and approve pending student products.

---

## 7. Local Testing & Verification Commands

You can verify the Netlify setup on your machine at any time:

### Run Netlify Serverless API Tests Locally:
```bash
node --env-file=server/.env server/scripts/test-netlify-function.mjs
```
Runs 8 automated tests simulating Netlify Function requests:
- Health check
- Netlify Function path rewriting (`/.netlify/functions/api/health` -> `/api/health`)
- Categories listing
- CORS preflight OPTIONS
- Public catalog
- Category detail by slug
- 401 Unauthorized token enforcement
- 404 Route handling

### Run Production Build Locally:
```bash
npm run build
```

### Run Full-Stack Local Development Servers:
```bash
# Terminal 1: Frontend (Vite with /api proxy)
npm run dev

# Terminal 2: Backend (Local Node.js HTTP server on port 4000)
npm run server
```

---

## 8. Summary of Files Changed & Created

| File | Purpose |
| :--- | :--- |
| `netlify.toml` | Netlify build commands, publish directory `dist`, function directory, `/api/*` rewrite rules, and React Router SPA fallback |
| `netlify/functions/api.mjs` | Serverless entry point adapting AWS Lambda / Netlify events to the Node.js request handler |
| `server/index.mjs` | Decoupled `app.listen()` for serverless execution, multi-format Firebase credentials, path normalization, and safe origin handling |
| `src/lib/api.ts` | Configured relative `/api/...` paths in production to communicate through the same domain |
| `vite.config.js` | Configured `/api` dev proxy to `http://localhost:4000` for seamless local development |
| `package.json` | Added `firebase-admin` and `cloudinary` to root dependencies for Netlify function bundling |
| `.gitignore` | Explicitly secured secrets, `.env*`, service account keys, and `.netlify` artifacts |
| `.env.example` | Documented all frontend and Netlify backend environment variables |
| `server/scripts/test-netlify-function.mjs` | Local test suite validating Netlify Function event processing |
