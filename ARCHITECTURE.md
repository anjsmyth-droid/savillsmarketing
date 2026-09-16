# Architecture

## Overview

Marketing Hub is a modular monolith: a single Next.js App Router application
where server components read the database directly and server actions
perform every mutation. There is no separate REST/GraphQL API layer — this
keeps the MVP simple to run and reason about, while every integration point
that would need to change in production (auth, storage, AI, notifications)
is isolated behind a small TypeScript interface.

```
Browser
  │
  ▼
Next.js App Router (server components + server actions)
  │            │            │              │
  ▼            ▼            ▼              ▼
AuthProvider StorageProvider AIProvider  NotificationProvider
  │            │            │              │
  ▼            ▼            ▼              ▼
dev cookie   local disk   mock templater  in-app DB rows
(→ Entra ID) (→ Blob/SP)  (→ real LLM)    (→ + Teams/email)
  │
  ▼
Prisma ORM → SQLite (→ PostgreSQL)
```

## Why a modular monolith, not microservices

The spec calls for a credible, demoable MVP that a small team can run
locally with no infrastructure. A single Next.js app with clear internal
module boundaries (`src/lib/<domain>`) gets the same separation of concerns
as services would, without the operational overhead — and the boundary
lines (auth/storage/AI/notifications as interfaces) are exactly where a
production split, if ever needed, would happen.

## Database

**Prisma ORM** targeting **SQLite** locally (`prisma/schema.prisma`,
`prisma/dev.db`). Every field and relation was designed against PostgreSQL
semantics from the start (no SQLite-only tricks), so production migration is
a one-line datasource change plus `prisma migrate deploy` against a real
Postgres instance — see `PRODUCTION_MIGRATION.md`.

Key modelling decisions:

- **`Request` is the spine of the app.** Every workflow type (Property PR,
  op-ed, social, brochure, pitch, ...) is a `Request` row with a
  `requestTypeKey` and a `formData` JSON blob whose shape is defined by that
  type's workflow definition (see below), rather than one table per request
  type. This is what makes adding a new request type a data change, not a
  schema migration.
- **`BrochureProject`/`PitchProject`** are 1:1 extensions of `Request` for
  the two features that need structured, multi-stage state (supplied facts,
  section versions, tender analysis) beyond a flat form.
- **`File` vs. `Asset`**: every upload is a `File`. An `Asset` is a `File`
  that has been promoted into the searchable Marketing Library, with
  metadata (category, property, tags, confidentiality). Promotion happens
  automatically (`src/lib/library/asset-capture.ts`) the moment a file is
  uploaded to a request — the Library builds itself from everyday use
  rather than requiring separate DAM entry (spec §21).
- **`RequestStatusHistory`, `Comment`, `Approval`, `AuditEvent`** together
  form the activity/audit trail. Status changes, comments and approvals are
  written as their own rows (not just a mutated field) so the full history
  renders on the request's Activity tab and is available to Marketing Admin
  under audit.
- **Confidentiality is a first-class column** (`Request.confidential`,
  `Asset.confidentiality`), enforced at the query layer everywhere data is
  listed or searched (`src/lib/requests/visibility.ts`,
  `src/lib/library/queries.ts`) — never filtered client-side.

## The workflow engine

Rather than hard-coding a form per request type, `src/lib/workflows/`
defines a small declarative schema:

```ts
WorkflowDefinition { typeKey, steps: WorkflowStep[], requiredFields, summaryFields }
WorkflowStep       { key, title, fields: WorkflowField[] }
WorkflowField      { key, label, type, required?, options?, showIf?: FieldCondition }
```

`FieldCondition` is a plain data object (`{ field, equals? | in? | truthy? }`),
never a function — this is what lets the same definition be resolved
server-side (to fill in DB-backed options like media outlets or service
lines, `src/lib/workflows/resolve.ts`) and then serialized as props into the
client-side `<WorkflowForm>` component, which evaluates conditions purely
(`src/lib/workflows/visibility.ts`, unit-tested) to show/hide fields as the
user answers earlier questions. Ten of the twelve request types on the Home
screen run through this one engine (`src/lib/workflows/definitions.ts`);
Brochure and Pitch have their own dedicated multi-stage Studios because
their state (facts/sections, analysis/structure/draft) doesn't fit a linear
form.

Adding a new request type or changing an existing one's questions is a
change to `definitions.ts` — no new routes, components, or migrations
required. Marketing Admin's Settings screen can toggle a type active/inactive
today; a future iteration could move step/field editing into that same
screen without changing how the engine or the rendered form works.

## Authentication abstraction

`src/lib/auth/types.ts` defines `AuthProvider` with one method,
`getCurrentUser()`, resolving to a `SessionUser`. The MVP's `DevAuthProvider`
reads a plain cookie set by the dev role switcher; nothing else in the app
talks to cookies or session internals directly — every page and action calls
`getCurrentUser()` / `requireUser()` / `requireMarketing()` /
`requireMarketingAdmin()` from `src/lib/auth/index.ts`. Swapping in Entra ID
means writing an `EntraIdAuthProvider` implementing the same interface and
switching on `AUTH_PROVIDER` — see `PRODUCTION_MIGRATION.md`.

