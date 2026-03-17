# System Architecture

## High-Level Overview

AI Company Platform consists of two primary planes: **Control Plane** (company/user management) and **Execution Plane** (agent execution). The Control Plane orchestrates agent teams; the Execution Plane runs agent code.

```
┌─────────────────────────────────────────────────────────────┐
│                        Web Frontend                         │
│              (React 19 + Tailwind + shadcn/ui)              │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────────┐
│                   Control Plane API                         │
│                  (NestJS Backend)                           │
│  - Company Management    - Authentication                   │
│  - Agent CRUD            - Activity Logging                 │
│  - Issue/Task Mgmt       - Multi-tenancy                    │
└────────────┬──────────────────────────────────────┬─────────┘
             │                                      │
             │ SQL                                  │ Pub/Sub
             ▼                                      ▼
        ┌─────────────┐                    ┌──────────────┐
        │ PostgreSQL  │                    │    Redis     │
        │   (Neon)    │                    │  (Upstash)   │
        └─────────────┘                    └──────────────┘
                                                   ▲
                                                   │ Subscribe
                                                   │
┌──────────────────────────────────────────────────┴──────────┐
│                   Execution Plane                           │
│              (Per-Company Fly.io Machines)                  │
│  - Executor App (Fastify)                                   │
│  - Adapter Registry (Claude, others)                        │
│  - Session Management                                       │
│  - Tool Execution & Feedback Loop                           │
└─────────────────────────────────────────────────────────────┘
```

## Component Interactions

### 1. User Session Flow

```
User (Browser)
  │ 1. POST /api/auth/signin {email, password}
  ├──────────────────────────────────────────────>  Control Plane (Auth)
  │                                                      │
  │                                                      ├─ Validate against Better Auth
  │                                                      ├─ Create session
  │                                                      ├─ Store in PostgreSQL
  │                                                      │
  │  2. Set-Cookie: session={JWT}                       │
  │  <──────────────────────────────────────────────────┤
  │
  ├─ Store JWT in HTTP-only cookie
  │
  │ 3. GET /api/companies
  │    Header: Cookie: session={JWT}
  ├──────────────────────────────────────────────>  Control Plane
  │                                                      │
  │                                                      ├─ Verify JWT via Better Auth
  │                                                      ├─ Extract userId
  │                                                      ├─ Scope queries by userId
  │                                                      │
  │  4. {companies: [...]}                              │
  │  <──────────────────────────────────────────────────┤
  │
  └─ Render companies in React
```

### 2. Company Creation Flow

```
User (Frontend)
  │ 1. Enter company name, submit form
  ├──────────────────────────────────────────────>  POST /api/companies
                                                        │
                                                    React Query
                                                        │
                                                        ├─ CompanyController.create()
                                                        │
                                                        ├─ CommandBus.execute(CreateCompanyCommand)
                                                        │
                                                        ├─ CreateCompanyCommandHandler
                                                        │   ├─ Validate DTO with Zod
                                                        │   ├─ Create CompanyModel
                                                        │   ├─ CompanyRepository.save()
                                                        │   │
                                                        │   └─ INSERT INTO companies
                                                        │       SELECT FROM PostgreSQL
                                                        │
                                                        ├─ LogActivityCommand (audit)
                                                        │
  2. {id, name, status, createdAt}                      │
  <──────────────────────────────────────────────────────┤

  Update UI with new company
```

### 3. Agent Execution Flow (Phase 4 - Complete)

**Heartbeat Lifecycle (30-second ticks)**

1. **Scheduler Tick** → PostgreSQL advisory lock acquired
2. **InvokeHeartbeatHandler** (10-step orchestrator):
   - Get active agents, load context, prepare request
   - Wake VM via FlyioProvisionerService (stopped → starting → running)
   - Create HeartbeatRun record, submit to ExecutionEngineService
