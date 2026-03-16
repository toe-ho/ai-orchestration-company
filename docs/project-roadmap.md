# Development Roadmap

## Project Timeline

This roadmap tracks the AI Company Platform development from MVP through full production readiness. Phases are executed sequentially with clear dependencies.

## Phase Overview

| Phase | Title | Status | Progress | Duration | Target | Dependencies |
|-------|-------|--------|----------|----------|--------|--------------|
| 1 | Monorepo Scaffold + Shared Types + DB | COMPLETE | 100% | 1 week | 2025-11-01 | None |
| 2 | Auth Module (Better Auth Integration) | COMPLETE | 100% | 1 week | 2025-11-08 | Phase 1 |
| 3 | Core CRUD (Companies, Agents, Issues) | COMPLETE | 100% | 2 weeks | 2025-11-22 | Phase 2 |
| 4 | Heartbeat + Execution Engine | PENDING | 0% | 2 weeks | TBD | Phase 3 |
| 5 | Claude Adapter + Executor App | PENDING | 0% | 2 weeks | TBD | Phase 4 |
| 6 | Frontend Pages & UI | PENDING | 5% | 3 weeks | TBD | Phase 3 |
| 7 | Real-time Events & WebSocket | PENDING | 0% | 1 week | TBD | Phase 5 |
| 8 | Cost Tracking + Approvals | PENDING | 0% | 2 weeks | TBD | Phase 7 |
| 9 | Templates + Onboarding | PENDING | 0% | 2 weeks | TBD | Phase 8 |

---

## Phase 1: Monorepo Scaffold + Shared Types + DB

**Status:** COMPLETE (100%)

**Duration:** 1 week

### Deliverables

- [x] pnpm workspaces + Turborepo setup
- [x] NestJS backend application scaffold
- [x] React Vite frontend application (placeholder)
- [x] Shared package (@aicompany/shared) with core types
- [x] Adapters package (@aicompany/adapters) with IAdapter interface
- [x] Adapter utilities package (@aicompany/adapter-utils)
- [x] PostgreSQL schema with TypeORM models
- [x] Database migration system
- [x] Environment configuration loaders

### Key Achievements

- Monorepo structure established (3 apps, 3 packages)
- 13 TypeORM models created (Company, Agent, User, Issue, Goal, Project, etc.)
- 24 entity interfaces defined in shared package
- 11 enums (AgentStatus, IssueStatus, ActivityType, etc.)
- CQRS pattern foundation with command/query bus integration
- Clean Architecture layers established

### Technical Decisions Locked

- pnpm 9 + Turborepo 2 for monorepo management
- NestJS 10.3 with TypeScript 5.4
- PostgreSQL 16 with TypeORM 0.3.20
- Adapter pattern for pluggable AI models

---

## Phase 2: Auth Module (Better Auth Integration)

**Status:** COMPLETE (100%)

**Duration:** 1 week

### Deliverables

- [x] Better Auth 1.5.5 integration (sessions)
- [x] User registration & login endpoints
- [x] Password reset & email verification flows
- [x] Better Auth session tables in PostgreSQL
- [x] Session validation guards & decorators
- [x] UserCompany relationship (multi-tenancy mapping)
- [x] Role-based access control (admin, member, viewer)
- [x] Agent JWT service (inter-agent communication)
- [x] API key management (user & agent keys)
- [x] API key encryption for database storage

### Key Achievements

- Dual authentication system: User sessions (Better Auth) + Agent JWT (custom)
- CompanyAccessGuard ensures users can only access their companies
- Secure HTTP-only cookies for session tokens
- Role management per company (admin, member, viewer)
- Agent authentication via signed JWT

### Technical Decisions Locked

- Better Auth 1.5.5 for user session management
- JWT in HTTP-only cookies (XSS-safe)
- Agent JWT signed with company secret
- Role-based access control (RBAC) per company

---

## Phase 3: Core CRUD (Companies, Agents, Issues)

**Status:** COMPLETE (100%)

**Duration:** 2 weeks

### Deliverables

- [x] Company CRUD endpoints
  - POST /api/companies (create)
  - GET /api/companies (list)
  - GET /api/companies/:id (get)
  - PUT /api/companies/:id (update)
  - DELETE /api/companies/:id (delete)
