# TrustedHome — API endpoints inventory (from current app + product spec)

This document maps **what exists in the React app today** (mostly client-side / seed data) to the **REST APIs** the backend should expose. Nothing in the UI currently calls a TrustedHome API except what we wire in `src/lib/api.js`.

## Legend

| Priority | Meaning |
|----------|---------|
| **P0** | Needed for auth + core navigation you are building now |
| **P1** | Matches primary user journeys already in UI (listings, wallet, auctions, …) |
| **P2** | Admin console tables / modals (seed-driven today) |
| **P3** | Analytics, exports, future hardening |

---

## Auth — public app (`User` / `Agent` roles)

| Priority | Method | Endpoint | Used by (UI) | Notes |
|----------|--------|----------|--------------|-------|
| P0 | POST | `/api/auth/register` | `SignUpPage` | `role`: `USER` \| `AGENT`; creates `Wallet`, optional `AgentProfile` |
| P0 | POST | `/api/auth/login` | `LoginPage` | Body includes `email`, `password`, `intent`: `USER` \| `AGENT` (must match stored role) |
| P0 | GET | `/api/auth/me` | `AuthContext`, header avatar | JWT `Authorization: Bearer` |
| P1 | POST | `/api/auth/logout` | optional | Stateless JWT: client discard; server blacklist optional later |
| P3 | POST | `/api/auth/forgot-password` | Login “Forgot password?” link | Not implemented in UI yet |
| P3 | POST | `/api/auth/verify-email` | `VerifyEmailPage` | Currently cosmetic flow |

---

## Auth — staff admin console

| Priority | Method | Endpoint | Used by (UI) | Notes |
|----------|--------|----------|--------------|-------|
| P0 | POST | `/api/admin/auth/login` | `AdminLoginPage` | **Bootstrap**: env `ADMIN_BOOTSTRAP_EMAIL` + `ADMIN_BOOTSTRAP_PASSWORD` (no DB). **Staff**: rows in `StaffAdmin` with bcrypt password |
| P0 | GET | `/api/admin/auth/me` | `AdminAuthContext` | Staff JWT |
| P0 | POST | `/api/admin/staff` | `AdminAdminsPage` “Add admin” | Requires staff JWT; creates `StaffAdmin` with hashed password |
| P1 | GET | `/api/admin/staff` | `AdminAdminsPage` roster | Replace `adminStaffSeed` |
| P1 | PATCH | `/api/admin/staff/:id` | role / status | suspend, reactivate |
| P2 | DELETE | `/api/admin/staff/:id` | remove / revoke invite | |

---

## Listings (buyer + agent + admin verification)

| Priority | Method | Endpoint | Used by (UI) | Notes |
|----------|--------|----------|--------------|-------|
| P0 | POST | `/api/listings` | `AddListingPage`, `AgentAddListingPage` | User → `PENDING`; Agent → `PENDING` (or `VERIFIED` policy later) |
| P1 | GET | `/api/listings` | `ExplorePage`, `HomePage` sections | filters, pagination |
| P1 | GET | `/api/listings/:id` | `PropertyDetailsPage` | |
| P1 | PUT | `/api/listings/:id` | `AgentEditListingPage`, owner edit | owner or agent owner |
| P1 | DELETE | `/api/listings/:id` | agent/admin actions | soft-delete optional |
| P2 | GET | `/api/admin/listings` | `AdminListingsPage` | filters |
| P2 | PATCH | `/api/admin/listings/:id/approve` | admin modal | |
| P2 | PATCH | `/api/admin/listings/:id/reject` | admin modal | reason |

---

## Media

| Priority | Method | Endpoint | Notes |
|----------|--------|----------|-------|
| P1 | POST | `/api/listings/:id/media` | multipart or signed URL upload |
| P1 | DELETE | `/api/listings/:id/media/:mediaId` | |

---

## Wallet & payments