3. **ExecutionEngineService**:
   - HTTP POST to Executor VM with execution request
   - Stream SSE response, parse HeartbeatRunEvent objects
   - Publish events to Redis channel: `exec/{companyId}/{agentId}`
4. **Executor App** (Per-Company Fly.io Machine):
   - Receive request, load adapter, initialize session
   - Stream tokens from Claude API, detect tool calls
   - Execute local tools, iterate token → tool → result
   - Send completion, stream HeartbeatRunEvent objects back
5. **Event Processing**:
   - ExecutionEngineService aggregates result
   - Publishes final event to Redis for WebSocket delivery
6. **Cleanup**:
   - Hibernates VM (running → hibernating)
   - Marks run completed, updates agent status
   - ReapOrphanedRunsHandler removes stale runs > 5 min old

**Key Features:**
- **Advisory Locks:** PostgreSQL prevents duplicate heartbeat scheduling
- **VM Lifecycle:** stopped → starting → running → hibernating → stopped
- **Event Streaming:** SSE for sub-100ms execution feedback
- **Coalescing:** WakeupAgentHandler batches activation requests
- **Cancellation:** CancelRunHandler stops in-progress executions
- **Redis Integration:** Live events for real-time UI updates (Phase 7)

## Data Flow Overview

### Multi-Tenancy Isolation

Every resource is scoped by `companyId`:

```
┌──────────────────────────────┐
│ User (userId: u1)            │
│ ├─ UserCompany               │
│ │  ├─ companyId: c1          │
│ │  └─ roles: [admin]         │
│ ├─ UserCompany               │
│ │  ├─ companyId: c2          │
│ │  └─ roles: [member]        │
└──────────────────────────────┘

GET /api/companies/:cid/issues
  ├─ Verify user has access to companyId
  ├─ Query issues WHERE companyId = :cid
  └─ Return only issues from that company

Result: User c1 cannot see User c2's issues
```

### Query Scoping Pattern

```typescript
// Example: Get issues for company c1

// Control Plane (NestJS)
QueryBus.execute(new ListIssuesQuery(companyId: 'c1'))
  │
  ├─ ListIssuesQueryHandler
  │
  ├─ IssueRepository.list({companyId: 'c1'})
  │
  ├─ Database
  │  SELECT * FROM issues
  │  WHERE companyId = 'c1'
  │
  └─ Return filtered results
```

## Authentication Architecture

### Dual Authentication System

The platform uses two independent authentication mechanisms:

#### 1. User Sessions (Better Auth)

- **Mechanism:** Better Auth 1.5.5 library
- **Storage:** PostgreSQL (better_auth_sessions, better_auth_users tables)
- **Token:** JWT in HTTP-only cookies (secure, prevents XSS)
- **Scope:** User → Multiple Companies
- **Flow:** Email/password login → JWT session → Verified per request

```
User Login
  │
  ├─ POST /api/auth/signin
  │
  ├─ Better Auth validates credentials
  │  (checks users table)
  │
  ├─ Create session
  │  (INSERT into better_auth_sessions)
  │
  ├─ Return JWT in Set-Cookie header
  │
  ├─ Browser stores in HTTP-only cookie
  │
  └─ Per request: CompanyAccessGuard verifies JWT
     (checks UserCompany relationship)
```

#### 2. Agent JWT (Inter-Agent Communication)

- **Mechanism:** Custom JWT service
- **Signing:** Company secret key
- **Token:** Standard JWT format
- **Scope:** Agent → Company (cannot access other companies)
- **Flow:** Agent receives JWT → Uses for inter-agent API calls

```
Agent A (Company c1) calls Agent B (Company c1)
  │
  ├─ Agent A signs JWT
  │  {
  │    agentId: 'a1',
  │    companyId: 'c1',
  │    iat: now,
  │    exp: now + 1h,
  │    sig: HMAC(SECRET_c1)
  │  }
  │
  ├─ POST /api/agent-issues
  │  Header: Authorization: Bearer {JWT}
  │
  ├─ AgentAuthGuard verifies JWT
  │  ├─ Check signature against SECRET_c1
  │  ├─ Validate expiration
  │  ├─ Extract companyId
  │
  └─ Request allowed if JWT valid
```

