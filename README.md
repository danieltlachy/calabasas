# calabasas — E-commerce Demo

A complete, full-stack e-commerce store (clothing and tennis shoes) built as a learning
project by a beginner developer in VS Code, and deployed for free on Vercel.

Everything runs on a single URL, so authentication works through a same-origin
`httpOnly` cookie: the same Express server serves the React app (built with Vite) and
the REST API.

**Live demo:** https://calabasas-gamma.vercel.app

---

## 1. What the project is

FAYUCA is a working storefront where you can:

- Browse products (clothing and tennis shoes) with real stock from the database.
- Register with an email, verify it with a 6-digit code, and log in.
- Save profile info and shipping addresses.
- Add products to the cart and place orders.
- Pay with a card using Stripe Elements (test mode).
- See your order history.
- Reset your password with a recovery link.
- Get basic protection: rate limiting, input validation, security headers.

It is a **demo**: payments use Stripe test keys, product images are placeholders,
and emails are only deliverable to the account owner (see Warnings).

---

## 2. The stack

| Layer        | Technology                                                     |
| ------------ | -------------------------------------------------------------- |
| Frontend     | React 19, Vite 8, React Router 7                               |
| Backend      | Node.js, Express 5                                              |
| Database     | PostgreSQL on Supabase, Prisma 6 ORM                            |
| Auth         | JWT in an `httpOnly` cookie (7 days), bcryptjs, email codes     |
| Emails       | Resend (6-digit verify code, password reset link)               |
| Payments     | Stripe (test mode, PaymentIntent + Elements)                    |
| Hosting      | Vercel (free plan), one `*.vercel.app` domain for app + API     |

Main dependencies:

- `server`: express, @prisma/client, bcryptjs, cookie-parser, dotenv,
  express-rate-limit, express-validator, helmet, jsonwebtoken, morgan,
  resend, stripe
- `frontend`: react, react-dom, react-router-dom, @stripe/react-stripe-js,
  @stripe/stripe-js, vite

---

## 3. Project structure

```
calabasas/
├── server/                 # Express API + host of the built app
│   ├── prisma/
│   │   ├── schema.prisma   # Database models
│   │   └── seed.js         # Demo categories + products
│   ├── scripts/
│   │   ├── copy-to-public.js    # Copies frontend build into server/public
│   │   └── dev-*-test.js        # 5 smoke-test suites
│   └── src/
│       ├── server.js       # Dev runner: app.listen(3000)
│       ├── app.js          # Express app (routes, middleware, static, /api/health)
│       ├── db.js           # Prisma client
│       ├── controllers/    # auth, user, product, order, payment
│       ├── routes/         # /api/auth, /api/products, /api/users, /api/orders
│       ├── middleware/     # auth, optionalAuth, validators
│       └── services/       # mailService, stripeService, tokenService, verificationService
└── frontend/               # React app (Vite)
    ├── src/
    │   ├── App.jsx         # Routes
    │   ├── context/        # AuthContext, CartContext
    │   ├── pages/          # Home, ProductDetail, Cart, Checkout, OrderSuccess,
    │   │                   # Orders, Account, Login, Register, Verify,
    │   │                   # ForgotPassword, ResetPassword
    │   └── components/     # Header, PaymentMethodsSection
    └── vite.config.js      # /api proxy to :3000, asset renamed to app-[hash].js
```

### Main API routes

| Method | Route                        | Description                          |
| ------ | ---------------------------- | ------------------------------------ |
| GET    | `/api/health`                | Status + env/DB diagnostics          |
| GET    | `/api/products`              | List products                        |
| GET    | `/api/products/:id`          | Product detail                       |
| POST   | `/api/auth/register`         | Create account                       |
| POST   | `/api/auth/verify`           | Confirm 6-digit code                 |
| POST   | `/api/auth/resend-code`      | Resend code                          |
| POST   | `/api/auth/login`            | Log in (sets JWT cookie)             |
| POST   | `/api/auth/logout`           | Clear cookie                         |
| POST   | `/api/auth/forgot-password`  | Request reset link                   |
| POST   | `/api/auth/reset-password`   | Set new password                     |
| GET    | `/api/auth/me`               | Current user (auth required)         |
| GET/PATCH | `/api/users/me`           | Profile                              |
| ...    | `/api/users/me/addresses`    | CRUD shipping addresses              |
| ...    | `/api/users/me/payment-methods` | Save/remove saved cards          |
| POST   | `/api/orders`                | Create order (guest allowed)         |
| GET    | `/api/orders/ref/:reference` | Look up an order                     |
| GET    | `/api/orders/mine`           | Current user's orders                |