- [x] Agent CRUD endpoints
  - POST /api/companies/:cid/agents (create)
  - GET /api/companies/:cid/agents (list)
  - GET /api/companies/:cid/agents/:id (get)
  - PUT /api/companies/:cid/agents/:id (update)
  - POST /api/companies/:cid/agents/:id/pause (action)
  - POST /api/companies/:cid/agents/:id/resume (action)
  - POST /api/companies/:cid/agents/:id/terminate (action)
  - GET /api/companies/:cid/agents/tree (organizational chart)
- [x] Issue/Task Management
  - POST /api/companies/:cid/issues (create)
  - GET /api/companies/:cid/issues (list & search)
  - GET /api/companies/:cid/issues/:id (get)
  - PUT /api/companies/:cid/issues/:id (update)
  - POST /api/companies/:cid/issues/:id/checkout (assign to agent)
  - POST /api/companies/:cid/issues/:id/release (unassign from agent)
  - POST /api/companies/:cid/issues/:id/comments (add comment)
  - GET /api/companies/:cid/issues/:id/comments (list comments)
- [x] Goal Management
  - POST /api/companies/:cid/goals (create)
  - GET /api/companies/:cid/goals (list)
  - PUT /api/companies/:cid/goals/:id (update)
- [x] Project Management
  - POST /api/companies/:cid/projects (create)
  - GET /api/companies/:cid/projects (list)
  - PUT /api/companies/:cid/projects/:id (update)
- [x] Activity Logging
  - GET /api/companies/:cid/activity (audit trail)
  - Automatic logging of all mutations
- [x] Dashboard Summary
  - GET /api/companies/:cid/dashboard
  - Company metrics & health overview
- [x] Comprehensive test suite (Vitest)
  - Command handler tests
  - Query handler tests
  - Integration tests
  - All tests passing

### Key Achievements

- 18 command handlers (create, update, delete operations)
- 14 query handlers (read operations, search)
- 11 controllers with full CRUD functionality
- Checkout workflow prevents concurrent issue assignments
- Immutable activity log for audit trail
- Multi-tenant isolation verified in tests
- 80%+ code coverage on critical paths

### Technical Decisions Locked

- CQRS pattern for all operations
- Zod validation for all DTOs
- Automatic activity logging on mutations
- Checkout-release pattern for issue assignment (prevents race conditions)

---

## Phase 4: Heartbeat + Execution Engine

**Status:** PENDING (0%)

**Duration:** 2 weeks

**Dependencies:** Phase 3

### Description

Implement real-time agent health monitoring and execution orchestration.

### Deliverables

- [ ] Heartbeat service (periodic health checks)
  - Agents send heartbeat every 30 seconds
  - Control plane tracks agent status
  - Automatic status updates (online → offline)
  - Dead agent detection & cleanup
- [ ] Execution engine (orchestration layer)
  - Execute command handler to start agent task
  - Queue management (pending, in-progress, completed)
  - Timeout handling (abort long-running tasks)
  - Error handling & retry logic
  - Execution history tracking
- [ ] Issue assignment workflow
  - CheckoutIssueCommand (lock issue to agent)
  - Monitor execution progress
  - Auto-release on completion/failure
- [ ] Redis integration
  - Pub/sub for heartbeat messages
  - Execution event streaming
  - Session state caching
- [ ] Health endpoints
  - GET /api/health (system readiness)
  - GET /api/companies/:cid/agents/:id/health (agent status)

### Success Criteria

- Agents can report heartbeat status
- Control plane detects offline agents within 60 seconds
- Execution events published to Redis
- Tests verify heartbeat & timeout handling
- No missed heartbeats under normal conditions

### Risks

- Network latency causing false offline detection
- Mitigation: Implement exponential backoff for offline confirmation

---

## Phase 5: Claude Adapter + Executor App

**Status:** PENDING (0%)

**Duration:** 2 weeks

**Dependencies:** Phase 4

### Description

Build the Fastify executor application and integrate Claude AI as the primary agent model.

### Deliverables

- [ ] Executor application (Fastify)
  - Receive execution requests from Control Plane
  - Load adapter from registry
  - Initialize session state
  - Stream execution events back via Redis pub/sub
  - Handle tool execution & feedback loops
  - Session serialization (Base64 encoding)
