# Vicinity Trade — Project Status

> Handoff document for a fresh agent session. Reflects the **actual current state** of the codebase through **Phase 12** (all planned phases complete).

---

## 1. Project Overview

**Vicinity Trade** is a B2B wholesale marketplace web app connecting **Sellers** (manufacturers/wholesalers) with **Buyers** (retailers/bulk buyers), built as a Final Year Project (prioritize a clean, working, demonstrable product over enterprise-scale complexity).

**Tech stack:**
- **Frontend:** React 18 + Vite, React Router v6, TailwindCSS v3, Zustand (state), Axios, socket.io-client
- **Backend:** Node.js + Express (CommonJS), MongoDB + Mongoose 8, Socket.io, JWT auth (jsonwebtoken), bcryptjs, Multer (local-disk uploads), morgan, cors
- **Structure:** monorepo with **`/client`** (Vite React app) and **`/server`** (Express API). Root `package.json` has `concurrently` scripts.

**Roles:** `buyer`, `seller`, `admin` (admin created via seed script only).

**API conventions:** all responses use `{ success: true, data: ... }` or `{ success: false, message: "..." }`. Mutating routes are protected by JWT middleware + role checks.

**Run:**
- Server: `cd server && npm run dev` (nodemon) → http://localhost:5000 (health: `GET /api/health`)
- Client: `cd client && npm run dev` → http://localhost:5173
- Seed admin: `cd server && npm run seed:admin`
- Seed demo data: `cd server && npm run seed:demo` (buyers, sellers, companies, products, RFQs, quotes, orders, reviews — safe to re-run; all demo logins use password `demo1234`)
- Auth token stored in **localStorage** (`vt_token`), attached via Axios interceptor; Zustand `authStore` persisted under `vt-auth`.

---

## 2. Design System — "Trade Navy"

Color tokens configured in `client/tailwind.config.js` under `theme.extend.colors` (used by name, e.g. `bg-primary`, `text-accent`). Some are nested (`primary.DEFAULT`/`primary.hover`, `background.DEFAULT`/`background.alt`, `text.primary`/`text.secondary`, `fill.subtle`).

| Token (class) | Hex | Usage |
| --- | --- | --- |
| `primary` | `#1B3A5C` | Navbar, footer, headers, primary buttons at rest, "Order Now" button |
| `primary-hover` | `#15304D` | Hover/active for primary buttons |
| `accent` | `#F59E0B` | Primary CTAs (Submit Quote, Post RFQ, Send/Message, Accept Offer), links, active tab underline, notification/unread badges |
| `success` | `#15803D` | Verified badge, Delivered/Paid status, positive toasts — narrow use only |
| `danger` | `#DC2626` | Errors, cancel/reject, overdue/failed/cancelled |
| `background` | `#FFFFFF` | Page background (`bg-background`) |
| `background-alt` | `#F8FAFC` | Alt sections, card backgrounds (`bg-background-alt`) |
| `text-primary` | `#0F172A` | Body text, headings (`text-text-primary`) |
| `text-secondary` | `#64748B` | Meta text, timestamps, placeholders (`text-text-secondary`) |
| `border` | `#E2E8F0` | Card borders, dividers, inputs (`border-border`) |
| `fill-subtle` | `#F1F5F9` | Disabled states, chips, table stripes (`bg-fill-subtle`) |

**Status pill convention** (component `client/src/components/StatusPill.jsx`, tones): pending = `fill-subtle` + `text-secondary`; in-progress/`progress` = `accent/10` bg + `accent` text; success = `success/10` + `success`; danger = `danger/10` + `danger`. `STATUS_MAP` covers: stock (`in_stock`/`low_stock`/`out_of_stock`), `active`/`inactive`, RFQ (`open`/`closed`), quote (`submitted`/`accepted`/`rejected`), order (`pending_payment`/`processing`/`shipped`/`delivered`/`cancelled`), payment (`paid`/`refunded`/pending).

