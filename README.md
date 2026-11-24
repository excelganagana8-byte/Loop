# LOOP | AI-Powered Customer-Feedback Intelligence Platform

LOOP is a multi-tenant SaaS platform where businesses ingest customer feedback across multiple touchpoints (app reviews, support tickets, surveys, sales notes), leverage Anthropic Claude to classify and synthesize sentiment/categories, analyze trends through real-time aggregated metrics, and query their feedback data using natural language with verified citations.

---

## Architecture Diagram

```
                                  USER BROWSER
                     (React 18 + Vite + Tailwind CSS + Recharts)
                                        │
                         REST API Calls │ (JWT Bearer Auth)
                                        ▼
                  ┌───────────────────────────────────────────┐
                  │            LOOP EXPRESS API               │
                  │   (Node.js ESM + Helmet + Rate Limit)     │
                  └─────┬───────────────────────────────┬─────┘
                        │                               │
       Scraped / Scoped │ Mongoose                      │ Anthropic SDK
         Multi-tenancy  ▼                               ▼ (Server-only)
             ┌─────────────────────┐       ┌──────────────────────┐
             │    MongoDB Atlas    │       │ Anthropic Claude API │
             │  Compound Indexes   │       │ Structured Tool-Use  │
             │   & Text Indexes    │       │ (Sentiment/Summary)  │
             └─────────────────────┘       └──────────────────────┘
```

---

## Monorepo Folder Map

```
project-loop/
├── package.json                         # Monorepo workspaces coordinator (npm run dev, test, seed, build)
├── .env.example                         # Environment variables template
├── README.md                            # Comprehensive platform documentation & API contract
├── DEPLOYMENT.md                        # Production deployment guide (Atlas, Render/Railway, Vercel)
│
├── shared/                              # Shared domain models & constants (ESM)
│   ├── index.js                         # Barrel export
│   └── constants.js                     # Enums for Roles, Sources, Statuses, Sentiments, Categories
│
├── server/                              # Express REST API
│   ├── src/
│   │   ├── app.js                       # Express app configuration (helmet, cors, morgan, json)
│   │   ├── index.js                     # HTTP server entrypoint
│   │   ├── config/                      # Environment parser (Zod) and MongoDB connection manager
│   │   ├── middleware/                  # auth, rbac, rateLimiter, upload, errorHandler, validate
│   │   ├── modules/
│   │   │   ├── auth/                    # Registration, login, JWT issuance, user model
│   │   │   ├── workspace/               # Multi-tenant workspace model, membership & invitations
│   │   │   ├── feedback/                # Feedback CRUD, compound indexes, CSV stream parsing
│   │   │   ├── ai/                      # Anthropic Claude SDK, structured tool use, fallback
│   │   │   ├── analytics/               # 100% real MongoDB aggregation pipelines
│   │   │   ├── insights/                # Strategic AI synthesis (Theme, Trend, Recommendation)
│   │   │   └── ask/                     # Grounded Q&A pipeline with citation verification
│   │   └── scripts/
│   │       └── seed.js                  # Realistic seed script (~60 items, 2 users, demo workspace)
│   └── tests/                           # Vitest + Supertest automated test suites (52 tests)
│
└── client/                              # React 18 + Vite Frontend
    ├── src/
    │   ├── api/                         # Centralized Axios client with JWT interceptor & 401 redirect
    │   ├── context/                     # AuthContext (session) & ToastContext (notifications)
    │   ├── components/
    │   │   ├── layout/                  # AppLayout, Sidebar (responsive), Topbar (workspace/user)
    │   │   └── ui/                      # Base UI kit (Button, Input, Select, Card, Badge, Modal, etc.)
    │   └── pages/
    │       ├── auth/                    # LoginPage & RegisterPage
    │       ├── dashboard/               # 4 KPI cards, Recharts Area/Donut/Bar charts, Top Issues
    │       ├── inbox/                   # Search, filters, sortable table, detail drawer
    │       ├── submit/                  # Form submission & CSV drag-and-drop ingestion tab
    │       ├── insights/                # Theme, Trend, Recommendation synthesis cards
    │       ├── ask/                     # Ask LOOP chat UI with citation snippets
    │       └── settings/                # Member list, role delegation, workspace rename
```

---

## Quickstart & Installation

### Prerequisites
- Node.js `v18+` or `v20+`
- MongoDB local instance, MongoDB Atlas, or leave default for automatic development in-memory runner.

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `server/.env` and `client/.env`:
```bash
cp .env.example server/.env
cp .env.example client/.env
```
*(Optional)* Add your `ANTHROPIC_API_KEY` to `server/.env` to enable live Claude 3.5 Sonnet analysis. If left blank, LOOP seamlessly uses its resilient fallback mode without breaking.

### 3. Seed Database
Seed the demo workspace, 2 users, and 60 realistic customer feedback items:
```bash
npm run seed
```