- [ ] Claude Adapter
  - Initialize Claude API client
  - Stream completions from Claude
  - Parse tool calls from response
  - Execute local tools (code, file ops, etc.)
  - Handle streaming tokens
  - Manage session context
  - Graceful cancellation
- [ ] Tool definitions
  - Python code execution
  - File read/write operations
  - HTTP requests
  - Bash command execution (restricted)
  - Database queries
- [ ] Error handling
  - API rate limiting
  - Token limit handling
  - Tool execution failures
  - Graceful degradation
- [ ] Tests
  - Adapter pattern tests
  - Streaming behavior verification
  - Tool execution tests
  - Error scenario coverage

### Success Criteria

- Executor app starts and connects to Redis
- Claude adapter executes simple tasks
- Tool calls are detected and executed
- Streaming events published correctly
- Tests cover happy path & error cases

### Risks

- Claude API rate limits
- Mitigation: Implement request queuing & backoff

---

## Phase 6: Frontend Pages & UI

**Status:** PENDING (5%)

**Duration:** 3 weeks

**Dependencies:** Phase 3 (API available)

### Description

Build React frontend with all management pages and dashboards.

### Deliverables

- [ ] Authentication Pages
  - Login page (email/password)
  - Signup page (registration)
  - Password reset flow
  - Email verification
- [ ] Company Management
  - Company list page
  - Create company form
  - Company settings page
  - Company details view
- [ ] Agent Management
  - Agent list page
  - Create agent form
  - Agent detail page
  - Agent status indicator
  - Org chart visualization
  - Agent actions (pause, resume, terminate)
- [ ] Issue/Task Management
  - Issue list page (filterable, searchable)
  - Create issue form
  - Issue detail page
  - Checkout/release actions
  - Comment thread
  - Status updates
- [ ] Goal Management
  - Goal list page
  - Create/edit goal forms
  - Goal progress tracking
- [ ] Project Management
  - Project list page
  - Project detail view
  - Issue organization by project
- [ ] Dashboard
  - Company summary metrics
  - Recent activity feed
  - Agent status overview
  - Quick actions
- [ ] Real-time Updates (Phase 7)
  - WebSocket integration
  - Live agent status
  - Execution progress streaming
- [ ] Styling & Accessibility
  - Tailwind CSS 4 + shadcn/ui
  - Responsive design
  - Dark mode support
  - WCAG 2.1 AA compliance

### Success Criteria

- All pages load within 3 seconds
- Mobile-responsive (375px-1920px)
- 95%+ Lighthouse score
- No console errors or warnings
- Accessibility audit passes

### Risks

- API endpoint changes breaking UI
- Mitigation: Version API, use client-side error boundaries

---

## Phase 7: Real-time Events & WebSocket

**Status:** PENDING (0%)

**Duration:** 1 week

**Dependencies:** Phase 5

### Description

Implement real-time communication between control plane and frontend via WebSocket.

### Deliverables

- [ ] WebSocket server (NestJS gateway)
  - Accept client connections
  - Authenticate via JWT
  - Scope updates by companyId
  - Handle disconnects & reconnects
- [ ] Event Streaming
  - Agent status updates
  - Execution progress (tokens, tool calls)
  - Issue updates
  - Activity log entries
  - Real-time notifications
- [ ] Redis Pub/Sub Integration
  - Subscribe to execution events
  - Broadcast to connected clients
  - Fan-out from multiple executors
- [ ] Frontend WebSocket Client
  - Connect to server (with auth token)
  - Listen to events for current company
  - Update UI in real-time
  - Automatic reconnection
- [ ] Tests
  - Gateway tests
  - Event routing tests
  - Disconnect/reconnect scenarios

### Success Criteria

- WebSocket connection established in < 1 second
- Events delivered within 100ms
- Handles 1000+ concurrent connections
- Automatic reconnection on network loss
- No memory leaks with long-lived connections

### Risks

- WebSocket connection instability
- Mitigation: Implement heartbeat/ping-pong

---

## Phase 8: Cost Tracking + Approvals

**Status:** PENDING (0%)

**Duration:** 2 weeks

**Dependencies:** Phase 7

### Description

Implement budget management, cost tracking, and approval workflows for agent spending.

### Deliverables

- [ ] Cost Tracking
  - Track API calls per agent
  - Calculate costs based on model pricing
  - Cost per issue/goal/project
  - Monthly cost summary