Security rules applied on the server:

- Client prices are never trusted: totals are recomputed from the database.
- Stock is decremented inside a `$transaction`.
- Passwords are hashed with bcryptjs; the JWT lives in an `httpOnly`,
  `sameSite: "lax"` cookie (7-day expiry).
- Verify codes expire in 10 minutes, reset links in 30.
- `helmet` security headers, input validation, and rate limits:
  - general API: 300 requests / 15 min
  - auth endpoints: 10 / 15 min in production

---

## 4. Use cases — how each flow works, step by step

Everything below is written for beginners. Each flow shows: what you (the user) do,
what the browser/frontend does, what the server does, and what changes in the
database. The highlighted words like "hash", "cookie", "token" and "transaction"
are explained at the end of this section.

### Shared pieces — what runs on EVERY request

Before any route runs, the server runs these middleware layers in `server/src/app.js`:

1. **helmet** sets safe HTTP headers (CSP, X-Frame-Options, etc.).
2. **morgan** logs the request line (method + URL + status).
3. **express.json()** reads the JSON body of the request.
4. **Rate limiter** — the general `/api` limiter allows 300 requests per 15 minutes;
   the `/api/auth` limiter allows 10 per 15 minutes in production. Too many → `429`.
5. **The route itself** runs (described in the flows below).
6. **Error handler** — if anything throws, it logs the timestamp, the URL and the
   stack, then answers `500 {"error":"Internal server error"}`.

Validation rules from `middleware/validators.js` also run on auth and account routes
before the controller, so malformed input is rejected with `400` without touching
the database.

### Use case 1 — Create an account (Register)

1. You fill in name, email, and password (8+ characters) on the Register page.
2. The frontend `POST /api/auth/register` with that JSON.
3. The server (`authController.register`):
   - Checks the fields are present and the password is long enough → else `400`.
   - Normalizes the email to lowercase and trims spaces (`user@x.com` becomes
     `user@x.com` in a predictable form).
   - Asks the database "is this email used?" → if yes, `409 "An account with this
     email already exists"`.
   - **Hashes** the password with bcrypt (10 rounds). The plain password is never
     stored or logged.
   - Creates a `User` row in the database.
   - Calls `issueVerificationCode` → creates a 6-digit random code, stores it in
     `verification_tokens` with type `registration`, and sets it to expire in
     **10 minutes**.
   - Sends the code by email (`mailService`): via Resend if a key is configured,
     otherwise **printed in the server console** (free-tier limitation).
4. The page tells you "Check your email for the verification code".

### Use case 2 — Verify the email (Confirm code)

1. You type the 6-digit code on the Verify page.
2. Frontend `POST /api/auth/verify` with `{ email, code }`.
3. Server (`authController.verifyEmail`):
   - Finds the user by email → else `400 "User not found"`.
   - Looks for a `registration` code that matches, is not used yet.
     - No match → `400 "Invalid code"`.
     - Code older than 10 minutes → `400 "Code expired. Request a new one."`
   - Runs a database **transaction** that marks the code as `usedAt = now` AND sets
     `emailVerifiedAt = now` on the user. Both changes succeed together or not at all.
4. You can now log in. (A fresh code is created every time you "Resend", and each
   code only works once.)

### Use case 3 — Log in

