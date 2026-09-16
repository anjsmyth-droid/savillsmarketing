# Product Specification

Marketing Hub is the single place Savills Ireland employees go for anything
involving Marketing, PR, content, creative services, pitches, brochures,
campaigns or marketing assets: **Request → Create → Track → Find**.

## Roles

| Role | Can do |
|---|---|
| **Standard User** | Create requests; view/track their own requests and ones they're a participant on; access non-confidential Library content |
| **Divisional User / Director** | Everything a Standard User can, plus visibility of non-confidential requests raised by others in their department |
| **Marketing** | See and manage all requests (including confidential ones); assign owners and priority; update status; use the Kanban board; access and edit the Library; generate AI-assisted content; view Reporting and Brand & Content Knowledge |
| **Marketing Admin** | Everything Marketing can, plus Settings (request types, media lists, service lines, asset types), Users & Permissions, and editing Brand & Content Knowledge |

Confidential requests (pitches, tenders, acquisitions, sensitive
transactions, pre-launch instructions) are hidden from anyone who is not
Marketing, the requestor, or an explicit participant — enforced at the
database query layer, not the UI.

## Navigation

Standard/Divisional/Marketing users see: **Home · Requests · Create ·
Calendar · Library**. Marketing and Marketing Admin additionally see
**Admin**, which contains Control Centre, Reporting, Brand & Content
Knowledge, and (Marketing Admin only) Settings and Users & Permissions.

## Home

Answers "what do you need help with?" with a grid of request-type cards
(Property PR/Editorial, PR/Media, Op-ed/Thought Leadership, Social Media,
Email/E-campaign, Brochure, Pitch/Tender, Event Marketing, Research/Report
Launch, Internal Communications, Creative/Design, Other). Below that:
**Awaiting You** (anything needing the user's action — a draft to approve,
information Marketing has asked for), **My Active Requests**, and **Quick
Actions** (start a request, create content, find an asset, view my requests).

## Intelligent request workflows

Every request type is a multi-step, conditional form (progress indicator,
save-draft/autosave, back/next, file upload, review-before-submit) driven by
a shared workflow engine (see ARCHITECTURE.md) rather than one generic form.
Implemented types: Property PR/Editorial (the richest — situation, property
type, property details with conditional pricing fields, the story, PR
requirements including a categorised target-media picker, and classified
asset upload), PR/Media, Op-ed/Thought Leadership, Social Media, Email/
E-campaign, Event Marketing, Research/Report Launch, Internal
Communications, Creative/Design, and Other. Brochure and Pitch/Tender route
into their own dedicated Studios instead of the generic form.

On submission: required fields are validated, an AI brief summary is
generated for Marketing, Marketing is notified, and the request enters the
shared status pipeline: **Draft → Submitted → Brief Review → In Progress →
Draft Ready → Awaiting Requestor → Awaiting Approval → Scheduled →
Complete.**

## Request detail workspace

Every request has Overview (key details, AI brief summary, AI brief-gap
check, Marketing controls), Brief (full submitted answers), Files
(uploaded/classified, auto-captured into the Library), Content (AI-assisted
drafts and manual content versions), Activity (merged status-change/comment
timeline, with internal-only notes vs. requestor-visible updates), and
Approvals (request an approval from any participant; the assigned approver
gets Approve/Request changes actions) tabs.

## Marketing Control Centre

Workload stats (open, new, due this week, awaiting Marketing, awaiting
requestor, overdue, completed this month) plus a drag-and-drop Kanban board
(New → Reviewing → In Production → Awaiting Business → Awaiting Approval →
Scheduled → Complete) showing type, division, requestor, owner, due date,
priority and confidentiality per card.

## Marketing Library

Search-first (not folder-first) asset repository. Categories: Properties,
People, Photography, Brochures, PR, Pitches, Research, Events, Video, Brand
Assets, Campaigns. **Builds itself automatically**: any file uploaded to any
request becomes a searchable Asset with an inferred category and
AI-suggested tags — Marketing never has to separately populate a DAM.
Marketing can edit an asset's title, category, confidentiality and tags.
Confidential assets are excluded from search for anyone without access to
the underlying request. A future "Ask the Library" conversational search is
intentionally **not** implemented — see ARCHITECTURE.md.

## Marketing Calendar