## Backend Architecture (NestJS + CQRS)

### Layer Structure

```
┌─────────────────────────────────────────┐
│        Presentation Layer               │
│  Controllers, DTOs, Decorators, Guards  │
│  HTTP ←→ Application Communication      │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│     Application Layer (CQRS)            │
│  Commands, Queries, Services            │
│  Business Logic & Orchestration         │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         Domain Layer                    │
│  Entities, Exceptions, Interfaces       │
│  Pure Business Rules (Framework-Free)   │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│     Infrastructure Layer                │
│  Repositories, Database, Adapters       │
│  External Service Integration           │
└─────────────────────────────────────────┘
```

### CQRS Pattern (Command Query Responsibility Segregation)

**Principle:** Separate read (queries) from write (commands) paths

```
Controller
  │
  ├─ Write Path (POST, PUT, DELETE)
  │  │
  │  └─ CommandBus.execute(CreateCompanyCommand)
  │     │
  │     └─ CreateCompanyCommandHandler
  │        ├─ Validate input
  │        ├─ Apply business logic
  │        ├─ Persist to database
  │        ├─ Emit domain events (audit log)
  │        └─ Return result
  │
  ├─ Read Path (GET)
  │  │
  │  └─ QueryBus.execute(GetCompanyQuery)
  │     │
  │     └─ GetCompanyQueryHandler
  │        ├─ Query database (optimized for reads)
  │        ├─ Map to DTO
  │        └─ Return result
```

**Benefits:**
- Clean separation of concerns
- Easier to test (mock dependencies independently)
- Scalable: reads and writes can have different performance requirements
- Auditable: commands are a full audit trail

### Repository Pattern (Data Access)

All data access through repositories implementing domain interfaces:

```
Domain (Interface)
  ↓
Infrastructure (Implementation using TypeORM)
  ↓
TypeORM → PostgreSQL
```

Example: Company Repository

```
ICompanyRepository (Domain Interface)
├─ save(company: ICompany): Promise<ICompany>
├─ findById(id: string): Promise<ICompany | null>
├─ list(criteria): Promise<ICompany[]>
└─ delete(id: string): Promise<void>

CompanyRepository (Implementation)
├─ Uses @InjectRepository(CompanyModel)
├─ Converts TypeORM models to domain interfaces
├─ Handles SQL queries
└─ Manages transactions
```

## Cost Tracking & Budget Management (Phase 8 - COMPLETE)

**Implementation:** Cost Event Recording + Nightly Reconciliation + API Key Vault

```
Execution Run
  │
  └─ OnHeartbeatCompletedHandler
     │
     └─ RecordCostEventCommand
        ├─ Calculate: tokens × rate = cents
        ├─ Provider, model, tokens, cost captured
        │
        └─ CostEventRepository.save()
           │
           └─ INSERT INTO cost_events
              {companyId, agentId, provider, model, tokens, cents, timestamp}

Daily (02:00) - PostgreSQL Advisory Lock
  │
  └─ NightlyCostReconciliationService
     ├─ Acquire advisory lock (pg_advisory_lock)
     ├─ Sum daily costs by company
     ├─ Check budget thresholds (80%, 95%)
     ├─ Emit alerts if approaching limit
     │
     └─ Update company budget status
```

**Key Features:**
- **Cost Tracking:** Provider, model, token count, cost in cents per run
- **Budget Reconciliation:** Nightly cron at 02:00 UTC with advisory lock
- **Alerts:** Threshold notifications at 80% & 95% budget utilization
- **API Key Vault:** AES-256-GCM encryption for agent API keys (pcp_ prefix, SHA-256 hash)
- **Reports:** Cost summaries by company, agent, model, time period