| Priority | Method | Endpoint | Used by (UI) | Notes |
|----------|--------|----------|--------------|-------|
| P1 | GET | `/api/wallet` | `SiteHeader`, `WalletContext` | balance + currency |
| P1 | POST | `/api/wallet/fund` | `AgentFundWalletModal` | initiates Paystack |
| P1 | POST | `/api/payments/initialize` | Paystack client flow | amount, email, metadata |
| P1 | POST | `/api/payments/webhook` | Paystack server | raw body signature verify |
| P1 | GET | `/api/transactions` | `AgentTransactionsPage`, user history | pagination |

---

## Payouts

| Priority | Method | Endpoint | Used by (UI) |
|----------|--------|----------|--------------|
| P1 | POST | `/api/payouts/request` | agent earnings UI |
| P1 | GET | `/api/payouts` | agent/admin |
| P2 | PATCH | `/api/admin/payouts/:id` | `AdminPayoutsPage` |

---

## Promotions & referrals

| Priority | Method | Endpoint | Used by (UI) |
|----------|--------|----------|--------------|
| P1 | POST | `/api/promotions` | `AgentPromoteListingsPage` |
| P1 | GET | `/api/promotions` | agent/admin |
| P1 | GET | `/api/promotions/:id` | performance view |
| P1 | GET | `/api/referrals` | agent referral card / admin |

---

## Messages (incl. voice metadata)

| Priority | Method | Endpoint | Used by (UI) |
|----------|--------|----------|--------------|
| P1 | GET | `/api/messages` | `MessagesPage` |
| P1 | POST | `/api/messages` | compose / reply |
| P2 | POST | `/api/messages/:id/attachments` | uploads |

---

## Auctions & bids

| Priority | Method | Endpoint | Used by (UI) |
|----------|--------|----------|--------------|
| P1 | POST | `/api/auctions` | admin seed → real CRUD |
| P1 | GET | `/api/auctions` | `AuctionsPage` |
| P1 | POST | `/api/bids` | bid modal |
| P2 | PATCH | `/api/admin/auctions/:id` | admin auctions |

---

## Home loans

| Priority | Method | Endpoint | Used by (UI) |
|----------|--------|----------|--------------|
| P1 | POST | `/api/loans` | public / profile flows |
| P1 | GET | `/api/loans` | user + `AdminHomeLoansPage` |
| P2 | PATCH | `/api/admin/loans/:id` | approval workflow |

---

## Admin modules (seed → API)

| Area | Representative endpoints |
|------|-------------------------|
| Users | `GET/PATCH /api/admin/users`, `GET /api/admin/users/:id` |
| Agents | `GET/PATCH /api/admin/agents` |
| Transactions | `GET /api/admin/transactions` |
| Analytics | `GET /api/admin/analytics/summary` |
| Support tickets | `GET/PATCH /api/admin/support/tickets`, replies |
| Promotions (admin) | `GET /api/admin/promotions` |
| Settings | `GET/PATCH /api/admin/settings` |

---

## Notifications

| Priority | Method | Endpoint |
|----------|--------|----------|
| P2 | GET | `/api/notifications` |
| P2 | PATCH | `/api/notifications/:id/read` |

---

## Favorites (currently `FavoritesContext` local)

| Priority | Method | Endpoint |
|----------|--------|----------|
| P1 | GET/PUT | `/api/me/favorites` or `/api/saved` |

---

## External services already referenced in UI

- QR image: `https://api.qrserver.com/...` (not TrustedHome API)

---

## Implemented in `server/` (this repo) — first slice

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `POST /api/admin/auth/login`, `GET /api/admin/auth/me`, `POST /api/admin/staff`, `GET /api/admin/staff`
- `POST/GET/GET:id/PUT/DELETE /api/listings` (basic)
- `POST /api/payments/initialize`, `POST /api/payments/webhook` (stubs / Paystack-ready)

Everything else above is **specified for Prisma** and incremental controller work.
