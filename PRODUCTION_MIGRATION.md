# Production Migration

This MVP was built so that each piece of local/mock infrastructure can be
replaced independently, without a rewrite of the front end or business
logic. No specific vendor is assumed to be approved — this document lists
the seam to implement against and the kind of service that would typically
fill it, not a decision.

## 1. Authentication → Microsoft Entra ID / Savills SSO

**Today**: `src/lib/auth/dev-provider.ts` resolves the session from a plain
cookie, switchable via the dev role switcher in the header.

**To migrate**:
1. Implement `AuthProvider` (`src/lib/auth/types.ts`) as `EntraIdAuthProvider`
   using MSAL / `next-auth`'s Azure AD provider (or the organisation's
   preferred OIDC library) to resolve a `SessionUser` from the real session.
2. Map Entra ID group membership (or an app role claim) to `RoleName`
   (`STANDARD | DIVISIONAL | MARKETING | MARKETING_ADMIN`) inside that
   provider — group→role mapping is the one piece of new logic.
3. Switch on `AUTH_PROVIDER=entra` in `src/lib/auth/index.ts`.
4. Delete `src/lib/auth/dev-provider.ts`, `src/lib/auth/actions.ts`, and
   `src/components/layout/dev-user-switcher.tsx` (also remove its import
   from `header.tsx`). These are the only three files with "dev" in scope.
5. Remove the `smh_dev_user_id` cookie references; nothing else in the app
   reads cookies directly.

No page, server action, or component outside those three files needs to
change — they all call `getCurrentUser()`/`requireUser()`/`requireMarketing()`
/`requireMarketingAdmin()`.

## 2. Database → managed PostgreSQL

**Today**: SQLite file at `prisma/dev.db`.

**To migrate**:
1. Provision a managed Postgres instance (Azure Database for PostgreSQL or
   the organisation's standard).
2. In `prisma/schema.prisma`, change `datasource db { provider = "sqlite" }`
   to `provider = "postgresql"`.
3. Review the handful of `String` fields currently used to store JSON
   (`Request.formData`, `BrochureProject.sections`, etc. — SQLite has no
   native JSON type) and switch them to Prisma's `Json` type, which
   Postgres supports natively. This is a mechanical change; the JS-side
   `JSON.parse`/`JSON.stringify` calls around them can then be removed.
4. Set `DATABASE_URL` to the Postgres connection string (ideally via a
   secrets manager — see §6) and run `prisma migrate deploy` against it.
5. Point the seed script at a *non-production* environment only — never run
   `db:seed` or `db:reset` against a database holding real Savills data.

## 3. File storage → Azure Blob Storage or SharePoint

**Today**: `LocalStorageProvider` writes to `data/uploads/` on local disk.

**To migrate**:
1. Implement `StorageProvider` (`src/lib/storage/types.ts`) as
   `AzureBlobProvider` (using `@azure/storage-blob`) or a SharePoint-backed
   provider (Microsoft Graph), storing the returned identifier as the
   `storageKey` — the shape of that key is opaque to every caller.
2. Switch on `STORAGE_PROVIDER=azure-blob` (or `sharepoint`) in
   `src/lib/storage/index.ts`.
3. `src/app/api/files/[fileId]/route.ts` keeps working unchanged: it already
   resolves permission first and only then calls `storage.read()` — for a
   blob provider this could be optimised to issue a short-lived signed URL
   instead of proxying bytes through the Next.js server, which is a
   reasonable follow-up once real file volumes are known.
4. Migrate existing local files (if any test/staging data must carry over)
   with a one-off script that reads each `File.storageKey` from disk and
   re-uploads it via the new provider, updating `storageKey` to match.

## 4. AI → an approved enterprise AI service

**Today**: `MockAIProvider` (`src/lib/ai/mock-provider.ts`) — deterministic,
local, never calls out to the network.

**To migrate**:
1. Implement `AIProvider` (`src/lib/ai/types.ts`) as e.g. `AnthropicProvider`
   or `AzureOpenAIProvider`, translating each `AITask` into an appropriate
   prompt built from the same `context` object the mock provider already
   receives.
2. Before enabling this in any environment with real client data, connect
   the prompt construction to the **Brand & Content Knowledge** documents
   (`KnowledgeDocument` table, managed at `/admin/knowledge`) as retrieval
   context, so generated copy follows approved tone/terminology/boilerplate
   rather than the model's defaults. A simple retrieval step (keyword or
   embedding match against `KnowledgeDocument.tags`/`body`) is sufficient to
   start; this is the seam noted in ARCHITECTURE.md for future RAG.
3. Keep the "never invent facts" behaviour: the real provider's prompts
   should instruct it to only use supplied facts and explicitly say when
   information is missing, mirroring what the mock provider already
   guarantees mechanically.
4. Switch on `AI_PROVIDER=anthropic` (or equivalent) and set the relevant
   API key via secrets management, never in a committed `.env`.
5. **Confidentiality**: pitch and brochure content for confidential requests
   must not be sent to any shared/fine-tuned model context that other
   tenants or requests could retrieve from — verify the chosen provider's
   data-handling terms before enabling AI on confidential request types.

## 5. Notifications → Microsoft Teams / email

**Today**: `InAppNotificationProvider` writes rows read by the header bell.
`TeamsNotificationProvider` and `EmailNotificationProvider` exist as unwired
stubs.

**To migrate**:
1. Implement Teams delivery via an incoming webhook or the Graph API
   (adaptive card per notification type), and email via the organisation's
   transactional email service (e.g. an Azure Communication Services or
   SendGrid integration).
2. Register the new providers alongside `InAppNotificationProvider` in
   `src/lib/notifications/index.ts` — the `notify()`/`notifyMany()` call
   sites throughout the app don't change; every existing notification
   simply gains additional delivery channels.
3. Consider per-user delivery preferences (in-app only vs. +Teams vs.
   +email) as a follow-up `User` field once real usage patterns are known.

## 6. Secrets management

`.env` is fine for local development; nothing in it should ever reach a
committed file in a real deployment. In production, source
`DATABASE_URL`, AI provider keys, storage credentials, and any auth client
secrets from the organisation's secrets manager (Azure Key Vault or
equivalent) via environment variables injected at deploy time, not from a
file in the repository.

## 7. Hosting

The app is a standard Next.js application and deploys to any Node-compatible
hosting the organisation approves (Azure App Service, Azure Container Apps,
or similar). No code changes are required for hosting itself; only the
provider selections above.

## 8. Logging, monitoring, backup, disaster recovery

Not implemented in this MVP beyond `console.log` in the notification stubs
and the `AuditEvent` business audit trail (which is a product feature, not
operational logging). Before production:

- Add structured application logging and forward it to the organisation's
  log aggregation (Azure Monitor / Application Insights or equivalent).
- Add uptime/error monitoring and alerting.
- Configure automated backups for the production database (point-in-time
  recovery at minimum) and periodic backup verification.
- Document and test a disaster recovery runbook (RTO/RPO targets, restore
  procedure) appropriate to how business-critical Marketing Hub becomes.

## 9. Security review

Before production rollout:

- Independent review of the Entra ID integration (token validation,
  session handling, role-mapping logic).
- Confirm confidentiality enforcement (§"Security model" in
  ARCHITECTURE.md) under a real penetration test, not just the manual
  verification done during MVP development.
- Review AI provider data-handling terms, especially for confidential
  pitch/tender content (see §4 above).
- Dependency and container image scanning as part of CI/CD.
- Verify no dev-only code paths (§1 above) shipped to production.