### 4. Run Development Servers
Start both the server and client concurrently:
```bash
npm run dev
```
- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000/api`

---

## Demo Credentials (from Seed Script)

| Account | Email | Password | Role | Access Level |
|---|---|---|---|---|
| **Demo Owner** | `alex@acme.corp` | `demo123456` | `OWNER` | Full management, member invite/removal, delete feedback |
| **Demo Member** | `sam.member@acme.corp` | `demo123456` | `MEMBER` | Feedback submission, status updates, Ask LOOP, view analytics |

---

## Automated Test Suite

Run the full Vitest and Supertest backend test suite:
```bash
npm test
```
All **52 test cases** across 11 test suites pass in isolated in-memory MongoDB instances:
- `auth.test.js` (registration, password hashing, JWT, duplicate email check)
- `workspace-isolation.test.js` (cross-workspace 404 enforcement, RBAC deletion restriction)
- `workspace.test.js` (member list, role promotion, invite, workspace rename)
- `feedback-basic.test.js` (feedback creation, pagination, validation)
- `feedback-stage2.test.js` (search, multi-field filters, sorting, status patch)
- `csv-import.test.js` (bulk import, partial success handling, rejected row error reasons)
- `ai.test.js` (Zod structured tool validation, fallback handling, single & batch analysis)
- `analytics.test.js` (real MongoDB summary, distribution, time series trends, top issues)
- `insights.test.js` (strategic insight generation, real evidence counts, workspace scoping)
- `ask.test.js` (grounded Q&A, empty workspace handling, citation verification)
- `health.test.js` (health check & unknown endpoint handling)

---

## Full API Contract Table

All endpoints return `{ success: boolean, data?: any, error?: { code, message, details? } }`.
All routes except `/api/auth/register`, `/api/auth/login`, and `/api/health` require `Authorization: Bearer <token>`.

| Method | Endpoint | Access | Request Body / Query | Success Response Data |
|---|---|---|---|---|
| `GET` | `/api/health` | Public | None | `{ status: 'healthy', service, timestamp, environment }` |
| `POST` | `/api/auth/register` | Public | `{ name, email, password, workspaceName? }` | `{ token, user, workspace, role }` |
| `POST` | `/api/auth/login` | Public | `{ email, password }` | `{ token, user, workspace, role }` |
| `GET` | `/api/auth/me` | Auth | None | `{ user, workspace, role }` |
| `GET` | `/api/workspaces/:id/members` | Auth | None | `[{ membershipId, userId, name, email, role, joinedAt }]` |
| `POST` | `/api/workspaces/:id/members/invite` | OWNER, ADMIN | `{ email, role }` | `{ membershipId, userId, name, email, role }` |
| `PATCH` | `/api/workspaces/:id/members/:userId` | OWNER, ADMIN | `{ role: 'ADMIN' \| 'MEMBER' }` | Updated member object |
| `DELETE` | `/api/workspaces/:id/members/:userId` | OWNER, ADMIN | None | `{ removed: true }` |
| `PATCH` | `/api/workspaces/:id` | OWNER, ADMIN | `{ name }` | Updated workspace object |
| `POST` | `/api/feedback` | Auth | `{ customerName, customerEmail?, message, source, receivedAt? }` | Created Feedback document (status 201) |
| `POST` | `/api/feedback/import` | Auth | `multipart/form-data` with `file` (.csv) | `{ imported: number, rejected: [{ row, reason }] }` |
| `GET` | `/api/feedback` | Auth | `?q=&source=&sentiment=&category=&status=&sort=&page=&limit=` | `{ items: [], page, limit, total, totalPages }` |
| `GET` | `/api/feedback/:id` | Auth | None (returns 404 if not in workspace) | Single Feedback document |
| `PATCH` | `/api/feedback/:id` | Auth | `{ status: 'NEW' \| 'IN_REVIEW' \| 'RESOLVED' \| 'ARCHIVED' }` | Updated Feedback document |
| `DELETE` | `/api/feedback/:id` | OWNER, ADMIN | None (MEMBER receives 403; cross-workspace 404) | `{ deleted: true }` |
| `POST` | `/api/feedback/:id/analyze` | Auth | None | Re-analyzed Feedback document |
| `POST` | `/api/ai/analyze-batch` | Auth | `{ feedbackIds?: string[] }` | `{ total, successful, failed, processedIds }` |
| `GET` | `/api/analytics/summary` | Auth | None | `{ total, sentimentCounts, statusCounts, avgPerDay, resolutionRate }` |
| `GET` | `/api/analytics/distribution` | Auth | `?by=sentiment\|category\|source&range=7d\|30d\|90d\|all` | `{ by, range, total, data: [{ name, count, percentage }] }` |
| `GET` | `/api/analytics/trends` | Auth | `?range=7d\|30d\|90d\|all` | `[{ date, total, positive, negative, neutral }]` |
| `GET` | `/api/analytics/top-issues` | Auth | None | `{ categories: [{ category, count, sampleIds }], keyPhrases: [] }` |
| `GET` | `/api/analytics/recent` | Auth | None | Latest 10 feedback items |
| `POST` | `/api/insights/generate` | Auth | None | `[{ _id, type, title, body, evidence: { count, feedbackIds } }]` |
| `GET` | `/api/insights` | Auth | None | Stored Insight documents |
| `POST` | `/api/ask` | Auth | `{ question, conversationId? }` | `{ answer, citations: [{ feedbackId, snippet }], grounded: boolean }` |

---

## Module Ownership Map

| Module Domain | Location | Core Responsibilities |
|---|---|---|
| **Auth & Multi-tenancy** | `/server/src/modules/auth/`, `/server/src/modules/workspace/` | User credentials, bcrypt hashing, workspace scoping, JWT verification, and RBAC enforcement. |
| **Data & Ingestion** | `/server/src/modules/feedback/` | Mongoose schema, compound & text indexes, manual validated submissions, and CSV stream parser. |
| **Frontend & UI Kit** | `/client/src/` | SaaS design system, reusable component kit, responsive layout, context state, and Recharts charts. |
| **AI Intelligence** | `/server/src/modules/ai/`, `/server/src/modules/insights/`, `/server/src/modules/ask/` | Anthropic Claude tool integration, structured JSON validation, async fire-and-forget pipeline, and Ask LOOP citation verifier. |
| **Integration & Testing** | `/server/tests/`, `/server/src/scripts/seed.js` | Supertest integration test suites, in-memory MongoDB test lifecycle, and demo seed script. |

---

## Feature Status

| Feature | Status | Notes |
|---|---|---|
| User Registration & Login | **Done** | Bcrypt hashing, JWT access token, rate limited |
| Strict Multi-Tenancy Scoping | **Done** | All queries locked to `req.workspaceId`; cross-workspace queries return 404 |
| Server-Side RBAC Enforcement | **Done** | `OWNER`, `ADMIN`, `MEMBER` enforced on backend; members cannot delete feedback |
| Feedback Manual Submission | **Done** | React Hook Form + Zod validation, character counter (5000 chars) |
| CSV Upload & Partial Success | **Done** | Multer memory storage, csv-parse stream, per-row validation with rejection reasons |
| Feedback Inbox Table & Search | **Done** | Keyword search, channel/sentiment/category/status filters, pagination |
| Feedback Detail Drawer | **Done** | Slide-over drawer, status changer with optimistic updates, AI classification breakdown |
| Anthropic Claude Structured AI | **Done** | Tool-use schema (`classify_customer_feedback`), Zod output validation |
| Async Fire-and-Forget Pipeline | **Done** | Non-blocking creation with `ai.status: 'PENDING'` -> background analysis |
| Resilient AI Fallback Path | **Done** | Graceful fallback when API key is missing/fails; never fakes data |
| Real-Data Analytics Aggregation | **Done** | Zero hardcoded numbers; 5 real MongoDB aggregation pipelines |
| Interactive Recharts Dashboard | **Done** | 4 KPI stat cards, volume trend area, sentiment donut, category bar, channel donut |
| AI Strategic Insights Synthesis | **Done** | `THEME`, `TREND`, `RECOMMENDATION` with real feedback evidence counts |
| Ask LOOP Grounded Q&A | **Done** | Precomputed code stats + retrieved feedback + citation verification |
| Team Settings & Member Invite | **Done** | Member list, email invitation, role changer, member removal, workspace rename |
| Seed Script (`npm run seed`) | **Done** | Generates 2 users, demo workspace, 60 verified feedback items, strategic insights |

---

## How to Contribute a New Module

To plug in a new backend module (for example, `/server/src/modules/exports/` for PDF/Slack export integrations):

1. **Create the Module Folder**:
   ```
   server/src/modules/exports/
   ├── exports.validators.js  # Zod validation schemas for query/body
   ├── exports.model.js       # Optional Mongoose schema (if persisting documents)
   ├── exports.service.js     # Business logic scoped strictly to workspaceId
   ├── exports.controller.js  # Express handlers using sendSuccess / sendError
   └── exports.routes.js      # Express Router with requireAuth and RBAC
   ```

2. **Enforce Workspace Scoping**:
   Always extract `workspaceId` from `req.workspaceId` (injected by `requireAuth`). Never allow the client to specify a workspace in the request body or query string:
   ```javascript
   export const getExportHandler = async (req, res, next) => {
     try {
       const result = await exportsService.getExport(req.workspaceId, req.params.id);
       if (!result) {
         return sendError(res, { code: 'NOT_FOUND', message: 'Export not found' }, 404);
       }
       return sendSuccess(res, result);
     } catch (err) {
       next(err);
     }
   };
   ```

3. **Mount in `app.js`**:
   Import `exportsRoutes` and mount in `server/src/app.js`:
   ```javascript
   import exportsRoutes from './modules/exports/exports.routes.js';
   // ...
   app.use('/api/exports', exportsRoutes);
   ```

4. **Add Supertest Integration Tests**:
   Create `server/tests/exports.test.js` validating authentication, input schema validation, and cross-workspace isolation.
