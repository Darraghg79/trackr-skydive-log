# TrackR Skydive Log — Technical Memory

> **Read this file at the start of every Claude Code session.**
> This is the canonical source of architectural decisions, schema facts, and design system values.
> Also read `pm/DEV-STATUS.md` for current bugs and feature status.

---

## Project Overview

A mobile-first web app for skydivers to log jumps, manage gear, and invoice work jumps.
Single-user model — each user owns all their data (no org/multi-tenancy).

**Live:** login.trackr-app.online (landing: www.trackr-app.online)
**Repo:** https://github.com/Darraghg79/trackr-skydive-log (main branch, Vercel auto-deploys)
**Asana:** https://app.asana.com/1/1211819601364144/project/1214142822018188

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
- `src/lib/supabase/client.ts` — browser client using `createBrowserClient` from `@supabase/ssr` (for client components). **Must use `@supabase/ssr` not `@supabase/supabase-js` directly** — the SSR browser client stores the session in cookies, which the middleware can read. The plain JS client stores in localStorage only, which the middleware cannot see, breaking all post-login redirects.
- `src/lib/supabase/server.ts` — server client using `createServerClient` from `@supabase/ssr` (for API routes and server components). The `set`/`remove` cookie callbacks are wrapped in try-catch — Next.js Server Components cannot set cookies (only Route Handlers and Server Actions can). The middleware handles all token refresh and cookie writing; Server Components only need to read.

### New User Bootstrap
When a new user first hits any dashboard route, `(dashboard)/layout.tsx` calls `prisma.user.findUnique` — if `null`, it creates the record via `prisma.user.create` then redirects to `/onboarding`. This ensures the Prisma row exists before any onboarding block calls `PATCH /api/user`.

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

See `pm/DEV-STATUS.md` for full bug list. Outstanding ones:

1. **Dashboard "This Month" count** — still calculated from the last 5 jumps only. Correct fix is a server-side count added to `GET /api/user` response.
2. **Dashboard freefall time** — only reflects `startingFreefallTime`, does not sum actual logged jumps. Same fix: add `totalFreefallSeconds` aggregate to `GET /api/user`.
3. **Invoice with no rates (B8)** — working skydivers can create £0 invoices if DZ has no rates set. Needs an inline blocker in `InvoiceForm.tsx`.

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

## Invoice Pre-flight Decisions

**Implemented: 2026-04-21 (F-INVOICE-PREFLIGHT)**

When the user clicks "Create Invoice" on `invoices/dropzone/[id]/page.tsx`, a client-side pre-flight check runs before any API call. If any required fields are missing (user name/address, DZ contact/email/address/currency, or rates for the specific jump types being invoiced), a modal (`InvoicePreflightModal.tsx`) collects them all in one form.

Key decisions:
- **Rate check is targeted** — only requires rates for `workJumpType` values present in the actual jumps being invoiced (not all 4 rate types). Handcam rate only required if `canInvoiceHandcam` is true on any jump.
- **The old `hasRatesConfigured` warning banner is removed** — the preflight modal handles this case more precisely.
- **No new API routes** — uses existing `PATCH /api/user` and `PATCH /api/dropzones/[id]`.
- **`invoiceStartingNumber` fetched from `/api/user`** directly in the page (replaces previous `/api/auth/me` call).
- **`WORK_TYPE_RATE_KEY` map** used in both the API route and the page for rate lookups (avoids string transform bugs like `rateAff` vs `rateAFF`).
- The `Dropzone` interface in the page now includes `contactName`, `contactEmail`, `address` so preflight can check them.

Key files:
- `src/components/invoices/InvoicePreflightModal.tsx` — new modal component
- `src/app/(dashboard)/invoices/dropzone/[id]/page.tsx` — pre-flight check + modal state

---

## Settings Cleanup Decisions

**Implemented: 2026-04-21 (F-SETTINGS-CLEANUP)**

Both the header and bottom nav settings icons now navigate directly to `/settings` (the tile page) instead of opening a dropdown. The tile page is the canonical entry point for all settings sub-pages.

