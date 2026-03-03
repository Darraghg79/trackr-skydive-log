# TrackR Skydive Log — Technical Memory

> **Read this file at the start of every Claude Code session.**
> This is the canonical source of architectural decisions, schema facts, and design system values.
> Also read `pm/DEV-STATUS.md` for current bugs and feature status.

---

## Project Overview

A mobile-first web app for skydivers to log jumps, manage gear, and invoice work jumps.
Single-user model — each user owns all their data (no org/multi-tenancy).

**Live:** Not yet deployed (Vercel + Supabase setup pending)
**Repo:** GitHub main branch (clean, no uncommitted changes as of March 2026)

---

## Architecture

### Framework
- **Next.js 14 App Router** — TypeScript strict mode
- **Route groups:** `(auth)` for login/register flows, `(dashboard)` for all protected pages
- **Middleware:** `middleware.ts` — protects `/(dashboard)` routes, redirects unauthenticated users to `/login`

### Database
- **PostgreSQL** hosted on Supabase
- **ORM:** Prisma — all DB access through `src/lib/prisma.ts`
- **Auth:** Supabase Auth handles auth only; Prisma handles all data (NOT Supabase Data API)
- **Tenant isolation:** All queries include `where: { userId: user.id }` — no RLS, app-level isolation

### Auth Pattern
```typescript
// Every API route uses this pattern:
const supabase = await createClient()
const { data: { user }, error: authError } = await supabase.auth.getUser()
if (authError || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
// Then use user.id for all Prisma queries
```

### Supabase Clients
- `src/lib/supabase/client.ts` — browser client (for client components)
- `src/lib/supabase/server.ts` — server client (for API routes and server components)

---

## Database Schema (Prisma)

All models are in `prisma/schema.prisma`. Key facts:

### User Model
- `currentJumpNumber` — the NEXT jump number to assign (starts at 1, increments after each jump)
- `startingFreefallTime` — freefall seconds before using the app (for cumulative totals)
- `startingCutaways` — cutaway count before using the app
- `unitPreference` — `IMPERIAL` | `METRIC` (affects altitude + distance display)
- `defaultDropzoneId`, `defaultExitAltitude`, `defaultDeploymentAltitude` — pre-fills JumpForm
- `invoiceStartingNumber` — for invoice number sequencing
- `hasCompletedOnboarding` — `Boolean @default(false)` — gates the onboarding wizard redirect
- `isWorkingSkydiver` — `Boolean @default(false)` — set during onboarding; determines invoice-related features

### Jump Model
- `freefallTime` stored in **seconds** (integer)
- `exitAltitude`, `deploymentAltitude`, `distanceToTarget` stored as raw integers (no unit conversion — display layer handles units)
- `isCutaway` — boolean, does NOT auto-increment `User.startingCutaways` (tracked separately)
- `isWorkJump` — gates `workJumpType`, `customerName`, `hasHandcam` fields
- `isImportedAsPaid` — import flag, prevents these jumps from appearing in invoice creation

### GearComponent Model
- `previousJumpCount` — jumps on this gear before adding to app
- Actual jump count = `previousJumpCount` + count of `JumpGearComponent` rows for this gear

### Invoice Model
- `shareableUrl` — unique token for public invoice sharing (`/share/invoice/[token]`)
- `shareableUrlExpiry` — optional expiry datetime

### Enums
```prisma
enum UnitPreference { METRIC, IMPERIAL }
enum GearComponentType { MAIN, RESERVE, AAD, CONTAINER, OTHER }
enum WorkJumpType { AFF, TANDEM, CAMERA, COACH }
enum InvoiceStatus { OPEN, SENT, PAID }
enum InvoiceLineItemType { BASE_JUMP, HANDCAM_ADDON }
```

---

## API Routes

All routes in `src/app/api/`. Pattern: collection route + item route per entity.

| Entity | Collection | Item |
|--------|-----------|------|
| Jumps | `/api/jumps` | `/api/jumps/[id]` |
| GearComponents | `/api/gear-components` | `/api/gear-components/[id]` |
| Rigs | `/api/rigs` | `/api/rigs/[id]` |
| Dropzones | `/api/dropzones` | `/api/dropzones/[id]` |
| UserJumpTypes | `/api/user-jump-types` | `/api/user-jump-types/[id]` |
| UserAircrafts | `/api/user-aircrafts` | `/api/user-aircrafts/[id]` |
| Invoices | `/api/invoices` | `/api/invoices/[id]` |
| GlobalDropzones | `/api/global-dropzones` *(public)* | — |
| GlobalAircrafts | `/api/global-aircrafts` *(auth)* | — |
| GlobalJumpTypes | `/api/global-jump-types` *(auth)* | — |