**Controllers:**
- **BoardCostController:** GET /board/cost (summary), GET /board/cost/export (reports)
- **BoardApiKeyVaultController:** POST/PUT/DELETE encrypted API keys
- **AgentApprovalController:** Agent-specific cost & approval queries

---

## Approval Workflow & Governance (Phase 8 - COMPLETE)

**Implementation:** Create → Approve/Reject/Request-Revision → ApprovalResolved → Auto-Create Agent

```
Board Member
  │ 1. Submit approval request
  ├──────────────────────────────>  POST /board/approval
                                        {actor, agentType, ...}
                                        │
                                        └─ CreateApprovalCommand
                                           ├─ Validate inputs
                                           ├─ Create Approval record
                                           │  status: pending
                                           │
                                           └─ ApprovalRepository.save()
                                              INSERT INTO approvals

Board Manager
  │ 2. Review & approve
  ├──────────────────────────────>  POST /board/approval/:id/resolve
                                        {decision: 'approved', comment}
                                        │
                                        └─ ResolveApprovalCommand
                                           ├─ Update approval.status
                                           ├─ Add ApprovalComment
                                           ├─ Emit ApprovalResolvedEvent
                                           │
                                           └─ ApprovalRepository.update()

Event Handler (OnApprovalResolvedHandler)
  │ 3. Auto-create agent if hired
  ├─ IF decision === 'approved' AND type === 'hire_agent'
  │
  └─ CreateAgentCommand (auto-triggered)
     ├─ Generate agent credentials
     ├─ Create pcp_ API key
     ├─ Show key once (stored hashed)
     │
     └─ AgentRepository.save()
```

**Approval Status:**
- `pending` - Awaiting review
- `approved` - Request accepted
- `rejected` - Request denied
- `revision-requested` - Changes needed, resubmit

**Key Features:**
- **Approval Comments:** Threaded discussion on each approval
- **Audit Trail:** Who approved/rejected, when, with comments
- **Auto-Creation:** Approved hire_agent requests auto-create agents
- **API Key Management:** pcp_ prefix, SHA-256 hashed, shown once, encrypted at rest (AES-256-GCM)
- **Multi-role Support:** Different roles can create/approve (configurable)

---

## Real-Time Communication (Phase 7 - COMPLETE)

**Implementation:** WebSocket Gateway + Redis Pub/Sub + React Query

```
Frontend (React)       WebSocket        Control Plane (NestJS)      Redis
                       Connection           + Redis Sub
│                           │                    │                    │
├─ Connect                  │                    │                    │
│  with session JWT    ────>│                    │                    │
│                            │                    │                    │
│                        Authenticate            │                    │
│                        Verify company          │                    │
│                            │                   │                    │
│                           [Connected]           │                    │
│                            │                    │                    │
│                                              Event emission
│                                              (PauseAgent, etc.)
│                                                 │                    │
│                                                 ├──────────────────>│
│                                                 │  PUBLISH           │
│                                                 │  channel:          │
│                                                 │  company:{cid}     │
│                                                 │                    │
│                         Redis Sub <────────────────────────────────<┤
│                         Receives event                              │
│                         {type: 'agent-paused', agentId, ...}       │
│                            │                                        │
│  Real-time update     <────┤                                        │
│  {event: ...}              │                                        │
└────────────────────────────┘
```

**Components:**
- **LiveEventsGateway** (@nestjs/websockets + socket.io): Authenticates connections, manages subscriptions
- **RedisCompanyEventPublisher:** Publishes company-level events to Redis channel `company:{companyId}`
- **Frontend Hooks:** `use-websocket()`, `use-live-events()` for subscribing to real-time events
- **Event Sources:** PauseAgentHandler, ResumeAgentHandler, CheckoutIssueHandler, UpdateIssueHandler, OnHeartbeatCompletedHandler
- **Auth:** Better Auth session cookie validation on WebSocket handshake

## Adapter Pattern (AI Model Integration)

The system supports multiple AI models via pluggable adapters:

