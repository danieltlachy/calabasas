# FAYUCA — E-commerce Roadmap (Clothing & Tennis Shoes)

Planning document for the full-stack build. Use `TASKS.md` as the working checklist; this file explains *why* and *in what order* things are built.

## Stack (confirmed)

| Layer      | Technology                                             |
| ---------- | ------------------------------------------------------ |
| Frontend   | React (scaffolded with Vite, npm build tool)           |
| Backend    | Node.js + Express.js                                   |
| Database   | Supabase (PostgreSQL) + Prisma ORM                     |
| Email      | Resend (verification codes + password recovery links)  |
| Extras     | JWT (sessions), bcrypt (password hashing), Stripe (cards) |

## Important architectural decisions

1. **Supabase = database only.** You use Supabase purely as managed Postgres that Prisma connects to via `DATABASE_URL`. Ignore Supabase Auth — you are implementing your own JWT + bcrypt auth as planned.
2. **Two separate apps.** `frontend/` is the React app (dev server on port 5173); `server/` is the Express API (port 3000). During development the Vite dev server *proxies* `/api` → `localhost:3000`, so the browser only talks to one origin and you avoid CORS entirely. In production you build `frontend/` and serve the static files from Express (or host the two apps separately).
3. **A single repo, two folders:**
   ```
   fayuca/
     server/         # Express API: routes, controllers, services, middleware
     server/prisma/  # schema.prisma + migrations + seed
     frontend/       # React app (created with Vite)
   ```
4. **Password recovery & email verification use Resend.** Registration sends a 6-digit code; the *same* mailer service is reused for recovery links that carry a short-lived token.
5. **JWT in an `httpOnly` cookie** (not `localStorage`) to reduce XSS risk. The cookie is set on login/registration, cleared on logout, and checked by Express middleware for protected routes.

## Use case → phase mapping

| # | Use case                       | Delivers in                                   |
| - | ------------------------------ | --------------------------------------------- |
| 1 | Account registration           | Phase 4 – Authentication                      |
| 2 | Email verification (6-digit)   | Phase 4 – Authentication                      |
| 3 | Login (blocked until verified) | Phase 4 – Authentication                      |
| 4 | Password recovery (reset link) | Phase 4 – Authentication                      |
| 5 | Profile editing                | Phase 5 – Account management                  |
| 6 | Shipping address management    | Phase 5 – Account management                  |
| 7 | Payment method management      | Phase 7 – Stripe payments (post-MVP)          |
| 8 | Logout                         | Phase 4 – Authentication                      |
| 9 | Guest checkout                 | Phase 6 – Checkout & orders                   |
| 10 | Order history                  | Phase 6 – Checkout & orders                   |
| 11 | Add product                    | Phase 2 – Catalog (admin form, minimal)       |

## Phases (each one is a shippable, testable increment)

### Phase 1 — Foundation & data model
Set up the project, the database, and every table the app needs up front. Schema-first
prevents painful migrations later.

- Git repo + `.gitignore` (never commit `.env` / secrets).
- Node + Express project with `npm start` / `npm run dev` scripts.
- Supabase project created; Prisma connected via `DATABASE_URL`.
- Prisma models: `User`, `Address`, `Product`, `Category`, `Order`, `OrderItem`, `PaymentMethod`, `VerificationToken`.
- Seed script with ~10 sample products (clothing + shoes) and categories.
- `/api/health` endpoint + static frontend served.

### Phase 2 — Catalog browsing
The visible storefront. Everything is read-only, so this is the easiest place to learn
the rendering patterns you reuse later.

- Home / listing page showing all products, filterable by category.
- Product detail page (images, price, description).
- Basic layout + CSS (header, footer, navigation, responsive grid).
- Minimal admin "Add product" form (UC 11) so you can add items without reseeding.

### Phase 3 — Cart
- Add to cart, view cart, change quantities, remove items.
- Start with a client-side (in-memory/`localStorage`) cart; upgrade to a DB cart in Phase 6 so orders have a stable source of truth.

### Phase 4 — Authentication
Core auth flows. bcrypt hashes passwords; JWT in `httpOnly` cookie carries the session;
middleware protects routes; Resend delivers the code / link.

- Registration (UC 1) → create user as **unverified**, send 6-digit code.
- Email verification (UC 2) → verify code (with resend if expired), flag active.
- Login (UC 3) → reject unverified accounts, set JWT cookie.
- Logout (UC 8) → clear cookie.
- Password recovery (UC 4) → request reset link via Resend, set new password with temporary token.
- Auth state on the frontend: show login/logout/profile depending on cookie presence.

### Phase 5 — Account management
- Profile editing (UC 5): update name + email (re-verify if email changes).
- Shipping addresses (UC 6): add, list, update, delete, mark one as primary.

### Phase 6 — Checkout & orders
- Guest checkout (UC 9): capture only delivery details, no account needed.
- Convert guest checkout / cart into an `Order` + `OrderItem` rows.
- Order history (UC 10): view past orders with status (pending, in transit, delivered) and line-item details.

### Phase 7 — Stripe payments (post-MVP)
- Secure card entry via Stripe.js → tokenize on client, never send the raw card number to your server (UC 7).
- Save card as a reusable `PaymentMethod`, list / remove / set primary.

### Phase 8 — Production readiness
- Server-side validation (e.g. `zod` or manual) on every input.
- Rate limiting on auth/email endpoints (brute-force protection).
- Security headers, HTTPS, secure cookie flags.
- Error handling + logging; automated tests on critical flows (auth, checkout).
- Deploy (Vercel, free: one Express serverless function serves the built frontend + API from a single `*.vercel.app` URL) + real Supabase production database + real Resend domain.

## Beginner gotchas to bake in from day 1

- `DATABASE_URL` (Supabase) belongs in `.env`, never in the repo; add `.env` to `.gitignore` immediately.
- Prisma migrations must be run (`npx prisma migrate dev`), and the schema must match Supabase's Postgres — use the connection string from Supabase's *new dashboard → Connect → Prisma*.
- bcrypt is one-way: never try to decrypt a password, always compare hashes.
- JWT secret should be long and random; put it in `.env`.
- Resend sends from a verified domain in production; use the `onboarding@resend.dev` sender while testing.
- Stripe has a **test mode** — always develop against test keys, never live.
- The Vite dev server must proxy `/api` to Express (`vite.config.js`), otherwise every fetch needs a full URL and you run into CORS errors.
- Reserve the Stripe card validation for Phase 7; do not let it block Phases 1–6.

## Suggested learning order (if this is your first full-stack app)

1. Phase 1 alone → you understand Node/Express/Prisma/Supabase wiring.
2. Phase 2 alone → you understand server + static frontend + routing.
3. Phases 3–4 → you understand state, auth, and cookies.
4. Phases 5–6 → you understand CRUD + relational data.
5. Phase 7 → you get exposure to third-party payment APIs.
6. Phase 8 → you make it robust and deploy it.