Special routes:
- `GET/PATCH /api/user` — user profile
- `GET /api/audit-logs` — jump number audit log
- `POST /api/jumps/[id]/signature` — add instructor signature
- `POST /api/jumps/bulk-sign` — sign multiple jumps at once
- `GET /api/jumps/uninvoiced` — work jumps not yet invoiced
- `GET /api/jumps/drill-down` — aggregate stats for reports
- `GET /api/jumps/filtered` — filtered jump list for reports
- `POST /api/jumps/import` — CSV import
- `GET /api/dropzones/with-uninvoiced` — dropzones that have uninvoiced work jumps
- `POST /api/invoices/[id]/share` — generate shareable URL

---

## Component Architecture

### Key Forms
- `src/components/forms/JumpForm.tsx` — main jump logging form. Includes auto-calculation of freefall time from altitudes. Respects `unitPreference` for `distanceToTarget` label (⚠️ altitude labels still hardcoded to ft — see bug B4).
- `src/components/forms/InvoiceForm.tsx` — invoice creation from uninvoiced work jumps

### Custom UI Components
- `src/components/ui/combobox.tsx` — searchable dropdown
- `src/components/ui/dropzone-combobox.tsx` — dropzone-specific searchable dropdown
- `src/components/ui/gear-multiselect.tsx` — multi-select for gear components with rig-based grouping

### Layout
- `src/components/layouts/BottomNav.tsx` — mobile bottom tab navigation
- `src/components/layouts/Header.tsx` — top header with page title + actions

---

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| Primary blue | `#3B82F6` | Buttons, active states, jump number badges |
| Indigo | `#6366F1` | Secondary accents |
| Purple | `#A855F7` | Tertiary (rarely used) |
| Card style | `bg-white dark:bg-card rounded-lg border shadow-sm` | All card surfaces |
| Font base | 14px | Body text |
| Dark mode | Tailwind `dark:` via `ThemeProvider` | System-aware |
| Framework | Next.js App Router, TypeScript strict | — |
| Components | shadcn/ui | All UI primitives |
| Icons | Lucide React | All icons |

---

## Known Issues (as of March 2026)

See `pm/DEV-STATUS.md` for full bug list. Critical ones:

1. **Dashboard stats wrong** — `home/page.tsx` only fetches 5 jumps but tries to calculate monthly/freefall stats from them. Need either a dedicated `/api/jumps/stats` endpoint or fetch all jumps.
2. **Reports totalJumps always 0** — `reports/page.tsx` uses `userData.totalJumps` which doesn't exist. Should be `userData.currentJumpNumber - 1`.
3. **Altitude labels hardcoded to ft** — `JumpForm.tsx` lines 359, 372 — should use `unitPreference` like `distanceToTarget` does.

---

## Time + Distance Utilities

- `src/lib/utils/timeFormat.ts` — `secondsToHHMMSS()`, `parseHHMMSSToSeconds()`, `isValidHHMMSS()`, `secondsToReadable()`
- `src/lib/utils/distanceFormat.ts` — distance formatting
- `src/lib/utils/currencyFormat.ts` — currency formatting
- `src/lib/utils/shareableUrl.ts` — invoice share URL generation

---

## Validation Schemas

All in `src/lib/validations/`. Zod schemas mirror Prisma models. Used in both API routes (server-side) and forms (client-side inference).

---

## Prisma Commands

```bash
# After schema changes:
npx prisma generate        # Update Prisma client types
npx prisma db push         # Push schema to database (development)

# Check current schema is in sync:
npx prisma db pull         # Pull schema from DB (only if needed)
```

---

## Adding a New Feature — Checklist

1. Write spec in `pm/feature-specs/`
2. Prisma schema change (if needed) → `npx prisma generate && npx prisma db push`
3. Add/update Zod validation schema in `src/lib/validations/`
4. Add API route(s) in `src/app/api/`
5. Add/update component(s) in `src/components/`
6. Add page(s) in `src/app/(dashboard)/`
7. Run `npx tsc --noEmit` — zero errors required
8. Update this file + `pm/DEV-STATUS.md`

---

---

## Global Seed Data (F1 — implemented March 2026)

### Architecture Decision
Three shared global tables (`GlobalDropzone`, `GlobalAircraft`, `GlobalJumpType`) — not per-user. All existing FK constraints on `Jump` remain unchanged (still reference user-owned `Dropzone`, `UserAircraft`, `UserJumpType`).

