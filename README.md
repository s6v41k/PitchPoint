# PitchPoint

A web app for booking football (soccer) pitches. Players search nearby
pitches, see real-time availability, and book a time slot in a few clicks.
Pitch owners (clubs, communes, private facilities) get a dashboard to
manage their pitches and the bookings made on them.

Built as a university project (Web Fundamentals resit).

## Tech stack

- **Frontend:** Vue 3 (Composition API, `<script setup>`) + Vite, Vue Router, Pinia, Tailwind CSS
- **Backend:** Node.js + Express.js, REST API
- **Database:** MySQL via Sequelize (ORM)
- **Auth:** JWT, passwords hashed with bcrypt

## Project structure

```
PitchPoint/
├── backend/     Express REST API
│   └── src/
│       ├── config/       Sequelize connection setup
│       ├── models/       User, Pitch, Booking + associations
│       ├── middleware/   auth, role check, validation, error handling
│       ├── controllers/  request handlers (business logic)
│       ├── routes/       Express routers, wired to controllers
│       └── scripts/      seed.js — optional sample data
└── frontend/    Vue 3 SPA
    └── src/
        ├── api/          axios calls to the backend, one file per resource
        ├── stores/       Pinia stores (auth)
        ├── components/   reusable UI pieces (Navbar, PitchCard, ...)
        ├── views/        one component per route/page
        └── router/       Vue Router config + navigation guards
```

## Prerequisites

- Node.js 18+
- A running MySQL server (locally, or via Docker/XAMPP/etc.)

## 1. Database setup

Create an empty database — the app creates its own tables automatically,
you just need the schema to exist:

```sql
CREATE DATABASE pitchpoint;
```

## 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env   # then edit .env with your MySQL credentials
npm run dev
```

The API starts on `http://localhost:4000` (configurable via `PORT`).
On startup it connects to MySQL and calls `sequelize.sync({ alter: true })`,
which creates/updates the `users`, `pitches` and `bookings` tables to match
the Sequelize models — no manual migrations needed for this project.

Optional: seed a couple of test accounts and pitches:

```bash
npm run db:seed
```

This creates:
- `owner@example.com` / `password123` (role: owner, has 3 pitches)
- `player@example.com` / `password123` (role: player)

For a much larger demo dataset — 38 pitches spread across all 19 communes
of the Brussels-Capital Region, 11 users and 19 bookings — run
`backend/sql/seed_brussels.sql` directly against MySQL instead:

```bash
mysql -u <user> -p pitchpoint < sql/seed_brussels.sql
```

It's idempotent (wipes `bookings`/`pitches`/`users` and resets
auto-increment before inserting), so re-running it always leaves the same
clean dataset. All accounts use password `password123` — see the comments
at the top of the file for the full account list.

### Backend environment variables (`backend/.env`)