1. You type email + password on the Login page.
2. Frontend `POST /api/auth/login`.
3. Server (`authController.login`):
   - Finds the user by email → else `401 "Invalid email or password"`.
   - If the email was never verified → `403 "Please verify your email before
     logging in."`
   - **Compares** the typed password against the stored hash with bcrypt → false
     gives `401` (same message as "no such user", so an attacker can't tell which).
   - Creates a **JWT** (`tokenService.signToken`) that says "this token belongs to
     user id X" and is signed with `JWT_SECRET`, valid 7 days.
   - Sends it back as a **cookie** named `token` with flags:
     `httpOnly` (JavaScript in the browser can't read it), `sameSite: "lax"`,
     `secure` (only over HTTPS in production), 7-day lifetime.
4. The frontend saves `user` in React state (`AuthContext`).
5. From now on the browser sends the cookie back automatically on every request to
   the same site — that is why everything must live on one URL.

### Use case 4 — Staying logged in / "who am I?"

1. When the app opens, `AuthProvider` calls `GET /api/auth/me`.
2. The `requireAuth` middleware (`middleware/auth.js`):
   - Reads the `token` cookie → missing/invalid → `401`.
   - Verifies the JWT signature with `JWT_SECRET`.
   - Loads the user from the database by the id in the token → user deleted → `401`.
3. `me` returns `{ id, name, email }`. If it comes back empty, the UI treats you as
   logged out.

### Use case 5 — Log out

`POST /api/auth/logout` clears the cookie. The frontend drops the user from state.

### Use case 6 — Forgot / reset password

1. You enter your email on the Forgot Password page → `POST /api/auth/forgot-password`.
2. Server always answers "If that email exists, a reset link was sent." — even when
   the email doesn't exist, to avoid revealing which accounts exist.
3. If the user does exist: a random 64-character **token** is stored in
   `verification_tokens` with type `password_reset`, expires in **30 minutes**, and a
   link `FRONTEND_URL/reset-password?token=...` is emailed (or printed to console).
4. You click the link → Reset Password page loads the token from the URL.
5. `POST /api/auth/reset-password` with `{ token, password }`:
   - Finds an unused `password_reset` token → invalid/expired → `400`.
   - Hashes the new password and, in a transaction, marks the token used and updates
     the user's `passwordHash`.
6. You log in with the new password. Old links can't be reused.

### Use case 7 — Browse products

1. `GET /api/products` returns all products (order by newest, newest first)
   with their category. `?category=shoes` filters to tennis shoes.
2. `GET /api/products/:id` returns one product.
3. The controller converts the database `Decimal` price to a normal number so the
   JSON is friendly (`productController.serializeProduct`).

### Use case 8 — Add to cart (guest-friendly)

The cart lives **entirely in your browser**, using `localStorage` (`CartContext.jsx`):

1. Press "Add to cart" → the product is added to an array in `localStorage`
   (quantity 1; same product again → quantity +1).
2. The cart survives page reloads because it is saved in the browser.
3. `totalItems` and `totalPrice` shown in the Header are computed on the client for
   display only — the server will recompute the real total from the database when you
   order (client prices are never trusted).

### Use case 9 — Place an order (Checkout)

Two entry points, same final flow:

- **Guest:** you just type name/email/address — no account needed. The `optionalAuth`
  middleware tries the cookie; if it's valid, the order is linked to that user too.
- **Logged in:** the Checkout page prefetches your saved addresses and cards and
  prefills the address; you can pay with a saved card or "Pay later".

Step by step (`orderController.createOrder` + `POST /api/orders`):

1. Server validates: cart is not empty, all address fields present, every product
   still exists, quantities are whole numbers ≥ 1.
2. **Stock check:** for every item, `product.stock >= quantity`, else `400 "Not
   enough stock for ..."`.
3. **Price check:** the server loads the real prices from the database and computes
   `total = sum(price × quantity)`. Whatever the client sent for prices is ignored.
4. If a saved card was chosen:
   - You must be logged in, and the card must belong to you (`404` otherwise).
   - `stripeService.chargeSavedCard` creates a Stripe PaymentIntent (amount in
     **cents**, e.g. `$19.99` → `1999`), immediately confirmed with your saved card.
   - Any Stripe error → `402` with the payment message. The order is NOT created.
5. Order is created inside a database **transaction**:
   - Creates the `Order` row with a unique reference `FYC-XXXXXX-1234`.
   - Creates one `OrderItem` row per product (name + price copied at buy time).
   - Decrements each product's `stock` by the quantity bought.
   One failure = everything rolls back (no order, no stock change).
6. Frontend clears the cart and goes to
   `/order-success?ref=FYC-XXXXXX-1234`.

### Use case 10 — See the order confirmation

`OrderSuccess.jsx` calls `GET /api/orders/ref/FYC-...` (public, anyone with the
reference can look it up). It shows items, total, shipping address, and reference.
`statusLabel` maps the raw status: `pending → "Pending"`, `in_transit → "In
transit"`, `delivered → "Delivered"`.

### Use case 11 — Order history

`GET /api/orders/mine` (requires login) returns all orders for the current user,
newest first. Guests have no history (their order only exists by reference).

### Use case 12 — Save a card (Account page)

The card number never touches your server. Stripe's JS collects it inside a secure
iframe (`CardElement`):

1. You type card data in the Stripe-provided box and press "Save card".
2. `stripe.createPaymentMethod()` returns a token like `pm_...` — a reference Stripe
   will accept, not the number itself.
3. Frontend `POST /api/users/me/payment-methods` with that `pm_` id.
4. Server (`stripeService.savePaymentMethod`):
   - Reuses an existing Stripe **customer** for you, or creates one (Stripe side,
     with your name/email).
   - Attaches the card to that Stripe customer and reads back `last4` + `brand`
     (Visa/Mastercard/...).
   - Saves a `PaymentMethod` row: user, stripe ids, `last4`, `brand`; the first saved
     card becomes `isPrimary`.
   - Only `last4` and `brand` are stored — never the full number (Stripe keeps that).
5. You can now choose this card at checkout, "Set as primary", or remove it
   (removing the primary auto-promotes the next card).

### Use case 13 — Update profile

`PATCH /api/users/me`:

- Change `name` → saved immediately.
- Change `email`: server checks it isn't used by someone else (`409` otherwise),
  then saves the email and **clears `emailVerifiedAt`** — you must verify the new
  email with a fresh code before logging in again. This stops someone from taking
  over an account just by changing the email.

### Use case 14 — Addresses

- List: `GET /api/users/me/addresses` (primary first).
- Create: `POST /api/users/me/addresses`; if it's your first address or you tick
  "primary", all others are set to non-primary first.
- Set primary / delete: deleting the primary promotes the oldest remaining address.

### Use case 15 — Pay later vs. pay now (mental model)

- "Pay later (no card)" → order is created with status `pending`; no money moves.
- With a saved card → a real (test-mode) Stripe charge happens before the order can
  be created. In the dashboard you'll see the PaymentIntent in Stripe test mode.

### Words you need to know

- **Hash** — a one-way scramble of a password. You can compute a hash from a
  password, but you cannot recover the password from the hash. This is why the
  database storing a hash is safe.
- **JWT** — a signed, compact "badge" that says who you are. The server signs it with
  `JWT_SECRET`; anyone with the secret can create valid badges, so the secret must
  stay secret.
- **Cookie** — a tiny value the browser stores for a site and sends back on every
  request. `httpOnly` means page JavaScript can't read it (safer against hackers).
- **Token (verification)** — a random secret value stored in the database and used
  as proof: a 6-digit code for email verification, a 64-char string for password
  reset.
- **Transaction** — a bundled group of database writes that all succeed or all fail
  together (e.g. create order + reduce stock). Never a half-updated state.
- **Rate limit** — refusing to serve "too many requests in a short time" to slow down
  bots and password guessing.
- **404/400/401/403/409/402/429** — HTTP status codes the server uses to say
  "not found" / "bad input" / "not logged in" / "not allowed" / "already exists" /
  "payment failed" / "too many requests".

---

## 5. Getting started locally

### Prerequisites

- Node.js 18+ (npm)
- A Supabase project (free tier is fine) with its connection string
- (Optional) Stripe test keys and a Resend API key

### One-time setup

```bash
# 1. Backend dependencies + database
cd server
npm install
npx prisma migrate dev        # creates the tables
npx prisma db seed            # loads demo categories + products

# 2. Frontend dependencies
cd ../frontend
npm install

# 3. Install the git pre-commit guard (blocks accidental .env commits)
cd ../server
npm run hooks:install
```

### Environment files

Create `server/.env`:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres
JWT_SECRET=replace-with-a-long-random-string
RESEND_API_KEY=re_xxx            # optional (see Warnings)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
FRONTEND_URL=http://localhost:5173
```

Create `frontend/.env`:

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

### Run in development (two terminals)

```bash
# Terminal 1 — API on http://localhost:3000
cd server
npm run dev

# Terminal 2 — Vite on http://localhost:5173 (proxies /api to :3000)
cd frontend
npm run dev
```

### Build and serve like production (one server)

```bash
cd server
npm run build       # prisma generate + build frontend + copy into server/public
npm start           # serves /api and the SPA on http://localhost:3000
```

---

## 6. Running the tests

The five smoke suites hit a running server on `localhost:3000` (they do not start
one themselves), so start the API first (`npm run dev` or `npm start` in `server`),
then run:

```bash
cd server
node scripts/dev-auth-test.js       # 12 tests
node scripts/dev-account-test.js    # 9 tests
node scripts/dev-order-test.js      # 8 tests
node scripts/dev-payment-test.js    # 8 tests
node scripts/dev-hardening-test.js  # 10 tests
```

The tests create temporary accounts, read the verification codes directly from the
database, and clean up after themselves. They share one rate-limit window, so run
them in order with a little time in between.

---