### How It Works
- **GlobalDropzone**: 358 DZs seeded from `data/Dropzone list.csv` via `npm run db:seed` then `tsx src/scripts/import-global-dropzones.ts`. When a user selects a GlobalDropzone, the combobox auto-creates a personal `Dropzone` copy via `POST /api/dropzones` and stores the personal DZ's ID.
- **GlobalAircraft / GlobalJumpType**: Seeded in `prisma/seed.ts`. When a user selects a global aircraft/jump type not yet in their personal list, JumpForm auto-calls `POST /api/user-aircrafts` or `POST /api/user-jump-types` to add it. The new personal record's ID is used in the form.
- **Deduplication**: The combobox checks the user's existing personal DZs by name before creating a new copy. JumpForm filters global lists to exclude items already in the user's personal list (by name, case-insensitive).

### Key Files
- `prisma/schema.prisma` — GlobalDropzone, GlobalAircraft, GlobalJumpType models
- `prisma/seed.ts` — seeds GlobalAircraft + GlobalJumpType; also keeps existing per-user seeding
- `src/scripts/import-global-dropzones.ts` — CSV importer for GlobalDropzone table
- `src/app/api/global-dropzones/route.ts` — public GET with search + pagination
- `src/app/api/global-aircrafts/route.ts` — authenticated GET
- `src/app/api/global-jump-types/route.ts` — authenticated GET
- `src/components/ui/dropzone-combobox.tsx` — grouped personal + global DZ search
- `src/components/forms/JumpForm.tsx` — grouped aircraft + jump type selects

### To activate after deploying .env
```bash
./node_modules/.bin/prisma db push          # create the 3 new tables
npm run db:seed                              # seed GlobalAircraft + GlobalJumpType
tsx src/scripts/import-global-dropzones.ts  # import 358 DZs from CSV
```

### To activate after deploying .env (F2 — already run against dev DB)
```bash
./node_modules/.bin/prisma db push          # adds hasCompletedOnboarding + isWorkingSkydiver to User
npm run db:seed                              # backfills hasCompletedOnboarding=true for existing users
```

---

## Onboarding Wizard (F2 — implemented March 2026)

### Architecture Decision
Onboarding check is implemented in **`src/app/(dashboard)/layout.tsx`** (async server component), NOT in `middleware.ts`. Reason: middleware runs in Edge Runtime which cannot import Prisma (Node.js APIs). The dashboard layout reads `user.hasCompletedOnboarding` via Prisma and calls `redirect('/onboarding')` if false.

The onboarding page lives at **`src/app/onboarding/`** (outside the `(dashboard)` route group) to:
1. Avoid showing Header/BottomNav during onboarding
2. Prevent an infinite redirect loop (layout → /onboarding → layout → ...)

`/onboarding` is added to `middleware.ts` protectedRoutes so unauthenticated users are redirected to login.

### Backfill Pattern
When adding `hasCompletedOnboarding`, existing users were backfilled to `true` BEFORE the redirect logic was deployed. This backfill is also in `prisma/seed.ts`.

### Wizard Flow
- **5 blocks** for working skydivers, **4 blocks** for fun jumpers
- State machine: profile → dropzone → jump-history → jumper-type → (invoice-setup if working) → done
- Shared state (`WizardState`) passed down via `onNext` callbacks; no context/zustand needed
- **DoneBlock** fires `PATCH /api/user { hasCompletedOnboarding: true, isWorkingSkydiver? }` and calls `router.refresh()` after navigation to bust the dashboard layout cache

### Key Files
- `src/app/onboarding/page.tsx` — onboarding page (no Header/BottomNav)
- `src/components/onboarding/OnboardingWizard.tsx` — wizard state machine + progress bar
- `src/components/onboarding/blocks/ProfileBlock.tsx` — Block 1: license number + unit preference
- `src/components/onboarding/blocks/DropzoneBlock.tsx` — Block 2: home DZ + default altitudes
- `src/components/onboarding/blocks/JumpHistoryBlock.tsx` — Block 3: last jump number + import callout
- `src/components/onboarding/blocks/JumperTypeBlock.tsx` — Block 4: fun jumper vs working skydiver
- `src/components/onboarding/blocks/InvoiceSetupBlock.tsx` — Block 5b: currency + rates (working only)
- `src/components/onboarding/blocks/DoneBlock.tsx` — Done: completes onboarding, navigation CTAs
- `src/app/(dashboard)/layout.tsx` — async layout that checks hasCompletedOnboarding and redirects
- `src/lib/validations/user.ts` — `UserProfileUpdateSchema` includes `hasCompletedOnboarding`, `isWorkingSkydiver`

*Last updated: March 2026 — F2 Onboarding Wizard implemented*