```
┌─────────────────────────────────────┐
│      Adapter Registry               │
│  Manages available adapters         │
└────────────┬────────────────────────┘
             │
             ├─ Register Claude Adapter
             ├─ Register GPT-4 Adapter (future)
             └─ Register Custom Adapter (future)

IAdapter Interface (Shared)
├─ execute(request): AsyncIterable<ExecutionEvent>
├─ cancel(runId): Promise<void>
└─ health(): Promise<HealthStatus>

ClaudeAdapter (Implementation)
├─ execute()
│  ├─ Stream tokens from Claude API
│  ├─ Detect tool calls
│  ├─ Execute local tools
│  └─ Yield ExecutionEvents
├─ cancel()
│  └─ Abort ongoing request
└─ health()
   └─ Check Claude API connectivity
```

## Database Schema

**Technology:** PostgreSQL 16 with TypeORM

### Core Tables

```
┌──────────────┐
│   users      │ (Better Auth)
├──────────────┤
│ id (PK)      │
│ email        │
│ name         │
│ createdAt    │
└──────────────┘
       │ 1:N
       │
┌──────────────┬──────────────┐
│ user_company │ (Junction)   │
├──────────────┤──────────────┤
│ userId (FK)  │ companyId(FK)│
│ roles[]      │              │
└──────────────┴──────────────┘
                 │ 1:N
                 │
         ┌───────▼─────────┐
         │   companies     │
         ├─────────────────┤
         │ id (PK)         │
         │ name            │
         │ status          │
         │ budget_limit$   │ (Phase 8 NEW)
         │ createdAt       │
         └─────────────────┘
                 │
    ┌────────────┼────────────────────┐
    │            │                    │
┌───▼───┐  ┌────▼────┐  ┌───▼──────┐ ┌──▼──────────┐
│agents │  │ projects │  │  issues  │ │ cost_events │ (Phase 8)
├───────┤  ├─────────┤  ├──────────┤ ├─────────────┤
│cid(FK)│  │cid(FK)  │  │cid (FK)  │ │cid (FK)     │
│status │  │status   │  │status    │ │agentId (FK) │
│type   │  │name     │  │assignee  │ │provider     │
└───────┘  └─────────┘  └──────────┘ │model        │
    │          │             │        │tokens       │
    │          │             │        │cents        │
    │          │             │        │timestamp    │
    │          │             │        └─────────────┘
    │          │             │
    │          │             │        ┌──────────────────┐
    │          │             │        │ approvals        │ (Phase 8)
    │          │             │        ├──────────────────┤
    │          │             │        │id (PK)           │
    │          │             │        │cid (FK)          │
    │          │             │        │actor_id (FK)     │
    │          │             │        │type (hire_agent) │
    │          │             │        │status (pending)  │
    │          │             │        │metadata (JSON)   │
    │          │             │        │createdAt         │
    │          │             │        └──────────────────┘
    │          │             │                 │ 1:N
    │          │             │        ┌────────▼──────────┐
    │          │             │        │approval_comments  │
    │          │             │        ├───────────────────┤
    │          │             │        │id (PK)            │
    │          │             │        │approvalId (FK)    │
    │          │             │        │userId (FK)        │
    │          │             │        │message            │
    │          │             │        │createdAt          │
    │          │             │        └───────────────────┘
    │          │             │
    └──────────┼─────────────┘
               │
         ┌────▼──────────┐
         │  activity     │ (Audit log)
         ├───────────────┤
         │ id, cid (FK)  │
         │ type          │
         │ userId/agentId│
         │ metadata      │
         └───────────────┘
```

### Multi-Tenancy Isolation

Every table has `companyId` (or inherits via FK):
- Direct: `companyId` column in table
- Indirect: Via FK relationship (e.g., Issue → Company)

**Guarantee:** Queries filtered by companyId prevent cross-tenant data leaks

## Deployment Architecture

### Development (Docker Compose)