**Typography** (loaded via `<link>` in `client/index.html`, families in `tailwind.config.js`):
- **Fraunces** → display/headings (`font-display`; also auto-applied to `h1`–`h6` in `index.css`)
- **IBM Plex Sans** → body default (`font-sans`)
- **IBM Plex Mono** → ALL numeric/data values (prices, IDs, quantities, order #, dates). Apply with the `.num` helper class (defined in `index.css`: `font-mono` + tabular-nums).

**Landing page ("Trade Manifest" concept)** — `client/src/pages/Home.jsx`: two-column hero (headline in Fraunces clamped 40–64px on the left; right column is a "Live on Vicinity Trade" card styled like a shipment manifest with mock activity rows — IDs/prices in mono, status pills). Dev-only diagnostics (backend health ping + palette swatches) live below the fold, de-emphasized.

---

## 3. Completed Phases (1–12)

### Phase 1 — Authentication & Role Management
- **Model `User`** (`server/models/User.js`): `name`, `email` (unique, lowercase), `password` (bcrypt-hashed via pre-save hook, `select:false`), `role` (enum `buyer`/`seller`/`admin`, default `buyer`), `phone`, timestamps. Methods: `matchPassword`, `toSafeObject`.
- **Routes** (`/api/auth`): `POST /register` (buyer/seller only; admin rejected), `POST /login`, `GET /me` (protect).
- **Middleware** (`server/middleware/auth.js`): `protect` (verify JWT → `req.user`), `authorize(...roles)`, `optionalAuth` (attaches user if token present, never blocks).
- **Utility:** `server/utils/generateToken.js` (JWT with `{ id, role }`), `server/seed/seedAdmin.js` (`npm run seed:admin`, uses `ADMIN_*` env vars).
- **Frontend:** `pages/Login.jsx`, `pages/Register.jsx` (Buyer/Seller role toggle; seller → redirected to company onboarding), `components/ProtectedRoute.jsx` (`allowedRoles`), `store/authStore.js` (Zustand persist: `login`/`register`/`loadUser`/`logout`), `services/authService.js`, `components/Navbar.jsx` (role-aware), `components/Toaster.jsx` + `store/toastStore.js`.
- **Notes:** JWT in localStorage (chosen consistently). `loadUser()` runs on app mount to re-validate token.

### Phase 2 — Company Profile & Verification
- **Model `CompanyProfile`** (`server/models/CompanyProfile.js`): `userRef` (→User, unique = one per user), `companyName`, `businessType` (enum `Manufacturer`/`Trader`/`Distributor`), `description`, `location{city, region}`, `certifications[String]`, `logoUrl`, `isVerified` (default false), `verificationDocs[String]`, timestamps.
- **Routes** (`/api/company`): `GET /me` (protect), `POST /` (create), `PUT /` (update; **cannot** set `isVerified`), `POST /logo` (multipart `logo`), `POST /docs` (multipart `docs`, ≤5), `GET /:id` (public; returns `{ profile, products }`).
- **Middleware:** `server/middleware/upload.js` — Multer local-disk to `/server/uploads`, served at `/uploads`, accepts JPG/PNG/WEBP/GIF/PDF ≤5MB, exports `fileUrl(req,file)` helper (absolute URL; swap to Cloudinary later without touching controllers).
- **Frontend:** `pages/CompanyProfileEdit.jsx` (`/company/edit`; onboarding via `?onboarding=1`), `pages/CompanyProfilePublic.jsx` (`/company/:id`), `components/VerifiedBadge.jsx` (canonical success use: `success/10` + checkmark, renders only when verified), `services/companyService.js`. Seller Dashboard shows a company banner (no profile → amber prompt; unverified → pending; verified → green).
- **Notes:** Verification is **manual** (admin flips `isVerified` in Phase 10; no OCR/auto pipeline). Public route keyed by CompanyProfile `_id`, not user id.

### Phase 3 — Product Management
- **Model `Product`** (`server/models/Product.js`): `sellerRef` (→User, indexed), `title`, `description`, `category` (enum — exported `PRODUCT_CATEGORIES`, 10 categories), `images[String]`, `moq` (min 1), `pricingTiers[{minQty, maxQty|null, pricePerUnit}]` (2–4), `stockStatus` (enum `in_stock`/`low_stock`/`out_of_stock`), `isActive` (default true), timestamps. **Text index** on `title`(weight 5)/`description`(weight 1) named `product_text_index` (added in Phase 4).
- **Routes** (`/api/products`): `GET /mine` (seller), `POST /` (seller), `POST /:id/images` (seller, multipart `images` ≤6), `PUT /:id` (seller owner), `PATCH /:id/toggle` (seller owner), `DELETE /:id` (seller owner), `GET /search` (public — Phase 4), `GET /meta` (public — Phase 4), `GET /` (public list w/ `seller`/`category`/`q`), `GET /:id` (public detail + company summary).
- **Validation:** `server/utils/validateTiers.js` — 2–4 tiers; positive qty/price; only highest tier open-ended (`maxQty:null`); **lowest tier `minQty` ≥ MOQ**; **no overlapping ranges** (sorted, strict). Client mirror in `client/src/utils/pricing.js` (`validateTiersClient`, `activeTierIndex`, `formatPrice`, `formatQty`).
- **Frontend:** `pages/ProductForm.jsx` (`/products/new`, `/products/:id/edit`; repeatable tier rows, image upload = create-then-attach), `pages/MyProducts.jsx` (`/products`; edit/delete/toggle table), `pages/ProductDetail.jsx` (`/product/:id`; gallery, **live quantity→tier highlight in accent**, MOQ, CTAs: Order Now/Message Seller/Include in RFQ/Add to Favorites), `components/ProductCard.jsx` (shared), `constants/categories.js`, `services/productService.js`.

### Phase 4 — Search & Discovery
- **Routes** (`/api/products`): `GET /search` (aggregation: `$text` keyword, `category` single/comma→`$in`, `region` via `$lookup` to `companyprofiles` on `sellerRef=userRef`, `minPrice`/`maxPrice` on computed lowest tier `minPrice`, `minMoq`/`maxMoq`; sorts by text score else newest), `GET /meta` (distinct regions + price/MOQ bounds).
- **Frontend:** `pages/Search.jsx` (`/search` + `/marketplace`; debounced keyword synced to `?q=`, sidebar filters = category checkboxes + region dropdown + price/MOQ RangeSliders, active filter chips in `fill-subtle` + Clear all, friendly empty state), `hooks/useDebounce.js`, `components/RangeSlider.jsx` (dual min/max sliders). Navbar has a search box → `/search?q=`.

### Phase 5 — RFQ (Request for Quotation)
- **Model `RFQ`** (`server/models/RFQ.js`): `buyerRef`, `title`, `description`, `category` (shares Product enum), `quantityNeeded`, `targetPrice` (nullable), `deadline` (required, future), `status` (enum `open`/`closed`), timestamps.
- **Model `Quote`** (`server/models/Quote.js`): `rfqRef`, `sellerRef`, `pricePerUnit`, `message`, `deliveryEstimate`, `status` (enum `submitted`/`accepted`/`rejected` — **added beyond base spec** for tracking), timestamps. **Compound unique index `(rfqRef, sellerRef)`** = one quote per seller per RFQ (resubmit updates).
- **Routes** (`/api/rfqs`): `POST /` (buyer), `GET /mine` (buyer; RFQs + quotes), `GET /` (public feed w/ `category`/`status`, incl. quote counts), `GET /:id` (`optionalAuth`; returns `{rfq, quotes, myQuote}`), `PATCH /:id/close` (buyer owner), `POST /:id/quotes` (seller submit/update). (`/api/quotes`): `GET /mine` (seller), `PATCH /:id/status` (buyer owner accept/reject).
- **Frontend:** `pages/PostRFQ.jsx` (`/rfqs/new`), `pages/MyRFQs.jsx` (`/rfqs/mine`; sortable-by-price comparison table, Accept/Reject/Negotiate/Close), `pages/BuyingLeads.jsx` (`/rfqs`; category filter), `pages/RFQDetail.jsx` (`/rfqs/:id`; seller Submit Quote form, competitor prices hidden), `pages/MyQuotes.jsx` (`/quotes/mine`), `services/rfqService.js`.
- **Flow:** buyer posts RFQ → seller quotes → buyer compares/accepts → "Negotiate" opens chat → order placement closes RFQ.

### Phase 6 — Chat & Negotiation (real-time, Socket.io)
- **Model `Conversation`** (`server/models/Conversation.js`): `participants[2 User refs]` (validated len 2), `contextType` (enum `product`/`rfq`), `contextRef`, `lastMessageAt`, timestamps.
- **Model `Message`** (`server/models/Message.js`): `conversationRef`, `senderRef`, `text`, `type` (enum `text`/`offer`), `offerDetails{pricePerUnit, quantity, notes}`, `readBy[User refs]`, timestamps.
- **Routes** (`/api/conversations`, all protect): `POST /` (get-or-create; derives seller for product context, needs `participantId` for rfq), `GET /` (list + last message + unreadCount + other + context), `GET /:id/messages` (participant-guarded; marks read), `POST /:id/messages` (text/offer; broadcasts via Socket.io).
- **Socket.io** (`server/config/socket.js`): JWT auth handshake (`socket.handshake.auth.token`); rooms `user:<userId>` (personal/inbox) and `conversation:<convId>` (thread); events server→client `newMessage`, `conversationUpdated`, `presence:snapshot`/`presence:online`/`presence:offline`; client→server `conversation:join`/`conversation:leave`. Exports `getIO()`. In-memory presence Map.
- **Frontend:** `services/socket.js` (singleton client with token auth), `services/chatService.js`, `store/chatStore.js` (`unreadTotal` + `online` set), `pages/ChatPage.jsx` (`/chat`, `/chat/:id`; two-pane inbox + thread, live append with dedup by `_id`, **sent=primary bubble/white, received=fill-subtle/text-primary**, unread badge in accent, presence dots, "+ Offer" form → offer card, buyer "Accept Offer" → `/orders/new?...` prefilled). `App.jsx` connects socket on auth, keeps unread badge fresh, tracks presence. Navbar "Messages" link with unread badge.
- **Entry points:** ProductDetail "Message Seller" → `/chat?product=<id>`; MyRFQs "Negotiate" → `/chat?rfq=<id>&participant=<sellerId>`.

### Phase 7 — Order Management
- **Model `Order`** (`server/models/Order.js`): `buyerRef`, `sellerRef`, `productRef`|`rfqRef`, `quantity`, `agreedPricePerUnit`, `totalAmount`, `status` (enum `pending_payment`/`processing`/`shipped`/`delivered`/`cancelled` — exported `ORDER_STATUSES`), `paymentMethod` (enum `cod`), `paymentStatus` (enum `pending`/`paid`/`refunded`), `shippingAddress`, `statusHistory[{status, timestamp}]`, timestamps.
- **Routes** (`/api/orders`, all protect): `POST /` (buyer; product→derive seller + enforce MOQ + tier price, or rfq/offer→negotiated price + seller; computes total; seeds statusHistory; **auto-closes RFQ** if `rfqRef`), `GET /mine` (buyer), `GET /received` (seller), `GET /:id` (participant), `PATCH /:id/status` (seller; forward-only via `FORWARD` map), `PATCH /:id/cancel` (buyer; only while `pending_payment`). *(Phase 12 adds settlement + payment-received.)*
- **Frontend:** `pages/OrderCreate.jsx` (`/orders/new`; product & offer entry points, live tier/MOQ, COD summary), `pages/MyOrders.jsx` (`/orders/mine`), `pages/ReceivedOrders.jsx` (`/orders/received`), `pages/OrderDetail.jsx` (`/orders/:id`; stepper, summary, contact/shipping, seller Mark Shipped/Delivered, buyer Cancel), `components/OrdersView.jsx` (shared table + status tabs), `components/StatusStepper.jsx` (completed=success, current=accent, future=fill-subtle; danger banner if cancelled), `services/orderService.js`. ProductDetail "Order Now" (navy) → prefilled order.
- **Notes:** COD `paymentStatus` starts `pending`; seller confirms collection after delivery (Phase 12).

### Phase 8 — Notifications
- **Model `Notification`** (`server/models/Notification.js`): `userRef` (→User), `type` (enum `new_quote`/`new_message`/`order_status_change`/`rfq_response`), `message`, `linkTo`, `isRead` (default false), timestamps. Index on `(userRef, createdAt)`.
- **Utility:** `server/utils/createNotification.js` — persists notification + emits `newNotification` to `user:<userId>` via `getIO()`.
- **Routes** (`/api/notifications`, all protect): `GET /` (recent 20 + `unreadCount`), `PATCH /read-all`, `PATCH /:id/read`.
- **Triggers:** seller submits/updates quote on RFQ → buyer (`new_quote`); new chat message → other participant (`new_message`); seller advances order status → buyer (`order_status_change`).
- **Frontend:** `services/notificationService.js`, `store/notificationStore.js`, `components/NotificationBell.jsx` (white bell on navy navbar, accent unread badge, dropdown w/ mark-all + click→`linkTo`). `App.jsx` listens for `newNotification` on the global socket; store resets on logout.

### Phase 9 — Reviews & Ratings
- **Model `Review`** (`server/models/Review.js`): `orderRef` (→Order, **unique** — one review per order), `buyerRef`, `sellerRef`, `ratings{productQuality, onTimeDelivery, communication}` (1–5 each), `comment`, timestamps. Reviews only on `delivered` orders.
- **Utility:** `server/utils/sellerRatings.js` — `getSellerRatingSummary(sellerRef)` aggregates count, per-category averages, overall.
- **Routes** (`/api/reviews`, protect): `POST /` (buyer; order must be delivered + buyer-owned), `GET /order/:orderId` (participant; returns review or null).
- **Company API:** `GET /api/company/:id` now includes `ratings` summary alongside `profile` + `products`.
- **Frontend:** `services/reviewService.js`, `components/StarDisplay.jsx`, `StarInput.jsx`, `ReviewForm.jsx` (+ `ReviewSummary`), `SellerRatings.jsx` (overall accent stars + category breakdown bars). `OrderDetail.jsx` — buyer sees accent **Leave a Review** on delivered orders (hidden after submit). `CompanyProfilePublic.jsx` — seller ratings section.

### Phase 10 — Admin Dashboard
- **Model changes:** `User.isSuspended` (Boolean, default false; blocks login + `protect` when true; included in `toSafeObject`); `CompanyProfile.verificationStatus` (enum `pending`/`approved`/`rejected`, default `pending`).
- **Routes** (`/api/admin`, all `protect` + `authorize("admin")`): `GET /stats`, `GET /verifications`, `PATCH /verifications/:id` (`{action:"approve"|"reject"}`), `GET /users` (`?q`/`?role`), `PATCH /users/:id/suspend` (`{suspended}`), `GET /products` (`?q`/`?category`/`?active`), `PATCH /products/:id/active` (`{active}`), `DELETE /products/:id`.
- **Controller** (`adminController.js`): stats (users/sellers/buyers/orders + GMV via aggregate on non-cancelled orders); pending list = `isVerified:false` & `verificationStatus != rejected`; approve sets `isVerified:true`+approved, reject sets rejected; admins can't be suspended and can't self-suspend.
- **Seed:** admin created via existing `npm run seed:admin` (`seed/seedAdmin.js`); no public admin signup.
- **Frontend:** `services/adminService.js`, `components/AdminLayout.jsx` (primary-navy sidebar, own chrome; public Navbar + footer hidden on `/admin/*` via `useLocation` in `App.jsx`), pages under `pages/admin/` — `AdminStats.jsx` (stat cards, primary accents), `AdminVerifications.jsx` (approve=success/reject=danger, view doc links), `AdminUsers.jsx` (search + role tabs, suspend/activate, debounced), `AdminProducts.jsx` (search/category/status filters, hide/show + remove). `/admin` uses nested routes (`index`, `verifications`, `users`, `products`).
- **Notes:** Disputes/Reports view was optional and **not built** (no report feature exists yet). Stale "Coming soon" subtext removed from `Dashboard.jsx` action cards.

### Phase 11 — Favorites / Watchlist
- **Model `Favorite`** (`server/models/Favorite.js`): `userRef`, `itemType` (enum `product`/`company`), `itemRef`, timestamps. Compound unique index `(userRef, itemType, itemRef)` — separate collection chosen over arrays on `User` for scalability.
- **Routes** (`/api/favorites`, `protect` + `authorize("buyer")`): `GET /ids` (productIds + companyIds for toggles), `GET /` (populated watchlist), `POST /toggle` (`{itemType, itemRef}`).
- **Frontend:** `services/favoriteService.js`, `store/favoriteStore.js` (id Sets, optimistic toggle; loaded in `App.jsx` for buyers), `components/FavoriteButton.jsx` (bookmark icon: filled `accent` / outline `text-secondary`). `ProductCard` accepts `showFavorite`; hearts on `Search`, `CompanyProfilePublic` product grid, `ProductDetail` title row, company header bookmark. `pages/MyFavorites.jsx` — buyer-only `/favorites` with **Saved Products** / **Saved Suppliers** tabs. Navbar + buyer dashboard link.

### Phase 12 — Payment & Settlement (mock COD)
- **No gateway** — all orders created with `paymentMethod: "cod"` and `paymentStatus: "pending"`. Status tracked in DB only (legitimate FYP scope; real Stripe/JazzCash/Easypaisa = future work).
- **Routes** (extended `/api/orders`): `GET /settlement/summary` (seller; orders + `pendingTotal`/`paidTotal`), `PATCH /:id/payment-received` (seller; delivered + pending → `paid`). Removed auto-paid-on-deliver from `PATCH /:id/status` — seller manually confirms COD via accent **Mark Payment as Received** on `OrderDetail`.
- **Frontend:** `pages/SettlementSummary.jsx` (`/orders/settlement`) — simulation notice banner, two summary cards (pending=accent, paid=success), orders table with amount + payment pills. Seller navbar + dashboard links. Toast prompt after marking delivered to confirm payment.

---

## 4. Folder Structure (current, app code only — excludes node_modules)

```
Vicinity/
├── .env.example                 # combined SERVER + CLIENT template
├── .gitignore
├── package.json                 # root: concurrently scripts (install:all, dev, server, client)
├── README.md
├── PROJECT_STATUS.md            # this file
│
├── server/
│   ├── .env                     # (gitignored; not readable by tools)
│   ├── .env.example
│   ├── package.json             # scripts: start, dev (nodemon), seed:admin, seed:demo
│   ├── app.js                   # express app: cors, json, morgan, /uploads static, /api routes, 404 + errorHandler
│   ├── server.js                # bootstrap: connectDB → http server → initSocket → listen
│   ├── uploads/                 # local-disk uploaded files (.gitkeep)
│   ├── config/
│   │   ├── db.js                # mongoose connect
│   │   └── socket.js            # Socket.io init (auth, rooms, presence), exports initSocket + getIO
│   ├── middleware/
│   │   ├── auth.js              # protect, optionalAuth, authorize
│   │   ├── upload.js            # multer local disk + fileUrl()
│   │   ├── errorHandler.js      # consistent { success:false, message }
│   │   └── notFound.js
│   ├── models/
│   │   ├── User.js
│   │   ├── CompanyProfile.js
│   │   ├── Product.js           # + exports PRODUCT_CATEGORIES
│   │   ├── RFQ.js
│   │   ├── Quote.js
│   │   ├── Conversation.js
│   │   ├── Message.js
│   │   ├── Order.js             # + exports ORDER_STATUSES
│   │   ├── Notification.js      # + exports NOTIFICATION_TYPES
│   │   ├── Review.js
│   │   └── Favorite.js
│   ├── controllers/
│   │   ├── healthController.js
│   │   ├── authController.js
│   │   ├── companyController.js
│   │   ├── productController.js
│   │   ├── rfqController.js
│   │   ├── quoteController.js
│   │   ├── conversationController.js
│   │   ├── orderController.js
│   │   ├── notificationController.js
│   │   ├── reviewController.js
│   │   ├── adminController.js
│   │   └── favoriteController.js
│   ├── routes/
│   │   ├── index.js             # mounts all routers under /api
│   │   ├── healthRoutes.js      # /api/health
│   │   ├── authRoutes.js        # /api/auth
│   │   ├── companyRoutes.js     # /api/company
│   │   ├── productRoutes.js     # /api/products
│   │   ├── rfqRoutes.js         # /api/rfqs
│   │   ├── quoteRoutes.js       # /api/quotes
│   │   ├── conversationRoutes.js# /api/conversations
│   │   ├── orderRoutes.js       # /api/orders
│   │   ├── notificationRoutes.js# /api/notifications
│   │   ├── reviewRoutes.js      # /api/reviews
│   │   ├── adminRoutes.js       # /api/admin (authorize admin)
│   │   └── favoriteRoutes.js    # /api/favorites (authorize buyer)
│   ├── utils/
│   │   ├── generateToken.js
│   │   ├── validateTiers.js
│   │   ├── createNotification.js
│   │   └── sellerRatings.js
│   └── seed/
│       ├── seedAdmin.js
│       └── seedDemo.js          # full demo dataset (all 12 modules)
│
└── client/
    ├── .env                     # (gitignored)
    ├── .env.example
    ├── package.json
    ├── index.html               # loads Fraunces / IBM Plex Sans / IBM Plex Mono
    ├── vite.config.js           # port 5173
    ├── tailwind.config.js       # Trade Navy tokens + font families
    ├── postcss.config.js
    ├── public/vite.svg
    └── src/
        ├── main.jsx             # BrowserRouter + App
        ├── App.jsx              # routes, Navbar, Toaster, socket lifecycle, loadUser
        ├── index.css            # tailwind layers; h1-h6 → Fraunces; .num helper
        ├── components/
        │   ├── Navbar.jsx
        │   ├── NotificationBell.jsx
        │   ├── StarDisplay.jsx
        │   ├── StarInput.jsx
        │   ├── ReviewForm.jsx
        │   ├── SellerRatings.jsx
        │   ├── FavoriteButton.jsx
        │   ├── AdminLayout.jsx
        │   ├── Toaster.jsx
        │   ├── ProtectedRoute.jsx
        │   ├── VerifiedBadge.jsx
        │   ├── StatusPill.jsx
        │   ├── ProductCard.jsx
        │   ├── RangeSlider.jsx
        │   ├── OrdersView.jsx
        │   └── StatusStepper.jsx
        ├── pages/
        │   ├── Home.jsx
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── Dashboard.jsx
        │   ├── Unauthorized.jsx
        │   ├── NotFound.jsx
        │   ├── CompanyProfileEdit.jsx
        │   ├── CompanyProfilePublic.jsx
        │   ├── MyProducts.jsx
        │   ├── ProductForm.jsx
        │   ├── ProductDetail.jsx
        │   ├── Search.jsx
        │   ├── BuyingLeads.jsx
        │   ├── RFQDetail.jsx
        │   ├── PostRFQ.jsx
        │   ├── MyRFQs.jsx
        │   ├── MyQuotes.jsx
        │   ├── ChatPage.jsx
        │   ├── OrderCreate.jsx
        │   ├── MyOrders.jsx
        │   ├── ReceivedOrders.jsx
        │   ├── OrderDetail.jsx
        │   ├── SettlementSummary.jsx
        │   ├── MyFavorites.jsx
        │   └── admin/
        │       ├── AdminStats.jsx
        │       ├── AdminVerifications.jsx
        │       ├── AdminUsers.jsx
        │       └── AdminProducts.jsx
        ├── services/
        │   ├── api.js           # axios instance + JWT interceptor
        │   ├── authService.js
        │   ├── companyService.js
        │   ├── productService.js
        │   ├── rfqService.js
        │   ├── chatService.js
        │   ├── socket.js        # socket.io-client singleton
        │   ├── orderService.js
        │   ├── notificationService.js
        │   ├── reviewService.js
        │   ├── adminService.js
        │   └── favoriteService.js
        ├── store/
        │   ├── authStore.js     # Zustand persist (vt-auth)
        │   ├── toastStore.js
        │   ├── chatStore.js     # unreadTotal + online presence set
        │   ├── notificationStore.js
        │   └── favoriteStore.js
        ├── hooks/
        │   └── useDebounce.js
        ├── utils/
        │   └── pricing.js       # validateTiersClient, activeTierIndex, formatPrice, formatQty
        └── constants/
            └── categories.js    # PRODUCT_CATEGORIES + STOCK_STATUS_OPTIONS
```

### API route map (all under `/api`)
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
/reviews        POST /, GET /order/:orderId
/admin          GET /stats, GET /verifications, PATCH /verifications/:id,
                GET /users, PATCH /users/:id/suspend,
                GET /products, PATCH /products/:id/active, DELETE /products/:id
/favorites      GET /ids, GET /, POST /toggle
```

---

## 5. Environment Variables (names only)

**`server/.env`:**
- `PORT` — API port (default 5000)
- `NODE_ENV` — development/production
- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — secret for signing JWTs
- `JWT_EXPIRES_IN` — token lifetime (e.g. 7d)
- `CLIENT_URL` — client origin for CORS + Socket.io (http://localhost:5173)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — optional (unused; local disk storage is default)
- `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` — used by `npm run seed:admin`

**`client/.env`:**
- `VITE_API_URL` — backend API base (http://localhost:5000/api)
- `VITE_SOCKET_URL` — Socket.io base (http://localhost:5000)

---

## 6. Project Complete

All **12 planned phases** are implemented. Optional future work (not in scope): real payment gateways, disputes/reports module, Cloudinary migration for uploads.

---

## 7. Testing State

Phases **1–7 have each been manually tested by the user and confirmed working**:
- **Phase 1:** register/login for buyer & seller, role-based navbar, persisted session on refresh, role restrictions.
- **Phase 2:** seller company profile creation, public profile page, verified badge correctly hidden when `isVerified=false`.
- **Phase 3:** product create/edit, public product page, tiered pricing display, live quantity→tier highlight, invalid tier/MOQ rejected.
- **Phase 4:** keyword/category/region/price/MOQ filters (individually + combined), empty state, filter chips + clear-all.
- **Phase 5:** RFQ posting, seller quote submission, buyer comparison table, buyers blocked from quoting.
- **Phase 6:** real-time chat between two accounts, offer cards, Accept Offer captures data, unread indicators, history persists on refresh.
- **Phase 7:** built; order create (product + accepted offer), My Orders/Orders Received tabs, stepper, seller status transitions, buyer cancel, RFQ auto-close on order. (Confirm end-to-end run after server restart.)
- **Phase 8:** built; notification bell + dropdown, real-time `newNotification` socket event, triggers on quote submit, new message, order status change. (Confirm end-to-end run after server restart.)
- **Phase 9:** built; review on delivered orders (one per order), star ratings + comment form on order detail, aggregated seller ratings on public company profile. (Confirm end-to-end run after server restart.)
- **Phase 10:** built; admin sidebar layout, platform stat cards, pending verification approve/reject with doc links, users table with suspend/activate, products moderation (hide/remove). Admin routes guarded by `authorize("admin")`; suspended users blocked at login + on every request. (Confirm end-to-end run after server restart — `User`/`CompanyProfile` schema changes require restart.)
- **Phase 11:** built; buyer favorites (products + suppliers), heart toggles on cards/profiles/detail, My Favorites page with two tabs. (Confirm end-to-end run after server restart.)
- **Phase 12:** built; manual COD payment confirmation, seller settlement summary with pending/paid totals. (Confirm end-to-end run after server restart.)

**Environment note:** The IDE shell/terminal was NOT executing during development (commands returned no status), so all verification has been done by the **user running the apps manually**. `node_modules` are installed for both `/client` and `/server`. After adding models/routes, the server must be **restarted** for changes to load (and for new Mongoose indexes to build).
```
