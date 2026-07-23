# Vicinity Trade

A B2B wholesale marketplace web application connecting **Sellers** (manufacturers / wholesalers) with **Buyers** (retailers / bulk buyers). Built as a Final Year Project.

## Tech Stack

- **Frontend:** React 18 + Vite, React Router v6, TailwindCSS v3, Axios, Socket.io-client, Zustand
- **Backend:** Node.js + Express.js (CommonJS), MongoDB + Mongoose 8, Socket.io, JWT, bcryptjs, Multer (+ optional Cloudinary)
- **Structure:** monorepo with `/client` (Vite React app) and `/server` (Express API)

## Features (12 modules)

1. **Authentication & Roles** — JWT auth, buyer/seller/admin roles
2. **Company Profile & Verification** — seller profiles, admin-verified badge
3. **Product Management** — tiered volume pricing, MOQ, image uploads
4. **Search & Discovery** — keyword, category, region, price/MOQ filters
5. **RFQ (Request for Quotation)** — buyers post leads, sellers quote
6. **Chat & Negotiation** — real-time messaging + structured offers (Socket.io)
7. **Order Management** — order lifecycle with status stepper
8. **Notifications** — real-time bell with unread badge
9. **Reviews & Ratings** — buyers rate sellers on delivered orders
10. **Admin Dashboard** — verifications, user/product moderation, platform stats
11. **Favorites / Watchlist** — save products and suppliers
12. **Payment & Settlement** — mock COD tracking + seller settlement ledger

> **Scope note (FYP):** The payment module **simulates** Cash-on-Delivery status tracking in the database. There is **no real payment gateway** — Stripe / JazzCash / Easypaisa integration is intentionally scoped as future work.

## Project Structure

```
Vicinity/
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Route-level pages (incl. admin/)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API / socket clients
│   │   ├── store/           # Zustand state stores
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── tailwind.config.js   # "Trade Navy" design tokens
│   └── vite.config.js
├── server/                  # Express + Mongoose backend
│   ├── config/              # DB connection, Socket.io init
│   ├── controllers/         # Route handlers
│   ├── middleware/          # Auth, error handling, uploads
│   ├── models/              # Mongoose schemas
│   ├── routes/              # Express routers
│   ├── seed/                # seedAdmin.js, seedDemo.js
│   ├── uploads/             # Local disk image storage (dev)
│   └── server.js            # App entry point
├── .env.example             # Combined env template for both apps
└── package.json             # Root scripts (concurrently)
```

## Getting Started

### 1. Prerequisites

- **Node.js 18+** (LTS recommended)
- **MongoDB** — a local install running on `mongodb://127.0.0.1:27017`, or a **MongoDB Atlas** connection string
- **npm** (bundled with Node.js)

### 2. Install dependencies

From the repository root:

```bash
npm install          # root dev deps (concurrently)
npm run install:all  # installs both server/ and client/ deps
```

Or install each app individually:

```bash
cd server && npm install
cd ../client && npm install
```

### 3. Environment variables

Two `.env` files are needed — one per app. Use `.env.example` (at the repo root) as the template; it contains a **SERVER block** and a **CLIENT block**.

**`server/.env`:**

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/vicinity_trade
JWT_SECRET=change_me_to_a_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

# Optional — leave blank to use local disk uploads
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Used by `npm run seed:admin`
ADMIN_NAME=Platform Admin
ADMIN_EMAIL=admin@vicinity.trade
ADMIN_PASSWORD=admin12345
```

**`client/.env`:**

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

> At minimum set `MONGO_URI` and `JWT_SECRET`. Make sure MongoDB is running before you start the server.

### 4. Seed data (recommended before a demo)

Run these once, from the repo root, **after** setting up `server/.env`:

```bash
npm run seed:admin   # creates the admin account (from ADMIN_* env vars)
npm run seed:demo    # populates buyers, sellers, companies, products,
                     # RFQs, quotes, orders (all statuses), reviews, etc.
```

- `seed:demo` is **safe to re-run** — it clears all non-admin data first, then repopulates.
- Both scripts can also be run from inside `server/` (`npm run seed:admin` / `npm run seed:demo`).

### 5. Run the apps

```bash
# Run both together from the repo root
npm run dev

# Or run separately:
npm run server   # http://localhost:5000  (API)
npm run client   # http://localhost:5173  (web app)
```

Health check: `GET http://localhost:5000/api/health` → `{ "success": true, ... }`

