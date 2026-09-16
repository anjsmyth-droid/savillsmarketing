# Marketing Hub — Savills Intel MVP

Marketing Hub is the single place Savills Ireland employees go for anything
involving Marketing: **Request → Create → Track → Find**. This repository is a
working local MVP: intelligent multi-step request workflows, a Marketing
Control Centre with a Kanban board, a self-building Marketing Library, a
Brochure Studio and Pitch Studio, native reporting, and AI woven quietly
throughout — all running against dummy data with no external services
required.

See also: [`ARCHITECTURE.md`](./ARCHITECTURE.md) for how it's built,
[`PRODUCTION_MIGRATION.md`](./PRODUCTION_MIGRATION.md) for how it would move
to Savills-approved infrastructure, and [`PRODUCT_SPEC.md`](./PRODUCT_SPEC.md)
for the full feature/workflow/role reference.

## Technology stack

- **Next.js 16 (App Router)** + **TypeScript**, server components and server
  actions throughout — no separate API layer.
- **Tailwind CSS v4** with a small hand-built design system (`src/components/ui`)
  rather than a third-party component kit.
- **Prisma ORM + SQLite** for local development. The schema is written to move
  to PostgreSQL with a one-line datasource change (see ARCHITECTURE.md).
- **Recharts** for the native reporting dashboard.
- **Zod** is available for schema validation; form shape is currently
  enforced by the workflow engine's field definitions.
- **Vitest** for unit tests.

## Local installation

```bash
npm install
cp .env.example .env      # already has sensible local defaults
npm run db:migrate        # creates prisma/dev.db and applies the schema
npm run db:seed           # populates ~13 users, 28 requests, properties, etc.
npm run dev                # http://localhost:3000
```

The root route redirects to `/home`. There is no login screen — the **dev role
switcher** in the header (labelled "Dev: view as", clearly marked as
development-only) lets you instantly switch between the seeded users to see
the app from a Standard User, Divisional Director, Marketing, or Marketing
Admin's perspective. Remove `src/lib/auth/dev-provider.ts`, `actions.ts`, and
`components/layout/dev-user-switcher.tsx` before any production deployment —
see `PRODUCTION_MIGRATION.md`.

## Database

SQLite via Prisma, file at `prisma/dev.db` (git-ignored). Schema lives at
`prisma/schema.prisma`; seed data at `prisma/seed.ts`.

```bash
npm run db:migrate   # create/apply a new migration after editing schema.prisma
npm run db:seed      # re-populate dummy data (safe to re-run after a reset)
npm run db:reset      # ⚠️ drops and recreates the local dev database, then seeds it
npm run db:studio    # Prisma Studio — browse/edit data visually
```

To start completely fresh: delete `prisma/dev.db` and `data/uploads/*`, then
run `db:migrate` and `db:seed` again.

## File storage

Uploaded files are written to `data/uploads/` on local disk (git-ignored) and
served only through the authenticated route `src/app/api/files/[fileId]/route.ts`,
which checks the owning request's confidentiality and participants before
streaming any bytes. Never exposed as static assets.

## AI configuration

AI features default to a **mock provider** (`AI_PROVIDER=mock` in `.env`) that
needs no API key and never makes a network call. It builds every response
only from facts present in the request/context it's given, explicitly
flagging anything missing (e.g. `[asking price not supplied — confirm before
use]`) rather than inventing content. This keeps the MVP demoable offline and
makes the "never invent facts" requirement verifiable by reading
`src/lib/ai/mock-provider.ts`.

To wire in a real provider, implement the `AIProvider` interface
(`src/lib/ai/types.ts`) and register it in `src/lib/ai/index.ts` behind a new
`AI_PROVIDER` value — no calling code changes.

## Testing

```bash
npm run test    # vitest — workflow logic, status helpers, mock AI provider
npm run lint    # eslint
npx tsc --noEmit  # typecheck
npm run build   # production build (also type-checks and lints)
```

## Project structure

```
prisma/                   schema.prisma, migrations, seed.ts
data/uploads/              local file storage (MVP only, git-ignored)
src/app/(dashboard)/       every authenticated route (home, requests, create,
                            calendar, library, admin, brochure-studio, pitch-studio)
src/app/api/files/[id]/    authenticated file streaming route
src/components/ui/         design system primitives (Button, Card, Tabs, ...)
src/components/            feature components, grouped by area
src/lib/auth/               AuthProvider interface + dev implementation
src/lib/storage/            StorageProvider interface + local implementation
src/lib/ai/                 AIProvider interface + mock implementation
src/lib/notifications/      NotificationProvider interface + in-app implementation
src/lib/workflows/          the request workflow engine and type definitions
src/lib/{requests,library,brochure,pitch,calendar,reporting,admin}/
                            domain server actions and queries
```

## What's real vs. simulated in this MVP

See `ARCHITECTURE.md` §"MVP vs. future functionality" for the full breakdown.
In short: request management, workflows, Kanban, Library, Calendar,
approvals, notifications (in-app), Brochure/Pitch Studio, and reporting are
fully implemented. Authentication, AI, file storage and notification
*delivery channels* are implemented against local/mock providers behind
interfaces designed for swapping in Entra ID, a real LLM provider, Azure
Blob/SharePoint, and Teams/email respectively.
