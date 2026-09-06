# FAYUCA — Task Tracker

Working checklist for the FAYUCA build. Tick a box when the task is done. Each task has
a stable ID (`P1-01` = Phase 1, task 01) so you can reference blockers in chat.

Legend: `[ ]` pending · `[x]` done · `[~]` in progress · `[!]` blocked (add note)

---

## Phase 1 — Foundation & data model

- [x] P1-01 Init git repo, add `.gitignore` (node_modules, `.env`, dist)
- [x] P1-02 `npm init` + install `express`, `@prisma/client`, `prisma`, `dotenv`
- [x] P1-03 Add `dev`/`start` scripts and a server entry file (`src/server.js`)
- [x] P1-04 Create Supabase project; copy the Postgres connection string
- [x] P1-05 `npx prisma init`; set `DATABASE_URL` in `.env`
- [x] P1-06 Define Prisma models: User, Address, Product, Category, Order, OrderItem, PaymentMethod, VerificationToken
- [x] P1-07 Run `npx prisma migrate dev` (first migration)
- [x] P1-08 Write seed script (`prisma/seed.js`) with ~10 sample products + categories
- [x] P1-09 Scaffold React app with Vite + confirm `/api` proxy to Express in `vite.config.js`
- [x] P1-10 Health-check endpoint `GET /api/health`
- [x] P1-11 Folder structure: `src/routes`, `src/controllers`, `src/services`, `src/middleware`
- [x] P1-12 Error-handler middleware + basic `try/catch` pattern

## Phase 2 — Catalog browsing

- [x] P2-01 Home page listing all products (cards: image, name, price)
- [x] P2-02 Product detail page (route `/product/:id`)
- [x] P2-03 Category filtering (clothing / shoes)
- [x] P2-04 Layout: header with nav, footer, responsive CSS grid
- [x] P2-05 `GET /api/products` and `GET /api/products/:id` endpoints
- [ ] P2-06 Minimal admin "Add product" form (UC 11) — POST to backend, serve from DB
- [ ] P2-07 Empty-state handling (no products / no search results)

## Phase 3 — Cart

- [x] P3-01 Add to cart (client-side `localStorage` cart)
- [x] P3-02 Cart view: list items, edit quantity, remove item
- [x] P3-03 Cart total calculation (client-side)
- [x] P3-04 Cart badge in header (item count)
- [x] P3-05 Persist cart across page reloads via `localStorage`

## Phase 4 — Authentication

- [x] P4-01 Install `jsonwebtoken`, `bcryptjs`, `cookie-parser`, `resend`
- [x] P4-02 User route: registration (UC 1) → creates unverified user + stores hashed password
- [x] P4-03 Generate + send 6-digit verification code via Resend (UC 2)
- [x] P4-04 Verification endpoint: check code, mark user verified; resend-with-expiry logic
- [x] P4-05 Login endpoint (UC 3): 401 if unverified, set JWT `httpOnly` cookie on success
- [x] P4-06 Logout endpoint (UC 8): clear cookie
- [x] P4-07 `auth` middleware: reject requests without valid JWT
- [x] P4-08 Password recovery (UC 4): request reset link via Resend + short-lived token
- [x] P4-09 Reset-password endpoint: validate token, set new password
- [x] P4-10 React pages: login, register, verify, recover + forms
- [x] P4-11 Frontend auth state: show/hide login, logout, profile links from cookie
- [x] P4-12 Rate-limit auth + email endpoints (basic brute-force protection)

## Phase 5 — Account management

- [x] P5-01 `GET` profile (authenticated)
- [x] P5-02 Profile edit (UC 5): update name/email; re-verify if email changes
- [x] P5-03 Address CRUD: add, list, update, delete (UC 6)
- [x] P5-04 Mark one address as primary (`isPrimary` flag + uniqueness rule)
- [x] P5-05 Dashboard page: profile form + address list/forms on the frontend

## Phase 6 — Checkout & orders

- [x] P6-01 Checkout form: shipping details + chosen address (or new address for guests)
- [x] P6-02 Guest checkout (UC 9): create order without an account
- [x] P6-03 Create `Order` + `OrderItem` rows; server re-computes prices/totals from the DB (never trust client prices)
- [x] P6-04 Order status field: pending / in transit / delivered
- [x] P6-05 Order history (UC 10): list orders with status + line-item details
- [x] P6-06 Order confirmation screen + order reference number
- [x] P6-07 Clear cart after successful order

## Phase 7 — Stripe payments

- [x] P7-01 Create Stripe account, switch to **test mode**
- [x] P7-02 Install `stripe` SDK + set test keys in `.env`
- [x] P7-03 Stripe.js client-side card form (Tokenization → card never touches your server)
- [x] P7-04 Save card as reusable `PaymentMethod` (UC 7)
- [x] P7-05 List / remove / set-primary payment methods
- [x] P7-06 Charge an order using a saved payment method
- [ ] P7-07 Handle webhooks (payment success → update order status) — deferred: payments already succeed synchronously at checkout

## Phase 8 — Production readiness

- [x] P8-01 Input validation on all API routes
- [x] P8-02 Rate limiting on all /api routes
- [x] P8-03 Security headers + `secure` cookie flag over HTTPS
- [x] P8-04 Centralized error handling + structured logging
- [x] P8-05 Automated tests: auth flow, checkout flow (happy + error paths)
- [x] P8-10 Vercel readiness: app/listen split, `vercel.json` routing everything through one Express function, static serve of `frontend/dist` + SPA fallback, Prisma `binaryTargets` (debian-openssl-3.0.x), root `package.json` build script, prod-mode smoke test
- [ ] P8-06 Set up real Resend domain + verified sender (needs a domain — emails at demo stay limited to owner inbox + console fallback)
- [x] P8-07 Seed production DB — demo uses the ONE shared Supabase project (dev = prod), seed already applied
- [~] P8-08 Deploy to Vercel (free `*.vercel.app`; Express serves frontend + API from one URL so the cookie works) — code ready, user pushes + sets env vars
- [ ] P8-09 Post-deploy smoke test: register → verify → browse → order

---

## Blockers log

| Task | Blocker | Notes |
| ---- | ------- | ----- |
|      |         |       |