> **Note:** After changing Mongoose models or routes, restart the server so the changes (and any new indexes) load.

## Demo Accounts

After running `npm run seed:demo`, log in with any of these. **Password for all demo accounts: `demo1234`**

| Role | Email | Highlights |
| --- | --- | --- |
| Seller | `seller1@demo.com` | Verified · products, orders, reviews, chat thread |
| Seller | `seller2@demo.com` | Verified · good for the Settlement Summary demo |
| Seller | `seller3@demo.com` | **Pending verification** — use for the admin approval demo |
| Buyer | `buyer1@demo.com` | Favorites, active chat, open/closed RFQs |
| Buyer | `buyer2@demo.com` | Delivered + paid + reviewed order |
| Buyer | `buyer3@demo.com` | Delivered (unpaid) + cancelled orders |

**Admin:** seeded via `npm run seed:admin` — defaults to `admin@vicinity.trade` / `admin12345` (override with the `ADMIN_*` env vars).

### Suggested demo flow

1. **Admin** → log in, open the Admin panel → approve *Noor Foods Trading Co.* under Verifications → its verified badge now shows on the public profile.
2. **Buyer** (`buyer3@demo.com`) → view the delivered-but-unpaid order.
3. **Seller** (`seller1@demo.com`) → open that order → **Mark Payment as Received** → check the **Settlement Summary** totals update.
4. **Buyer** (`buyer1@demo.com`) → Marketplace → open a chat with a seller (real-time), browse **My Favorites**, review a delivered order.

## API Route Map (all under `/api`)

```
/health        GET
/auth          POST /register, POST /login, GET /me
/company       GET /me, POST /, PUT /, POST /logo, POST /docs, GET /:id
/products      GET /mine, POST /, POST /:id/images, PUT /:id, PATCH /:id/toggle,
               DELETE /:id, GET /search, GET /meta, GET /, GET /:id
/rfqs          POST /, GET /mine, GET /, GET /:id, PATCH /:id/close, POST /:id/quotes
/quotes        GET /mine, PATCH /:id/status
/conversations POST /, GET /, GET /:id/messages, POST /:id/messages
/orders        POST /, GET /mine, GET /received, GET /settlement/summary, GET /:id,
               PATCH /:id/status, PATCH /:id/payment-received, PATCH /:id/cancel
/notifications GET /, PATCH /read-all, PATCH /:id/read
/reviews       POST /, GET /order/:orderId
/admin         GET /stats, GET /verifications, PATCH /verifications/:id,
               GET /users, PATCH /users/:id/suspend,
               GET /products, PATCH /products/:id/active, DELETE /products/:id
/favorites     GET /ids, GET /, POST /toggle
```

## Design System — "Trade Navy"

Color tokens are configured in `client/tailwind.config.js` under `theme.extend.colors` and used by name (e.g. `bg-primary`, `text-accent`).

| Token | Hex | Usage |
| --- | --- | --- |
| `primary` | `#1B3A5C` | Navbar, footer, headers, primary buttons at rest |
| `primary-hover` | `#15304D` | Hover state for primary buttons |
| `accent` | `#F59E0B` | Primary CTAs, links, active states, attention badges |
| `success` | `#15803D` | Verified badges, delivered status, positive toasts |
| `danger` | `#DC2626` | Errors, cancel/reject, overdue/failed states |
| `background` | `#FFFFFF` | Page background |
| `background-alt` | `#F8FAFC` | Alternating sections, card backgrounds |
| `text-primary` | `#0F172A` | Body text, headings |
| `text-secondary` | `#64748B` | Meta text, timestamps, placeholders |
| `border` | `#E2E8F0` | Card borders, dividers, input borders |
| `fill-subtle` | `#F1F5F9` | Disabled states, chips, table stripes |

**Fonts:** Fraunces (display/headings), IBM Plex Sans (body), IBM Plex Mono (numeric/data values).

## npm Scripts Reference

**Root (`/`):**

| Script | Description |
| --- | --- |
| `npm run install:all` | Install both server and client dependencies |
| `npm run dev` | Run server + client together (concurrently) |
| `npm run server` | Run the backend only (nodemon) |
| `npm run client` | Run the frontend only (Vite) |
| `npm run seed:admin` | Seed the admin account |
| `npm run seed:demo` | Seed the full demo dataset |

**Server (`/server`):** `npm start`, `npm run dev`, `npm run seed:admin`, `npm run seed:demo`

## License

Final Year Project — for academic/demonstration purposes.