Month/week/list views of PR launches, research publications, events, social
and e-campaigns, property launches, sponsorships, internal campaigns and
thought leadership, filterable by division, type and owner, with click-
through to the underlying request.

## Brochure Studio

Property-type-aware section templates (Investment, Office, Industrial &
Logistics, Retail, Development Land, Hotels, Residential, New Homes, Country
Residential, Other each get a different section set). Intake prefills facts
from an existing Property record or manual entry and computes a missing-
information checklist. Per section: Generate Content, Regenerate, Shorten,
Expand, Change emphasis, manual edit, version history, copy. AI output is
always visibly flagged and grounded only in supplied facts — never invented.

## Pitch Studio

Upload source documents, then analyse a pasted tender-text summary into
client/opportunity, evaluation criteria, mandatory sections, information
gaps and clarification questions. A structured interview (why we can win,
competitors, client priorities, team, differentiators, sensitivities, case
studies, commercial messages) grounds Generate Pitch Structure and Generate
First Draft, with per-section regenerate/edit. Confidentiality is inherited
from the underlying request, so pitch content is never visible to anyone
outside Marketing and the assigned pitch team.

## AI throughout the product

Every AI touchpoint goes through one `AIProvider` interface (see
ARCHITECTURE.md) and is always presented as a reviewable draft with a visible
disclaimer — Marketing retains final responsibility:

- **Brief summary** — plain-language summary for Marketing on every submitted request.
- **Brief gap check** — "you're missing X" against the request type's required fields.
- **PR angle** (Property PR/Media) — suggested angle, headline, structure, audience, media, gaps.
- **Op-ed analysis** — angle, headline, structure, audience, target media, evidence gaps.
- **Social/email draft copy** — variants for Marketing to review, not auto-post.
- **Brochure section drafting** — fact-grounded, section-by-section, with shorten/expand/regenerate.
- **Tender analysis & pitch drafting** — see Pitch Studio above.
- **Asset tag suggestions** — applied automatically on upload, editable by Marketing.

## Reporting / Marketing Intelligence

Native dashboard (no external BI tool required): requests this month/YTD,
overdue count, average/median turnaround, PR/pitch/brochure counts, assets
added this month, completed campaigns, a 6-month demand trend, current
workload by Marketing owner, requests by type, and most active departments
— all computed live from the same data every other screen uses.

## Admin configuration

Marketing Admin can manage Request Types (active/inactive), Media Lists
(add outlets by category: National, Property/Trade, Broadcast, Regional),
Service Lines, Asset Types, Brand & Content Knowledge (brand guidelines,
tone of voice, approved terminology, boilerplate, statistics, disclaimers,
example content, biographies, service descriptions), and Users &
Permissions (role assignment across the seeded dummy users, standing in for
Entra ID group-driven roles in production).

## Notifications

In-app notification centre (header bell, unread count, mark read/mark all
read) for: request submitted, owner assigned, status changed, information
requested, draft ready, approval requested, comment added, request approved,
request completed. Architected so Teams/email delivery can be added as
additional channels without changing any call site — see ARCHITECTURE.md.

## Auditability

Every request creation, submission, assignment, status/priority change,
completion, file upload/delete, content generation, approval request/
decision, and permission change is written to an audit log accessible to
Marketing Admin.

## Dummy data

Seeded: 13 users spanning every role and department (Marketing, Creative
Services, Residential, Commercial, Industrial & Logistics, Retail, Capital
Markets & Investment, New Homes, Research), 28 requests across every type
and status (including overdue, confidential, and completed examples with
full comment/approval/content history), 9 properties, 6 clients, 5
campaigns, 12 calendar items, and 11 Brand & Content Knowledge documents —
all fictional, no real Savills client data.

## Success-criteria walkthrough

The seeded data supports demonstrating, end to end: a Standard User raising
a Property PR request → Marketing assigning an owner → Marketing requesting
missing photography → the requestor seeing it under Awaiting You and
uploading it → Marketing generating an AI PR angle and progressing the
request → an approval being requested and granted → the request completing
→ its photography and content remaining searchable in the Library → the
Reporting dashboard reflecting the completed work. Separately: an op-ed
request, a brochure generated end to end, a mock tender analysed and pitched,
historic asset search, Kanban workload management, and confidential-request
permission enforcement.