Key decisions:
- **No dropdown menus** — `DropdownMenu` and all associated icon imports removed from both `Header.tsx` and `BottomNav.tsx`. All dropdown-only icons (`User`, `Lock`, `Bell`, `CreditCard`, `MapPin`, `Package`, `ListChecks`, `Upload`, `Download`, `SettingsIcon`, `Plus`) removed.
- **BottomNav Settings is now a plain Link** — same rendering path as Jumps/Invoices/Reports nav items. The `isSettings: true` flag and the entire conditional render block are gone.
- **Jump Statistics removed from Profile page** — `currentJumpNumber`, `startingFreefallTime`, `startingCutaways` fields, `auditLogs`/`auditLoading` state, `fetchAuditLogs` function, and `format` import from date-fns all removed. The dedicated `/settings/jump-stats` page is the canonical location for these fields.
- **Profile page Save Changes still works** — remaining fields (name, phone, address, licenseNumber, unitPreference, taxRegistrationNumber, remittanceDetails, defaultDropzoneId, defaultExitAltitude, defaultDeploymentAltitude) unaffected.

Key files:
- `src/components/layouts/Header.tsx` — settings icon is now a `<Button asChild><Link href="/settings">` 
- `src/components/layouts/BottomNav.tsx` — Settings navItem has `href: "/settings"`, no `isSettings` flag
- `src/app/(dashboard)/settings/profile/page.tsx` — Jump Statistics Card removed

---

## Roadmap — Future Features

### F-IMPORT-BG: Background CSV Import (Priority: High)
**Problem:** The current import runs as sequential browser fetch calls. If the screen sleeps or the browser tab loses focus mid-import, JavaScript pauses and the import fails. With 1,400+ jumps this requires multiple retry attempts, which is a poor first-run experience for new users.

**Proposed Architecture:**
1. User uploads CSV → stored immediately in Supabase Storage (one fast call)
2. API returns `{ importId }` — browser is done, no polling required during processing
3. A background job (Vercel Cron or Supabase Edge Function triggered on storage upload) picks up the file and processes it at the server level
4. Job writes status to a new `ImportJob` table: `pending → processing → complete | failed`
5. Import results page polls `GET /api/imports/[id]` every 3s and shows live progress
6. On completion, the CSV is deleted from storage and the user is notified

**New pieces needed:**
- `ImportJob` Prisma model (`id`, `userId`, `status`, `filename`, `totalRows`, `importedCount`, `skippedCount`, `errors`, `createdAt`, `completedAt`)
- `POST /api/imports` — accepts file, saves to Supabase Storage, creates ImportJob record, returns immediately
- `GET /api/imports/[id]` — returns job status + progress
- `POST /api/imports/[id]/process` — the actual processing logic (called by the background job)
- Vercel Cron job or Supabase Edge Function webhook to trigger processing
- Updated `settings/import/page.tsx` — upload step fires once, then shows polling progress UI

**Note:** This is a Claude Code task (new routes, new DB model, Supabase Storage integration, background job config).

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

## Global Seed Data (F1 — implemented March 2026, seeded ✅)

### Architecture Decision
Three shared global tables (`GlobalDropzone`, `GlobalAircraft`, `GlobalJumpType`) act as the product-level seed list. They are populated once by the admin and are the same for all users. The FK constraints on `Jump` still reference user-owned tables (`Dropzone`, `UserAircraft`, `UserJumpType`) — users never interact with global tables directly.

**These global tables have been seeded and are live in the database.**

