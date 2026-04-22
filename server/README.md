# TrustedHome API

Node.js + Express + PostgreSQL (**`pg` driver**, no Prisma). JWT auth for **public users/agents**; separate JWT for **staff admin** (bootstrap env account + database `StaffAdmin` rows).

## Environment variables

Copy `server/.env.example` to `server/.env` and fill values. **Never commit `.env` or paste production secrets into the repo.**

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | yes | PostgreSQL URL. Render: append `?sslmode=require` if the host requires SSL. |
| `JWT_SECRET` | yes | Long random string for signing tokens. |
| `PAYSTACK_SECRET_KEY` | no | Live Paystack secret; if empty, payment initialize returns a **stub** payload. |
| `PAYSTACK_PUBLIC_KEY` | no | Client-side key for Paystack JS (future). |
| `ADMIN_BOOTSTRAP_EMAIL` | recommended | First-line admin login (no DB row). Lowercased when compared. |
| `ADMIN_BOOTSTRAP_PASSWORD` | recommended | Plain password compared with a SHA-256 timing-safe check (see `adminAuthService.js`). Prefer rotating after creating DB staff accounts. |
| `PORT` | no | Default `4000`. |
| `CLIENT_ORIGIN` | no | CORS origin for Vite, default `http://localhost:5173`. |

## Setup

```bash
cd server
npm install
# Create tables on an empty Postgres database (Render shell, local psql, etc.)
psql "$DATABASE_URL" -f db/schema.sql
npm run dev
```

Health check: `GET http://localhost:4000/api/health`

---

## Auth — app users (`USER` / `AGENT`)

### `POST /api/auth/register`

Creates `User`, `Wallet` (0 balance), and `AgentProfile` when `role` is `AGENT`.

**Request body (JSON):**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `email` | string | yes | Valid email, unique |
| `password` | string | yes | Min 8 characters |
| `displayName` | string | no | Defaults to email local-part |
| `role` | `"USER"` \| `"AGENT"` | yes | |
| `phone` | string | no | |
| `agencyName` | string | no | Stored on agent profile |
| `licenseId` | string | no | Stored on agent profile |

**Response `201`:**

```json
{
  "ok": true,
  "token": "<jwt>",
  "user": {
    "id": "…",
    "email": "you@example.com",
    "displayName": "You",
    "role": "USER",
    "avatarUrl": null,
    "phone": null,
    "createdAt": "…"
  }
}
```

**Example:**

```bash
curl -s -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"buyer@example.com\",\"password\":\"password123\",\"displayName\":\"Buyer\",\"role\":\"USER\"}"
```

---

### `POST /api/auth/login`

**Request body:**

| Field | Type | Required |
|-------|------|----------|
| `email` | string | yes |
| `password` | string | yes |
| `intent` | `"USER"` \| `"AGENT"` | yes | Must match the account’s stored role |

**Response `200`:** same shape as register (`token` + `user`).

**Errors:** `401` invalid credentials; `403` role mismatch.

**Example:**

```bash
curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"buyer@example.com\",\"password\":\"password123\",\"intent\":\"USER\"}"
```

---

### `GET /api/auth/me`

**Headers:** `Authorization: Bearer <token>`

**Response `200`:**

```json
{ "ok": true, "user": { "id": "…", "email": "…", "displayName": "…", "role": "USER", … } }
```

**Example:**

```bash
curl -s http://localhost:4000/api/auth/me -H "Authorization: Bearer <token>"
```

---

## Auth — staff admin

### `POST /api/admin/auth/login`

Authenticates either:

1. **Bootstrap** — `email` + `password` match `ADMIN_BOOTSTRAP_EMAIL` / `ADMIN_BOOTSTRAP_PASSWORD`, or  
2. **Database** — `StaffAdmin` row with bcrypt `passwordHash`.

**Request body:**

| Field | Type | Required |
|-------|------|----------|
| `email` | string | yes |
| `password` | string | yes |

**Response `200`:**

```json
{
  "ok": true,
  "token": "<jwt>",
  "staff": {
    "id": "bootstrap" | "<cuid>",
    "email": "…",
    "name": "…",
    "roleLabel": "…",
    "source": "bootstrap" | "database"
  }
}
```

**Example:**

```bash
curl -s -X POST http://localhost:4000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@yourcompany.com\",\"password\":\"change-me-immediately\"}"
```

---

### `GET /api/admin/auth/me`

**Headers:** `Authorization: Bearer <staff_token>`

**Response `200`:** `{ "ok": true, "staff": { "id", "email", "source" } }`

---

### `GET /api/admin/staff`

**Headers:** `Authorization: Bearer <staff_token>`

**Response `200`:** `{ "ok": true, "staff": [ … ] }`

---

### `POST /api/admin/staff`

Creates a new `StaffAdmin` (can sign in immediately with bcrypt password).

**Headers:** `Authorization: Bearer <staff_token>`

**Request body:**

| Field | Type | Required |
|-------|------|----------|
| `email` | string | yes |
| `password` | string | yes | Min 10 characters |
| `name` | string | yes | Min 2 characters |
| `roleLabel` | string | no | Default `Operations` |

**Response `201`:** `{ "ok": true, "staff": { "id", "email", "name", … } }`

**Example:**

```bash
curl -s -X POST http://localhost:4000/api/admin/staff \
  -H "Authorization: Bearer <staff_token>" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"ops2@yourcompany.com\",\"password\":\"longpassword12\",\"name\":\"Ops Two\",\"roleLabel\":\"Operations\"}"
```

---

## Listings

### `POST /api/listings`

**Headers:** `Authorization: Bearer <app_user_token>`

**Body:** `title`, `location`, `priceNgn` (required); optional `description`, `purpose`, `propertyType`, `bedrooms`, `bathrooms`, `areaSqm`.

**Response `201`:** `{ "ok": true, "listing": { … } }`

---

### `GET /api/listings`

Public list. Query: `status`, `take`, `skip`.

---

### `GET /api/listings/:id`

Public detail (includes `media`).

---

### `PUT /api/listings/:id` / `DELETE /api/listings/:id`

Owner-only (`Authorization: Bearer <token>`).

---

## Payments (stub / extension point)

### `POST /api/payments/initialize`

**Headers:** `Authorization: Bearer <token>`

**Body:** `email`, `amountNgn`, optional `callbackUrl`, `metadata`.

If `PAYSTACK_SECRET_KEY` is empty, returns `{ ok: true, mode: "stub", reference, authorization_url, … }`.

---

### `POST /api/payments/webhook`

Paystack webhook URL. Uses **raw body** for HMAC-SHA512 signature (`x-paystack-signature`). If secret is unset, responds `noop`.

---

## Deployment (Render / similar)

1. Create PostgreSQL instance; copy **internal** or **external** URL into `DATABASE_URL` (with `?sslmode=require` if required).  
2. Run schema once on that database: `psql "$DATABASE_URL" -f server/db/schema.sql` (Render shell, or local with VPN to internal URL).  
3. Set `JWT_SECRET`, Paystack keys, `ADMIN_BOOTSTRAP_*`, `GOOGLE_CLIENT_ID`, SMTP / `MAIL_FROM`, `CLIENT_ORIGIN` (your deployed web origin).  
4. Build: `cd server && npm ci`. Start: `npm run start` from `server/`.  
5. Point the frontend `VITE_API_URL` to `https://your-api-host/api`.

---

## More endpoints

See `../docs/API_ENDPOINTS_INVENTORY.md` for the full roadmap (wallet, auctions, admin modules, etc.).