```
localhost
├─ http://localhost:3000   → Backend API
├─ http://localhost:5173   → Frontend (Vite dev server)
├─ postgres:5432           → PostgreSQL
└─ redis:6379             → Redis
```

### Production (Fly.io)

```
Fly.io Region (e.g., us-east)
├─ Control Plane Machine (NestJS)
│  ├─ Hostname: api.example.com
│  ├─ Handles: Auth, CRUD, heartbeat ticks
│  ├─ Scheduler: 30s heartbeat + orphan cleanup
│  ├─ FlyioProvisionerService: Manages VM lifecycle
│  ├─ ExecutionEngineService: Runs executions
│  ├─ Persistent volume: /data (logs)
│  └─ Resources: 512MB RAM, 1x shared CPU
│
├─ PostgreSQL (Managed - Neon)
│  ├─ Core data (companies, agents, issues)
│  ├─ Advisory locks for heartbeat synchronization
│  ├─ HeartbeatRun & HeartbeatRunEvent tables
│  └─ Connection pooling via PgBouncer
│
├─ Redis (Managed - Upstash)
│  ├─ Pub/sub: exec/{companyId}/{agentId}
│  ├─ Live event streaming for WebSocket (Phase 7)
│  └─ REST API endpoint
│
└─ Per-Company Machines (Execution Plane - Phase 4)
   ├─ Spawned by FlyioProvisionerService on heartbeat
   ├─ States: stopped → starting → running → hibernating
   ├─ Runs Fastify Executor app
   ├─ Adapter registry (Claude, future others)
   ├─ Session state management
   ├─ Tool execution environment
   ├─ Redis pub/sub connection
   └─ Hibernates after execution completes
```

## Performance & Scalability

### Caching Strategy (Planned)

```
Request
  │
  ├─ Check Redis cache
  │  ├─ Hit: Return (fast)
  │  └─ Miss: Continue
  │
  ├─ Query PostgreSQL
  │
  ├─ Cache result in Redis
  │  TTL: 5-60 seconds depending on data
  │
  └─ Return to client
```

### Database Indexing

Critical indexes for multi-tenancy:

```sql
CREATE INDEX idx_companies_id ON companies(id);
CREATE INDEX idx_agents_company_id ON agents(companyId);
CREATE INDEX idx_issues_company_id ON issues(companyId);
CREATE INDEX idx_issues_status_company ON issues(companyId, status);
CREATE INDEX idx_users_email ON users(email) UNIQUE;
```

### Response Time Targets

- **API Calls:** < 200ms at p95
- **Database Queries:** < 50ms at p95 (with indexes)
- **Frontend Load:** < 3s for initial page load

## Security Architecture

### Defense Layers

```
1. Network Layer
   └─ HTTPS/TLS (in production)

2. Authentication Layer
   └─ Better Auth (user sessions)
   └─ Agent JWT (agent-to-agent)

3. Authorization Layer
   └─ Guards (CompanyAccessGuard, etc.)
   └─ Role-based checks (admin, member, etc.)

4. Data Layer
   └─ Multi-tenancy isolation (companyId scoping)
   └─ SQL parameterization (prevent injection)
   └─ API key encryption

5. Audit Layer
   └─ Activity log (all mutations recorded)
   └─ Timestamps & actors (who did what when)
```

### Secrets Management

```
Environment Variables (Secure in Production)
├─ DATABASE_URL (Neon connection string)
├─ REDIS_URL (Upstash endpoint)
├─ BETTER_AUTH_SECRET (session encryption)
├─ JWT_SECRET (agent JWT signing)
├─ CLAUDE_API_KEY (Claude integration)
└─ (Never commit to git)
```

---

**Last Updated:** March 17, 2026
**Version:** 1.1 (Phase 8 adds cost tracking & approvals)
**Phase 8 Additions:** Cost tracking, budget management, approval workflows, API key vault (AES-256-GCM)
**Reference:** See [blueprint/](./blueprint/) for detailed technical designs