## Storage abstraction

`src/lib/storage/types.ts` defines `StorageProvider` with `put`/`read`/`remove`.
`LocalStorageProvider` writes to `data/uploads/` with randomised filenames.
Files are **never** served as static assets: the only read path is
`src/app/api/files/[fileId]/route.ts`, which loads the `File`'s owning
`Request`, checks confidentiality and participant membership, and only then
calls `storage.read()` and streams the bytes. A production
`AzureBlobProvider` or SharePoint-backed provider implements the same three
methods; the permission check in the route doesn't change.

## AI abstraction

`src/lib/ai/types.ts` defines `AIProvider.generate(request)` returning
`{ data, disclaimer, generatedByAI: true }`. The default `MockAIProvider`
(`src/lib/ai/mock-provider.ts`) is deterministic and template-driven: every
string it produces is built only from fields present in the context it's
given, with explicit `[not supplied]`-style placeholders for gaps — it
never fabricates a fact. This is what makes "AI must never silently invent
factual information" (spec §14, §37) true by construction rather than by
prompt engineering, and it's unit-tested
(`src/lib/ai/mock-provider.test.ts`). Every AI-touching feature (brief
summaries, brief gap-checking, PR angle suggestions, op-ed analysis, social/
email copy, brochure sections, tender analysis, pitch drafting, asset tag
suggestions) calls `ai.generate()` through this one interface. A real
provider (Anthropic, Azure OpenAI, Bedrock, ...) is a second implementation
of the same interface selected via `AI_PROVIDER`; no caller changes.

## Notification abstraction

`src/lib/notifications/types.ts` defines `NotificationProvider.notify()`.
`InAppNotificationProvider` writes a `Notification` row, rendered by the
header's notification bell. `TeamsNotificationProvider` and
`EmailNotificationProvider` exist as unwired stubs
(`src/lib/notifications/providers.ts`) to demonstrate that adding a delivery
channel is additive — registering one alongside the in-app provider in
`src/lib/notifications/index.ts` makes every existing `notify()` call fan out
to it, with no changes at the call sites.

## Security model

- **Role-based access control**: `RoleName` is `STANDARD | DIVISIONAL |
  MARKETING | MARKETING_ADMIN` (spec §27). Server actions call
  `requireUser()`, `requireMarketing()`, or `requireMarketingAdmin()` as a
  guard *before* any mutation — role checks live in the action, not just in
  which UI buttons render, so a crafted request can't bypass them. Admin
  routes additionally redirect at the layout/page level
  (`src/app/(dashboard)/admin/layout.tsx`,
  `.../admin/settings/page.tsx`, `.../admin/users/page.tsx`).
- **Confidential requests**: `Request.confidential` and
  `Asset.confidentiality` are checked in every list/search query
  (`visibleRequestsWhere()`, `searchAssets()`) so confidential items simply
  never appear in another user's results — not hidden by CSS. Marketing
  sees confidential items because they administer them; a Standard/
  Divisional user sees one only if they are the requestor or a participant.
- **File access**: see Storage abstraction above — permission checked
  server-side on every byte served, not just on the listing page.
- **Audit trail**: `AuditEvent` rows are written for request creation,
  submission, assignment, status/priority changes, completion, file
  upload/delete, content generation, approval requests/decisions, and
  permission changes (`src/lib/audit.ts`), viewable by Marketing Admin.
- **No secrets in client code**: `AI_PROVIDER`/`ANTHROPIC_API_KEY`,
  `STORAGE_PROVIDER`, `AUTH_PROVIDER` are read only in server-side modules
  (`src/lib/*/index.ts`); nothing under `"use client"` imports them.

## MVP vs. future functionality

| Capability | This MVP | Production |
|---|---|---|
| Request management, workflows, Kanban, Library, Calendar, approvals, audit | **Real** | Same code |
| In-app notifications | **Real** | Same code, plus... |
| Notification delivery channels | Stubbed (console.log) | Teams/email providers |
| Authentication | Dev cookie + role switcher | Entra ID / Savills SSO |
| Database | SQLite file | Managed PostgreSQL |
| File storage | Local disk | Azure Blob Storage or SharePoint |
| AI | Deterministic mock provider | Enterprise-approved LLM provider |
| Brand knowledge retrieval | Flat KnowledgeDocument table, browsed manually | Retrieval-augmented generation over approved documents |
| "Ask the Library" conversational search | UI shell only, explicitly not implemented per spec §26/§37 | Real semantic search + LLM answer synthesis |
| Branded PDF/document export | Architected (`generatePdf` seam noted in Brochure Studio), not built | Real template-driven document generation |

This table is the same content as the "Real / Simulated / Future" framing in
the original spec (§37), kept close to the code it describes.