### How It Works
When a brand new user account is created (first hit of any `/(dashboard)` route), `src/app/(dashboard)/layout.tsx` copies all active global records into the user's personal tables:
- `GlobalDropzone` → `Dropzone` (user's own copy, editable)
- `GlobalAircraft` → `UserAircraft` (user's own copy, editable)
- `GlobalJumpType` → `UserJumpType` (user's own copy, editable)

This copy runs once per user at signup and is silent (non-fatal on failure). After this point, each user owns their list independently — they can add, edit, or delete without affecting other users or the global tables.

**If you update the global tables in future, only new signups will see the changes.** Existing users are unaffected.

### Key Files
- `prisma/schema.prisma` — GlobalDropzone, GlobalAircraft, GlobalJumpType models
- `prisma/seed.ts` — seeds GlobalAircraft + GlobalJumpType
- `src/scripts/import-global-dropzones.ts` — CSV importer for GlobalDropzone (358 DZs from `data/Dropzone list.csv`)
- `src/app/(dashboard)/layout.tsx` — copies global records to personal on first user login
- `src/components/ui/dropzone-combobox.tsx` — personal-only DZ search (no global fetch)
- `src/components/forms/JumpForm.tsx` — personal-only aircraft + jump type selects

### To update the global lists in future
```bash
# Edit the seed data or CSV, then re-run:
npm run db:seed                              # re-seeds GlobalAircraft + GlobalJumpType
tsx src/scripts/import-global-dropzones.ts  # re-imports DZs from CSV (use with care — adds new, does not remove)
# Note: existing users are unaffected. Only new signups will see the updated list.
```

### DB setup notes (already done for dev)
```bash
./node_modules/.bin/prisma db push          # schema push (run against any new environment)
npm run db:seed                              # seeds globals + backfills hasCompletedOnboarding=true
tsx src/scripts/import-global-dropzones.ts  # imports 358 DZs
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

---

## RLS Hardening Decisions

**Implemented: 2026-04-29 (F-RLS-HARDENING)**

Row Level Security is now enabled on all 17 tables in the `public` schema as defence-in-depth.

### Key facts

- **Prisma postgres role bypasses RLS** — all existing app behaviour is completely unchanged. Prisma connects as `postgres`, which is a superuser that always bypasses RLS. The policies are a backstop for any future bug, any future direct Supabase JS client usage, or any unanticipated query path.
- **The 17 original ERROR-level security advisor warnings are gone.** Only two items remain: an INFO on `_prisma_migrations` (intentional — no policies means anon/authenticated are denied, which is correct) and a WARN for leaked-password protection (manual Supabase dashboard toggle — see below).
- **Migration name:** `20260429111229_enable_rls`

### Policy patterns used

| Table type | Pattern |
|-----------|---------|
| User-scoped (`userId` column) | `(SELECT auth.uid())::text = "userId"` |
| `users` table (`id` is the user key) | `(SELECT auth.uid())::text = id` |
| Child tables (no `userId`, owned via parent) | `EXISTS (SELECT 1 FROM parent WHERE parent.id = child."parentId" AND parent."userId" = (SELECT auth.uid())::text)` |
| Global reference data | `FOR SELECT TO authenticated USING (true)` — no INSERT/UPDATE/DELETE |
| `_prisma_migrations` | RLS enabled, intentionally no policies — postgres bypasses; anon/authenticated denied |

The `(SELECT auth.uid())` wrapping (not bare `auth.uid()`) is deliberate — Supabase recommends it so the planner caches the result via initPlan optimisation, avoiding a round-trip per row on large tables like `jumps` (1,487 rows) and `jump_gear_components` (1,970 rows).

### To future developers: if you add a new table

You **must** also enable RLS and add an appropriate policy. Otherwise the Supabase security advisor will flag it as an ERROR. Use the patterns above. The migration to reference is `20260429111229_enable_rls`.

### Manual step still outstanding

Enable HaveIBeenPwned leaked-password protection in the Supabase dashboard:
- Authentication → Policies → Password security → toggle **"Check passwords against HaveIBeenPwned"** ON
- Direct link: https://supabase.com/dashboard/project/agcemldzcdnmhamfybse/auth/policies

---

## Day Review / Quick Edit Decisions

**Implemented: 2026-04-29 (F-DAY-REVIEW-FLOW)**

Two-part feature: handcam visibility on the /jumps list, and a Quick Edit screen for end-of-day logbook upkeep.

### Routing choice — separate route

Quick Edit is implemented as **`src/app/(dashboard)/jumps/quick-edit/page.tsx`**, not as a mode toggled inside `/jumps`. Reason: Quick Edit has its own full-screen UX (back-button header, filter chips, sticky save bar), making it a distinct screen rather than a view mode. This is consistent with the existing `/jumps/new` and `/jumps/[id]` routing pattern.

### API choice — bulk endpoint

Save fires a single **`PATCH /api/jumps/bulk`** request with all dirty changes in one payload. This is consistent with the existing `/api/jumps/bulk-sign` precedent, returns per-jump success/failure for clean partial-failure reporting, and avoids N parallel round-trips for a typical 3–8 jump day.

### Handcam indicator design

A `Video` icon + "Handcam" text inside a `Badge variant="outline"` sits inline with the other badges (Signed, work jump type, Cutaway) on the jump card. Only rendered when `workJumpType === 'TANDEM' && hasHandcam === true`. This was chosen over a pill colour because it's consistent with the existing badge idiom in the card.

### Search moved to global header

The Search icon for the jumps list moved from the action row to **`Header.tsx`**. It appears only when `pathname === '/jumps'` (not on subroutes like `/jumps/new` or `/jumps/quick-edit`). Communication between the header icon and the page is via URL param `?showSearch=1`:
- Header click → `router.replace('/jumps?showSearch=1')` (reads `window.location.search` in the click handler — no render-time `useSearchParams()` in the header)
- Page syncs via a tiny `SearchParamSyncer` child component (uses `useSearchParams()`) wrapped in `<Suspense fallback={null}>` to satisfy Next.js App Router's requirement

### Jump type dropdown

Quick Edit's jump type dropdown is sourced from the user's personal `UserJumpType` table (same as JumpForm), NOT from the `WorkJumpType` enum. Changing jump type updates `jumpTypeId` only; `workJumpType` (AFF/TANDEM/etc.) is unchanged by Quick Edit.

### Handcam toggle scope

The handcam toggle in Quick Edit is shown **only when `workJumpType === 'TANDEM'`**. AFF, COACH, and CAMERA work jumps do not show the toggle. Fun jumps (non-work) also do not show it.

### Dirty-state guard

- **Browser close/refresh**: `beforeunload` handler blocks
- **Cancel button**: checks `isDirty` and shows `AlertDialog` confirmation
- **Browser in-app back button (SPA)**: handled via `history.pushState` sentinel + `popstate` listener. When the user is on the Quick Edit page with unsaved changes, a dummy history entry is pushed on each `isDirty` state change. If `popstate` fires, we re-push and show the discard dialog. Note: this pattern is a Next.js App Router workaround (there is no native `router.beforePopState` in App Router).

### Partial save failure

On partial save failure the user stays in Quick Edit, failed rows are highlighted with a red border and an "AlertCircle" message, and successfully saved rows are cleared from pending state. The user can retry individual rows or discard.

Key files:
- `src/app/api/jumps/bulk/route.ts` — new bulk PATCH endpoint
- `src/app/(dashboard)/jumps/quick-edit/page.tsx` — Quick Edit page
- `src/components/jumps/QuickEditRow.tsx` — editable row with name/jump-type/handcam controls
- `src/components/jumps/QuickEditNameModal.tsx` — customer name edit modal
- `src/components/layouts/Header.tsx` — search icon added (pathname-conditional)
- `src/app/(dashboard)/jumps/page.tsx` — handcam badge + Quick Edit icon + URL-param search

---

## Ad-hoc Invoice Lines Decisions

**Implemented: 2026-07-27 (F-INVOICE-ADHOC-LINE)**

Lets the user add free-text charge lines (talk-downs, kit hire, discounts, etc.) to an invoice that aren't tied to a jump.

### Key constraint this design solves

OPEN invoices store zero line items — `GET /api/invoices/[id]` regenerates `BASE_JUMP`/`HANDCAM_ADDON` rows from uninvoiced jumps on every request, and sending (OPEN→SENT) wipes and rebuilds all `InvoiceLineItem` rows for the invoice. Ad-hoc lines are real, persisted `InvoiceLineItem` rows from the moment they're created (even while OPEN) — they are never part of the dynamic regeneration — and the GET/send logic was changed to only touch jump-derived rows.

### Schema

- `InvoiceLineItemType` gained `ADHOC`.
- `InvoiceLineItem.jumpId` and `workJumpType` are now nullable (`String?`, `WorkJumpType?`), and the `jump` relation is `Jump?`. Ad-hoc lines have `jumpId: null`.
- New `description String? @db.Text` — the free-text label, only populated for `ADHOC` lines.
- Migration: `20260727215811_add_adhoc_invoice_lines` (`ALTER COLUMN ... DROP NOT NULL` + `ADD COLUMN`, non-destructive, no backfill needed).
- `unitPrice`/`lineTotal` allow negative values for ADHOC (discounts/credits) — the existing jump-line Zod schema (`min(0)`) is untouched; only the new `AdhocLineItemSchema` allows negatives.

### API

- `POST /api/invoices/[id]/line-items` — creates an `ADHOC` row. 409 if invoice is not OPEN.
- `PATCH` / `DELETE /api/invoices/[id]/line-items/[lineItemId]` — edit/remove an ad-hoc line. Both require the invoice to be OPEN and the target row's `itemType === 'ADHOC'` (jump-derived rows are never editable through this route).
- `GET /api/invoices/[id]` (OPEN branch) — after building the dynamic jump-derived lines, persisted `ADHOC` rows for the invoice are loaded separately and appended (`jump: null`), then included in the subtotal/tax/total math.
- `PATCH /api/invoices/[id]` (OPEN→SENT branch) — the line-item wipe is now scoped: `deleteMany({ where: { invoiceId, itemType: { in: ['BASE_JUMP', 'HANDCAM_ADDON'] } } })`. The recalculated subtotal adds an aggregate sum of the surviving `ADHOC` rows. An invoice with only ad-hoc lines and zero jumps sends correctly (the jump-line array is just empty).

### UI

- `invoices/[id]/page.tsx` splits `invoice.lineItems` into jump-derived (`itemType !== 'ADHOC'`) and ad-hoc (`itemType === 'ADHOC'`) — rendered as two separate tables/cards ("Line Items" and "Additional Charges"). This sidesteps needing null-jump handling in the jump-derived table, since ad-hoc rows never appear there.
- `AddInvoiceLineForm.tsx` (new) — shared dialog for both add and edit, used inline in the Additional Charges card. Live line-total preview, negative unit prices allowed. Add/edit/delete controls only render while `status === 'OPEN'`; SENT/PAID renders the ad-hoc table read-only.
- `InvoicePDF.tsx` — the page-1 summary groups line items by a key that's per-row-unique for ADHOC (`adhoc-<id>`) so free-text lines never merge with each other or with jump totals; the display label is the line's `description`. Page 2 ("Jump Details") filters to `jump !== null` and is skipped entirely if there are no jump-derived lines (pure ad-hoc invoices).
- `currencyFormat.ts` `formatCurrency()` was fixed to place the minus sign before the currency symbol (`-€25.00` not `€-25.00`) — previously untested since the app had no negative amounts before ad-hoc discounts.
- The share page (`share/invoice/[token]/page.tsx`) needed no changes — it fetches `lineItems` (Prisma returns `jump: null` automatically for ad-hoc rows) and renders entirely through `InvoicePDF`, which already handles `jump === null`.

### Deferred (not in v1)

Reusable ad-hoc presets/catalogue, per-line taxable toggle, line reordering.

---

## PWA Auth Decisions

**Implemented: 2026-04-29 (F-PWA-PERSISTENT-LOGIN / B16)**

Fixes iOS PWA users being logged out on every cold-start reopen.

### Root causes fixed

1. **`start_url` was `/`** — every PWA cold-start hit the root page, which unconditionally redirected to `/login`. Now `public/manifest.json` has `"start_url": "/jumps"`, landing authenticated users directly on their logbook.

2. **`src/app/page.tsx` was a blindly-redirecting sync component** — replaced with an async Server Component that calls `supabase.auth.getUser()` and redirects to `/jumps` if authenticated, `/login` otherwise. This makes `/` safe to land on directly (bookmark, link, manifest fallback).

3. **`middleware.ts` `getUser()` had no network-failure fallback** — `getUser()` makes a live Supabase Auth network call. On iOS PWA cold-start, networking is often not ready yet (race between WiFi and the app launch), so the call returned null user, triggering a `/login` redirect. Wrapped in try/catch; the catch falls back to `supabase.auth.getSession()` (cookie-local, no network). This grants the user one request's grace period — the actual API calls on the destination page still verify the JWT.

4. **iOS splash screens were not wired** — 44 PNGs in `public/splash_screens/` now have matching `<link rel="apple-touch-startup-image">` tags in `src/app/layout.tsx` via `metadata.appleWebApp.startupImage`. Cover iPhone SE (4") through iPhone 17 Pro Max and all iPad sizes, portrait + landscape.

### Key files
- `public/manifest.json` — `start_url` changed to `/jumps`
- `src/app/page.tsx` — session-aware async server component
- `middleware.ts` — `getUser()` wrapped in try/catch with `getSession()` fallback
- `src/app/layout.tsx` — `appleWebApp.startupImage` array with 44 splash screen entries
