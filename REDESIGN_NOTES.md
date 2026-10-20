# JUW Marketplace — UI refresh (first pass)

## Changes
- Redesigned the customer homepage hero with a calm ivory/forest editorial presentation, better text hierarchy, and prominent Shop / Services navigation.
- Kept existing customer and admin routes, shopping logic, data models, and seller privacy architecture unchanged.
- Introduced calmer product-card hover states, responsive hero typography, and visible keyboard focus styles.
- Added reduced-motion accessibility support.

## Run locally
1. Open this folder in VS Code.
2. `npm install`
3. `npm run dev`
4. Visit the local address shown in the terminal.

## Validation
TypeScript checked successfully with `tsc --noEmit`. A full Vite production build was not possible in the current Linux environment because the original Windows-generated node_modules contains no Linux Rolldown native binding. Run `npm install` on your machine to install platform-compatible dependencies, then `npm run build`.

## Notes
- This is an initial visual improvement, not a full review of every page or a completed backend.
- External imagery requires an internet connection; replace with approved product photography before launch.
- Mock marketplace claims, payments and operational promises should be verified before public deployment.