| Variable | Description |
|---|---|
| `PORT` | Port the API listens on |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | MySQL connection |
| `JWT_SECRET` | Secret used to sign JWTs — use a long random string |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `CLIENT_URL` | Frontend origin, used for CORS |
| `AUTOMATION_WEBHOOK_URL` | Optional. If set, a POST fires on every new booking — see [Automation](#automation) |

## 3. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env   # defaults already point at http://localhost:4000/api
npm run dev
```

The app starts on `http://localhost:5173` (Vite's default) and talks to
the backend via the URL in `VITE_API_URL`.

## Data model

```
User        id, name, email, passwordHash, role ('player' | 'owner')
Pitch       id, name, address, lat, lng, surfaceType, size, pricePerHour,
            photos (JSON array of URLs), ownerId -> User
Booking     id, pitchId -> Pitch, userId -> User, date, startTime, endTime,
            status ('confirmed' | 'cancelled'), createdAt
```

Associations (declared in `backend/src/models/index.js`):
- A `User` (owner) **has many** `Pitch` — a `Pitch` **belongs to** one owner.
- A `User` (player) **has many** `Booking` — a `Booking` **belongs to** one user.
- A `Pitch` **has many** `Booking` — a `Booking` **belongs to** one pitch.

## API overview

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create an account, returns a JWT |
| POST | `/api/auth/login` | — | Log in, returns a JWT |
| GET | `/api/auth/me` | JWT | Current user, used to restore sessions on page load |
| PUT | `/api/auth/me` | JWT | Update own name/email, or change password (requires `currentPassword`) |
| GET | `/api/pitches` | — | List/search/filter pitches |
| GET | `/api/pitches/mine` | JWT, owner | The logged-in owner's own pitches |
| GET | `/api/pitches/:id` | — | Pitch detail |
| GET | `/api/pitches/:id/bookings?date=` | — | Confirmed bookings on a pitch for one day (availability) |
| POST | `/api/pitches` | JWT, owner | Create a pitch |
| PUT | `/api/pitches/:id` | JWT, owner (own pitch) | Update a pitch |
| DELETE | `/api/pitches/:id` | JWT, owner (own pitch) | Delete a pitch |
| GET | `/api/bookings/me` | JWT | The logged-in user's bookings |
| GET | `/api/bookings/owner` | JWT, owner | All bookings on pitches this owner manages |
| POST | `/api/bookings` | JWT | Create a booking (validates no overlap) |
| DELETE | `/api/bookings/:id` | JWT (booking's owner) | Cancel a booking |

## Non-obvious parts, explained

### Auth flow

1. `POST /api/auth/register` or `/login` hashes/checks the password with
   bcrypt and, on success, signs a JWT containing `{ id, role }`
   (`backend/src/controllers/authController.js`). The password hash is
   never sent back to the client.
2. The frontend stores only the token (`localStorage`, key
   `pitchpoint_token` — see `frontend/src/stores/auth.js`). It's attached
   to every API request as an `Authorization: Bearer <token>` header by an
   axios interceptor (`frontend/src/api/client.js`).
3. On the backend, `middleware/auth.js`'s `requireAuth` verifies that
   header and attaches the decoded payload to `req.user`. `requireRole(...)`
   then checks `req.user.role` for owner-only routes.
4. On page reload, the token alone is restored from `localStorage`; the
   full `user` object is re-fetched from `GET /api/auth/me` rather than
   also being cached, so it can never go stale (`initFromStorage` in the
   Pinia store).
5. Vue Router's `beforeEach` guard (`frontend/src/router/index.js`) reads
   `route.meta.requiresAuth` / `requiresOwner` and redirects to `/login` or
   `/` accordingly — a single place decides which routes are protected.

### Booking overlap validation

The core business rule: a pitch can't be double-booked. Two `[start, end)`
time ranges overlap exactly when:

```
existing.startTime < new.endTime  AND  existing.endTime > new.startTime
```

`bookingController.createBooking` runs this as a Sequelize `WHERE` clause
against existing `confirmed` bookings for the same pitch and date. If any
row matches, the request is rejected with `409 Conflict`.

Checking-then-creating is a classic race condition — two requests for the
same free slot could both pass the check before either has inserted its
row. This is closed with a Sequelize transaction that takes a row lock
(`SELECT ... FOR UPDATE`, via `lock: t.LOCK.UPDATE`) on the **pitch**
being booked: concurrent booking attempts for the *same* pitch are forced
to run one after another, so the second request's overlap check always
sees the first request's newly-created booking. Bookings for different
pitches aren't affected and still run fully in parallel.

Cancelling a booking (`DELETE /api/bookings/:id`) doesn't delete the row —
it sets `status = 'cancelled'`, so booking history stays visible in "my
bookings" and the slot is simply excluded from the overlap check (which
only looks at `status: 'confirmed'`) and shows as free again.

### Profile management

`PUT /api/auth/me` (`authController.updateMe`) handles both name/email
edits and password changes through one endpoint, but treats them as two
independent operations: `name`/`email` are applied whenever present, while
a password change only happens if `newPassword` is present *and* the
request also includes the correct `currentPassword` — checked with
`bcrypt.compare` against the stored hash before anything is changed. This
means a logged-in session alone is never enough to change the password
(e.g. someone using an unlocked, still-logged-in browser), while editing
your name doesn't force you to re-type your password every time. The
frontend (`views/ProfileView.vue`) mirrors this with two separate forms
that submit independently.

### Automation webhook (fire-and-forget)

`utils/webhook.js`'s `notifyAutomation(event, data)` is called (not
awaited) from `bookingController.createBooking` after a booking is
created. It only does something if `AUTOMATION_WEBHOOK_URL` is set — with
it empty, `notifyAutomation` returns immediately, so the app behaves
identically with or without automation configured. When it is set, the
`fetch(...).catch(...)` deliberately isn't awaited by the caller: a slow
or unreachable third-party webhook (Zapier, n8n, ...) must never add
latency to, or fail, the booking request that triggered it — the response
is already sent to the player before the webhook call is even made. See
[Automation](#automation) below for what to point it at.

### Sequelize associations

Models are defined individually (`models/User.js`, `Pitch.js`,
`Booking.js`) with no knowledge of each other, to avoid circular
`require()`s. All `hasMany`/`belongsTo` associations are declared once, in
`models/index.js`, which is the only file that imports every model. This
is what lets controllers write `Pitch.findAll({ include: [{ model: User,
as: 'owner' }] })` and get a pitch with its owner's info in a single SQL
query (a `JOIN` under the hood) instead of N+1 separate queries.

## Automation

PitchPoint fires a webhook every time a booking is created — this is the
integration point for an external automation tool (Zapier used here; n8n
or Make work the same way, since it's just a POST request). It's used to
send the player a booking confirmation email with no extra backend code:
the workflow lives entirely in Zapier, and the app just tells it "a
booking happened, here are the details."

### How it works

1. `POST /api/bookings` succeeds → `bookingController.createBooking`
   calls `notifyAutomation('booking.created', {...})`
   (`backend/src/utils/webhook.js`).
2. If `AUTOMATION_WEBHOOK_URL` is set in `backend/.env`, that function
   sends:
   ```json
   {
     "event": "booking.created",
     "data": {
       "bookingId": 12,
       "date": "2026-09-05",
       "startTime": "09:00",
       "endTime": "10:00",
       "pitch": { "id": 3, "name": "Stade Communal de Woluwe", "address": "..." },
       "player": { "name": "Paul Player", "email": "player@example.com" }
     },
     "sentAt": "2026-08-11T09:03:17.688Z"
   }
   ```
3. Zapier receives that POST and sends a confirmation email to
   `data.player.email`.

If `AUTOMATION_WEBHOOK_URL` is left empty, nothing happens — bookings
work exactly the same either way.

### Setting it up (Zapier, ~5 minutes, no coding)

1. Go to [zapier.com](https://zapier.com) and create a free account.
2. Click **Create Zap**.
3. **Trigger step:** search for and choose **Webhooks by Zapier** →
   event **Catch Hook** → Continue → Continue (no extra setup needed).
   Zapier now shows you a unique webhook URL, e.g.
   `https://hooks.zapier.com/hooks/catch/12345/abcdef/`. Copy it.
4. Paste that URL into `backend/.env`:
   ```
   AUTOMATION_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/12345/abcdef/
   ```
5. Restart the backend (`npm run dev` picks up `.env` on start).
6. Book any pitch through the app (as a logged-in player) so a real POST
   reaches Zapier.
7. Back in Zapier, click **Test trigger** — it should show the booking
   payload from step 6 (Zapier keeps the last request it received).
8. **Action step:** click **+**, search for **Email by Zapier**, choose
   event **Send Outbound Email**. No account connection needed — it's a
   built-in Zapier action.
9. Configure the email fields using the data from the test payload
   (click into each field and pick the matching item from the insert-data
   panel):
   - **To:** `data__player__email`
   - **Subject:** e.g. `Booking confirmed: {{data__pitch__name}}`
   - **Body:** e.g.
     `Hi {{data__player__name}}, your booking at {{data__pitch__name}} on {{data__date}} from {{data__startTime}} to {{data__endTime}} is confirmed.`
10. Click **Publish Zap** (top right) and make sure it's turned **on**.
11. Make another booking in the app — the player should receive a real
    confirmation email within a minute or two.

That's the whole flow: no code changes needed on your end beyond pasting
the webhook URL into `.env`. If you want a different action instead of
email (e.g. logging bookings to a Google Sheet), swap step 8 for a
**Google Sheets → Create Spreadsheet Row** action — the trigger and
payload stay exactly the same.

## Nice-to-haves not (yet) implemented

- Map view of nearby pitches (Leaflet + OpenStreetMap)
- Ratings & reviews
- "Forgot password" flow for logged-out users (profile page already
  supports changing your password once logged in — see
  [Profile management](#profile-management))

These were left out to focus on the required CRUD/auth/booking flows
first, per the project brief.
