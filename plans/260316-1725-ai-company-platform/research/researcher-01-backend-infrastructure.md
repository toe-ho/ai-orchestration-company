# Backend & Infrastructure Stack Research

## 1. NestJS + CQRS + TypeORM (2025-2026)

**Module Structure:**
- Separate `commands/` and `queries/` folders within feature modules
- Register handlers as providers; CqrsModule imported alongside TypeOrmModule
- Commands change state (no return); Queries read only (no side effects)
- Each command/query has exactly one handler (latest registration wins)

**Best Practices:**
- Use @InjectRepository in query handlers for TypeORM access
- Scale queries/commands independently for performance
- Commands can be logged or handled asynchronously via events
- Only adopt CQRS when scalability is critical; complexity cost is real

**Gotcha:** CQRS adds overhead for simple CRUD—validate need before implementing.

---

## 2. Better Auth + NestJS Integration

**Session Management:**
- Disable NestJS body parser in main.ts (Better Auth handles raw requests)
- Better Auth sets secure HTTP-only cookies automatically
- @Session() decorator injects session; AuthGuard validates it globally by default

**OAuth & Guards:**
- @AllowAnonymous() and @OptionalAuth() decorators control route access
- Global AuthGuard can be disabled; use APP_GUARD for per-controller registration
- Works with REST, GraphQL, WebSocket via same guard system

**Cross-Domain Setup:**
- Set base path to ensure session cookies pass across domains
- Raw Express req/res exposed via context for cookie handling

**Version:** Better Auth v0.x is production-ready with full NestJS support.

---

## 3. Fly.io Machines API for Provisioner Service

**REST Endpoints:**
- Create: POST `/apps/{app_id}/machines` (boots by default)
- Start: POST `/machines/{id}/start`
- Stop: POST `/machines/{id}/stop` (preserves machine)
- Destroy: DELETE `/machines/{id}`

**Base URLs:**
- Internal: `http://_api.internal:4280`
- Public: `https://api.machines.dev`

**Machine Lifecycle:**
Docker image → Region → Resource settings → Create → Start/Stop → Destroy

**Provisioner Pattern:** Create machines on-demand from provisioner service running on Fly.io; use internal API for lower latency.

---

## 4. @nestjs/schedule for Heartbeat Scheduling

**Decorators:**
- @Cron() - Cron pattern scheduling
- @Interval() - Fixed interval execution (ms)
- @Timeout() - One-time delayed execution

**Overlapping Execution Prevention:**
- Mutex flag pattern: Check if previous run in progress; skip if busy
- Redis locks: Set key before task, delete after (timeout prevents deadlock)
- Database locks: SELECT FOR UPDATE or similar for multi-instance safety

**Multi-Instance Scaling Issue:**
Horizontal scaling runs jobs simultaneously across all instances. Use database or Redis locking to ensure single execution.

**Heartbeat Pattern:** Send status updates to monitoring service; notify only on missed checkins.

---

## 5. SSE (Server-Sent Events) in NestJS

**Implementation:**
- Use @Sse() decorator on controller method
- Return RxJS Observable; each emission becomes SSE message
- Format: `event: {name}\ndata: {content}\n\n`

**For Fly.io VMs to Control Plane:**
- VM opens SSE connection back to control plane
- Streams events (logs, status, metrics) via EventSource protocol
- Parse with built-in EventSource API or node-eventssource package
- Handles reconnection automatically with Last-Event-ID header

**Use Case:** VM reports heartbeat, logs, provisioning status in real-time to orchestrator.

---

## Key Versions (2026)
- NestJS: v10+ (current stable)
- TypeORM: v0.3+ (supports modern TypeScript)
- Better Auth: v0.x (production-ready)
- @nestjs/schedule: v4.x

## Stack Readiness
All components have production maturity. No experimental dependencies.

## Unresolved Questions
- How to handle SSE reconnection with Redis pub/sub fan-out (state management)?
- Optimal Redis key strategy for distributed cron locks (TTL, naming)?
