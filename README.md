# Wed Plan

A simple, mobile-first wedding planning app focused on the thing that gets messy fast: **money + decisions**.

Wed Plan helps you:
- break your wedding down into **expense items** (venue, accommodation, photographer, etc.)
- organize those expenses into **groups** (e.g. Location, Outfits, Food)
- track multiple vendor options per expense
- separate **Selected** (shortlisted choice) from **Booked** (finalized)
- monitor budget, paid amounts, outstanding amounts, and due dates

---

## What it is

Wed Plan is a self-hosted web app (Next.js + SQLite) designed for couples planning a wedding from their phones.

It prioritizes:
- minimal friction UI
- clear budget visibility
- practical planning workflows over complex project-management features

---

## Core concepts

### Group
High-level bucket of related expenses.

Examples:
- Location
- Food & Drink
- Attire

### Expense
A single budget line item (internally backed by the `categories` table for backward compatibility).

Examples:
- Venue
- Accommodation
- Wedding Dress

### Vendor option
An option under an expense with price/details.

Each option can be:
- **Selected**: currently preferred option
- **Booked**: confirmed/finalized option

---

## Features

## Dashboard
- Total budget overview
- Committed / Paid / Outstanding totals
- Grouped expense list
- Add expenses directly from the dashboard
- Manage groups from the dashboard
- Reorder expenses within each group via drag handles
- Collapsible groups (mobile-friendly)
- Group-level summary:
  - committed vs budget
  - number of expenses
  - amount left
- Upcoming payment reminders (deposit/final payment due)

## Expenses
- The previous standalone expenses page now redirects to the dashboard
- Expense detail pages remain under `/categories/:id` for compatibility

## Expense detail
- Delete the expense from the detail page
- Add/edit/delete vendor options
- Compare options side-by-side
- Mark one option as selected
- Independently mark selected option as booked/unbooked
- Track:
  - price
  - notes, pros, cons, contact info
  - deposit paid / total paid
  - deposit due date / final payment due date
- Move expense between groups

## Settings
- Couple names + wedding date
- Total budget
- Theme: **Light / Dark / System**

## Data safety
- SQLite with WAL mode
- Non-destructive startup migrations for new columns/tables
- Easy file-level backup strategy

---

## Tech stack

- **Next.js 16** (App Router)
- **TypeScript**
- **SQLite** (`better-sqlite3`)
- **Drizzle ORM**
- **Docker / Docker Compose**

---

## Quick start

## Option A: Docker (recommended)

### 1) Clone
```bash
git clone https://github.com/CoreyHayward/wed-plan.git
cd wed-plan
```

### 2) Start
```bash
docker compose up -d --build
```

### 3) Open
- http://localhost:3000

The app will automatically initialize the database on first run.

## Option B: Local dev

### 1) Install dependencies
```bash
npm ci
```

### 2) Run development server
```bash
npm run dev
```

### 3) Open
- http://localhost:3000

---

## iPhone app (sideloading)

The repository includes a Capacitor iOS app that displays the same Next.js UI and uses the same API/database as the web app. The iPhone therefore needs network access to a running Wed Plan server; data remains in that server's SQLite database.

Requirements:

- macOS with Xcode 26 or newer
- Node.js 22 or newer
- a Wed Plan server URL reachable from the iPhone (HTTPS is recommended)
- Tesseract (`brew install tesseract`) for the OCR-backed simulator smoke checks

### Build an unsigned IPA

```bash
npm ci
npm run ios:ipa
```

The output is:

```text
artifacts/WedPlan-unsigned.ipa
```

With no build-time URL, the first launch shows a connection screen where you can enter the server URL. To bake in a default URL instead:

```bash
WED_PLAN_SERVER_URL=https://wed-plan.example.com npm run ios:ipa
```

The URL can still be replaced later from the app's connection-error screen.

The generated IPA is intentionally unsigned. To sign with a personal Apple developer account, open the project, choose the `App` target, select your Team under Signing & Capabilities, and run or archive it from Xcode:

```bash
npm run ios:open
```

### iOS development and verification

```bash
# Sync web/native configuration and plugins
npm run ios:sync

# Build for the local iPhone Simulator (defaults to http://127.0.0.1:3000)
npm run ios:simulator

# Build the first-launch connection-screen variant instead
WED_PLAN_SERVER_URL= npm run ios:simulator

# With the Next.js server running, verify and capture all seven UI routes
npm run ios:smoke

# Re-check the deep-route launch regression and captured UI screenshots
npm run ios:launch-check
npm run ios:screenshot-check

# Validate the IPA; add WED_PLAN_SERVER_URL to include live route/API checks
npm run ios:verify
```

The native guest-list export writes the CSV to the app cache and opens the iOS share sheet. Browser exports keep their existing behavior.

---

## Runtime configuration

Environment variables:

- `DATABASE_PATH` (optional)
  - Default in Docker setup: `/data/wedding.db`
  - Default in local dev: `./data/wedding.db`

`docker-compose.yml` mounts persistent data via named volume:
- `wed-plan-data:/data`

---

## Backups

### Create backup (Docker volume)
```bash
mkdir -p backups
TS=$(date +%F_%H-%M-%S)
docker run --rm \
  -v wed-plan_wed-plan-data:/data \
  -v "$PWD/backups":/backup \
  busybox sh -c "tar -czf /backup/wedplan_${TS}.tar.gz -C /data wedding.db wedding.db-wal wedding.db-shm"
```

### Restore backup
1. Stop app:
```bash
docker compose down
```
2. Extract backup into the mounted data volume location (or run a helper container to copy files back).
3. Start app again:
```bash
docker compose up -d
```

---

## Typical update flow

```bash
git pull origin main
docker compose up -d --build
```

---

## API overview (internal app routes)

- `GET/POST /api/categories` (expenses)
- `GET/PUT/DELETE /api/categories/:id`
- `GET/POST /api/categories/:id/vendors`
- `GET/PUT/DELETE /api/vendors/:id`
- `PUT /api/vendors/:id/select`
- `PUT /api/vendors/:id/deselect`
- `GET/POST /api/groups`
- `PUT/DELETE /api/groups/:id`
- `GET/PUT /api/settings`
- `GET /api/dashboard`

---

## Notes

- The UI calls them **Expenses**, but some route/table names still use `categories` for compatibility.
- Group deletion is safe: expenses are reassigned to another existing group.
- Selecting a new vendor for an expense clears previous selected/booked states in that expense.

---

## Documentation site

- Static docs live in `docs-site/`
- Open `docs-site/index.html` directly in a browser to preview it locally
- GitHub Pages deployment is handled by `.github/workflows/deploy-docs.yml`

---

## Troubleshooting

### App doesn’t reflect latest code
```bash
docker compose up -d --build
```

### Container running but app not reachable
```bash
docker compose ps
docker logs wed-plan --tail 200
```

### Need a clean rebuild
```bash
docker compose down
docker compose up -d --build
```

---

## License

Private project unless specified otherwise by repository owner.