- [ ] Budget Management
  - Set company budget limit
  - Alert when approaching limit (80%, 95%)
  - Hard stop when limit reached
  - Budget reset schedule (monthly/custom)
- [ ] Approval Workflows
  - Require approval for expensive operations
  - Approval queue UI
  - Approve/reject actions
  - Audit trail of approvals
- [ ] Reporting & Analytics
  - Cost breakdown by agent
  - Cost trend charts
  - ROI calculations
  - Forecasting

### Success Criteria

- Cost calculations accurate (verified against API billing)
- Budget enforcement working (no overspend)
- Approval workflow functional
- Reports generated correctly

---

## Phase 9: Templates + Onboarding

**Status:** PENDING (0%)

**Duration:** 2 weeks

**Dependencies:** Phase 8

### Description

Create company templates and guided onboarding experience for new users.

### Deliverables

- [ ] Company Templates
  - Marketing Agency template
  - Software Development template
  - E-commerce template
  - Consulting template
  - Custom template builder
- [ ] Template Content
  - Pre-defined agents (roles, skills)
  - Suggested projects
  - Common issues/tasks
  - Goal templates
  - Team structures
- [ ] Onboarding Workflow
  - Step-by-step setup wizard
  - Template selection
  - Customization prompts
  - Team member invitations
  - First task creation
  - Go-live checklist
- [ ] Help & Documentation
  - In-app help tooltips
  - Video tutorials
  - Getting started guide
  - FAQ
  - Community forum links

### Success Criteria

- Onboarding completed in < 10 minutes
- 90%+ of new users activate at least one agent
- Support tickets reduced by 30%
- User satisfaction score > 4.5/5

---

## Milestones & Key Dates

### MVP Milestone (After Phase 3) ✓ COMPLETE

- Core CRUD operations functional
- Authentication working
- Multi-tenant isolation verified
- Test coverage > 80%
- Ready for closed beta testing

### Execution Milestone (After Phase 5)

- Agents can execute tasks
- Claude integration working
- Real-time status updates
- Ready for early adopter program

### Public Beta Milestone (After Phase 7)

- Real-time WebSocket events
- Full frontend UI
- Live agent execution visible
- Cost tracking basic version
- Ready for public beta

### Production Milestone (After Phase 9)

- Cost tracking & budget enforcement
- Company templates
- Guided onboarding
- Full documentation
- Ready for production launch

---

## Success Metrics

### Development Metrics

- [ ] Phase completion on schedule (current: Phase 3 ✓)
- [ ] Zero critical bugs in production
- [ ] Test coverage > 80% on critical paths
- [ ] Code review approval rate > 95%
- [ ] CI/CD pipeline pass rate > 99%

### User Metrics (Post-Launch)

- [ ] Time-to-first-task < 10 minutes
- [ ] Agent success rate > 90%
- [ ] User retention (30-day) > 60%
- [ ] NPS score > 50
- [ ] Cost per company < $2K/month

### Performance Metrics

- [ ] API response time p95 < 200ms
- [ ] Frontend load time < 3s
- [ ] WebSocket event latency < 100ms
- [ ] Database query p95 < 50ms
- [ ] Uptime > 99.5%

---

## Dependencies & Blockers

### Current Blockers

None identified. Phase 3 complete and all systems stable.

### Phase 4 Prerequisites

- Phase 3 complete (DONE ✓)
- Redis cluster available (Upstash account ready)
- Execution environment plan finalized

### Phase 5 Prerequisites

- Phase 4 complete (heartbeat stable)
- Claude API key provisioned
- Executor app deployment target confirmed

### Phase 6 Prerequisites

- Phase 3 API stable (DONE ✓)
- Design system finalized (Tailwind 4 + shadcn/ui locked)
- Component library established

### Phase 7 Prerequisites

- Phase 5 executor stable
- Redis pub/sub tested
- WebSocket library selected (socket.io or native)

---

## Ongoing Maintenance Tasks

- **Weekly:** Monitor uptime, error rates, performance metrics
- **Bi-weekly:** Review GitHub issues & prioritize bugs
- **Monthly:** Update roadmap based on user feedback
- **Quarterly:** Security audit & dependency updates

---

**Last Updated:** March 2026
**Next Review:** March 30, 2026
**Version:** 1.0
**Owner:** AI Company Platform Team
