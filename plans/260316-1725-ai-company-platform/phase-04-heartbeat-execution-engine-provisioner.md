# Phase 4: Heartbeat Engine + Execution Engine + Provisioner

## Context Links
- Parent: [plan.md](./plan.md)
- Dependencies: Phase 1 (DB models), Phase 2 (agent JWT), Phase 3 (agent/issue repos)
- Docs: [12-api-architecture](../../docs/blueprint/03-architecture/12-api-architecture-nestjs.md), [15-database-design](../../docs/blueprint/04-data-and-api/15-database-design.md), [23-config-and-environment](../../docs/blueprint/06-infrastructure/23-config-and-environment.md)

## Overview
- **Date:** 2026-03-16
- **Priority:** P1 — core execution loop
- **Status:** pending
- **Review:** pending
- **Description:** Implement the heartbeat lifecycle (10-step orchestrator), execution engine (HTTP POST to VM + SSE parse), Fly.io provisioner (boot/hibernate/destroy VMs), wakeup queue, orphan reaper, and @nestjs/schedule cron.

## Key Insights
- InvokeHeartbeatHandler is THE big orchestrator — 10 steps from "check agent" to "idle timer"
- ExecutionEngine sends HTTP POST to VM, receives SSE stream back
<!-- Updated: Validation Session 1 - LocalRunner for dev mode -->
- **LocalRunner for dev:** Same HTTP interface as CloudRunner but targets localhost:3200. IExecutionRunner interface with CloudRunner (Fly.io) and LocalRunner (localhost) implementations. Selected by NODE_ENV or config flag.
- Provisioner uses Fly.io Machines REST API (create, start, stop, destroy)
- @nestjs/schedule runs on all instances — MUST use pg advisory lock for single execution
- Wakeup requests coalesce: multiple requests for same agent within window → one heartbeat
- Orphan reaper: runs every 30s, finds runs stuck in "running" > 10 min with no events

## Requirements

### Functional
- **InvokeHeartbeatCommand/Handler** — 10-step lifecycle:
  1. Validate agent active + under budget
  2. Retrieve company API key (decrypt)
  3. EnsureVm (boot/wake Fly.io VM)
  4. Create HeartbeatRun (status: queued)
  5. Sign agent JWT for this run
  6. Build ExecutionRequest (context, session, API key, JWT)
  7. POST to executor VM, parse SSE stream
  8. For each event: persist HeartbeatRunEvent + publish live event
  9. On completion: record cost, update runtime state, update agent spend
  10. Start idle timer → hibernate VM after FLY_IDLE_TIMEOUT_MIN
- **WakeupAgentCommand** — queue wakeup, coalesce duplicates
- **CancelRunCommand** — POST cancel to VM, mark run cancelled
- **ReapOrphanedRunsCommand** — find stale runs, mark timed_out
- **ExecutionEngineService** — HTTP POST to VM + SSE stream parsing
- **FlyioProvisionerService** — Machines API: ensure, hibernate, destroy
- **CompanyVm tracking** — status transitions: stopped→starting→running→hibernating
- **Domain events:** AgentStatusChangedEvent, HeartbeatRunCompletedEvent, BudgetExceededEvent
- **@nestjs/schedule cron:** tick() every N seconds per agent's heartbeatIntervalSec
- **pg advisory lock** for scheduler tick (single instance execution)

### Non-Functional
- SSE parse must handle reconnection gracefully
- VM boot timeout: 60s
- Run timeout: agent's adapterConfig.timeoutSec (default 600s)
- Cost recording: inputTokens, outputTokens, costCents, computeCostCents

## Architecture

```
Scheduler (cron) ─┐
Board (manual)  ──┤→ WakeupAgentCommand → coalesce queue
Agent (self)    ──┘                          │
                                             ▼
                            InvokeHeartbeatCommand
                                    │
            ┌───────────────────────┼───────────────────────┐
            ▼                       ▼                       ▼
    EnsureVmCommand         Build ExecutionRequest    Sign Agent JWT
            │                       │
            ▼                       ▼
    FlyioProvisioner        ExecutionEngine.execute()
    (Machines API)          POST /execute → VM
                            Parse SSE ← VM
                                    │
                            ┌───────┼───────┐
                            ▼       ▼       ▼
                    RunEvent   LiveEvent   CostEvent
                    (persist)  (Redis)     (record)
```

## Related Code Files

### Application — Commands
- `application/commands/heartbeat/invoke-heartbeat-command.ts`
- `application/commands/heartbeat/invoke-heartbeat-handler.ts` — THE 10-step orchestrator
- `application/commands/heartbeat/wakeup-agent-command.ts`
- `application/commands/heartbeat/wakeup-agent-handler.ts`
- `application/commands/heartbeat/cancel-run-command.ts`
- `application/commands/heartbeat/cancel-run-handler.ts`
- `application/commands/heartbeat/reap-orphaned-runs-command.ts`
- `application/commands/heartbeat/reap-orphaned-runs-handler.ts`
- `application/commands/provisioner/ensure-vm-command.ts`
- `application/commands/provisioner/ensure-vm-handler.ts`
- `application/commands/provisioner/hibernate-vm-command.ts`
- `application/commands/provisioner/hibernate-vm-handler.ts`
- `application/commands/provisioner/destroy-vm-command.ts`
- `application/commands/provisioner/destroy-vm-handler.ts`

### Application — Queries
- `application/queries/heartbeat/list-runs-query.ts` + handler
- `application/queries/heartbeat/get-run-query.ts` + handler
- `application/queries/heartbeat/list-run-events-query.ts` + handler
- `application/queries/heartbeat/get-live-runs-query.ts` + handler
- `application/queries/issue/get-heartbeat-context-query.ts` + handler

### Application — Services
- `application/services/interface/i-execution-engine-service.ts`
- `application/services/interface/i-provisioner-service.ts`
- `application/services/impl/execution-engine-service.ts` — HTTP POST + SSE parse
- `application/services/impl/flyio-provisioner-service.ts` — Machines API wrapper
<!-- Updated: Validation Session 1 - LocalRunner -->
- `application/services/impl/local-execution-runner.ts` — HTTP to localhost:3200 (dev mode)
- `application/services/interface/i-execution-runner.ts` — CloudRunner vs LocalRunner interface

### Application — Events
- `application/events/agent-status-changed-event.ts`
- `application/events/heartbeat-run-completed-event.ts`
- `application/events/budget-exceeded-event.ts`
- `application/events/handlers/on-heartbeat-completed.ts`
- `application/events/handlers/on-budget-exceeded.ts`

### Infrastructure
- `infrastructure/external/flyio/flyio-client.ts` — REST client for Machines API
- `infrastructure/external/flyio/flyio-types.ts` — request/response types
- `infrastructure/repositories/heartbeat-run-repository.ts`
- `infrastructure/repositories/heartbeat-run-event-repository.ts`
- `infrastructure/repositories/company-vm-repository.ts`
- `infrastructure/repositories/agent-wakeup-repository.ts`
- `infrastructure/repositories/agent-runtime-state-repository.ts` (or add to agent repo)
<!-- Updated: Validation Session 1 - Deferred models from Phase 1 -->
- `infrastructure/persistence/models/agent-runtime-state-model.ts` — NEW (deferred from Phase 1)
- `infrastructure/persistence/models/agent-task-session-model.ts` — NEW (deferred from Phase 1)
- `infrastructure/persistence/models/agent-wakeup-request-model.ts` — NEW (deferred from Phase 1)
- `infrastructure/persistence/models/heartbeat-run-event-model.ts` — NEW (deferred from Phase 1)
- `infrastructure/persistence/migrations/{timestamp}-add-heartbeat-execution-models.ts` — NEW migration

### Presentation
- `presentation/controllers/impl/board/board-heartbeat-controller.ts` — list runs, get run, cancel
- `presentation/controllers/impl/board/board-vm-controller.ts` — vm status, wake, hibernate

### Module
- `module/scheduler-module.ts` — @nestjs/schedule + tick job + reaper job

## Implementation Steps

1. **Flyio client**
   - REST wrapper for `https://api.machines.dev/v1/apps/{appId}/machines`
   - Methods: createMachine, startMachine, stopMachine, destroyMachine, getMachine
   - Auth: `Authorization: Bearer ${FLY_API_TOKEN}`
   - Types: CreateMachineRequest, MachineResponse, MachineConfig

2. **Provisioner service**
   - `ensureVm(companyId)`: check companyVms table → if running, return; if stopped, start; if none, create
   - `hibernateVm(companyId)`: stop machine, update status
   - `destroyVm(companyId)`: destroy machine, delete record
   - Update companyVm record on each transition
   - Inject env vars at machine creation: CONTROL_PLANE_URL, COMPANY_ID, API keys

3. **Execution engine service**
   - `execute(request: IExecutionRequest): AsyncIterable<IExecutionEvent>`
   - HTTP POST to `http://{vm-ip}:3200/execute` with request body
   - Parse SSE response: split on `\n\n`, parse `event:` and `data:` fields
   - Yield IExecutionEvent for each parsed SSE message
   - Handle connection errors, timeouts
   - `cancel(vmIp, runId)`: POST to `/cancel`

4. **Heartbeat context query**
   - GetHeartbeatContextHandler: assemble full context for agent execution
   - Includes: agent config, assigned issues, recent comments, org tree, goal context
   - Returns IExecutionRequest-ready payload

5. **InvokeHeartbeatHandler (THE orchestrator)**
   - Step 1: Load agent, validate status=active, check budget
   - Step 2: Load company API key via apiKeyVaultService.retrieve() (decrypt)
   - Step 3: commandBus.execute(new EnsureVmCommand(companyId))
   - Step 4: Create HeartbeatRun record (status: queued)
   - Step 5: agentJwtService.sign(agentId, companyId, runId)
   - Step 6: queryBus.execute(new GetHeartbeatContextQuery(agentId))
   - Step 7: executionEngine.execute(request) → SSE stream
   - Step 8: For each event → insert RunEvent + publish to Redis
   - Step 9: On complete → RecordCostEvent, update runtimeState, update spend
   - Step 10: Schedule hibernateVm after idle timeout
   - Handle errors at each step: mark run failed, log, publish event

6. **Wakeup agent handler**
   - Insert into agentWakeupRequests with source + timestamp
   - Coalesce: if pending wakeup exists within 30s window, skip
   - Dispatch InvokeHeartbeatCommand for oldest pending wakeup

7. **Cancel run handler**
   - POST /cancel to executor VM
   - Update run status to cancelled
   - Release any checked-out issues

8. **Reap orphaned runs**
   - Query: runs WHERE status='running' AND startedAt < NOW() - 10 min AND no recent events
   - Mark as timed_out
   - Release checked-out issues
   - Publish HeartbeatRunCompletedEvent

9. **Domain events**
   - AgentStatusChangedEvent: published on pause/resume/terminate/error
   - HeartbeatRunCompletedEvent: triggers runtime state update + cost recording
   - BudgetExceededEvent: auto-pauses agent

10. **Scheduler module**
    - tick() cron: runs every 30s, finds agents with heartbeatEnabled + due for heartbeat
    - pg advisory lock: `SELECT pg_try_advisory_lock(hashtext('heartbeat-tick'))` before tick
    - reaper cron: runs every 30s, dispatches ReapOrphanedRunsCommand
    - Both skip if lock not acquired

11. **Controllers**
    - BoardHeartbeatController: GET /runs, GET /runs/:rid, GET /runs/:rid/events, POST /runs/:rid/cancel
    - BoardVmController: GET /vm, POST /vm/wake, POST /vm/hibernate

## Todo List
- [ ] Flyio client (REST wrapper)
- [ ] Flyio types
- [ ] FlyioProvisionerService (ensure/hibernate/destroy)
- [ ] CompanyVm repository
- [ ] ExecutionEngineService (HTTP POST + SSE parse)
- [ ] HeartbeatRun repository
- [ ] HeartbeatRunEvent repository
- [ ] AgentWakeupRequest repository
- [ ] GetHeartbeatContextQuery + handler
- [ ] InvokeHeartbeatHandler (10-step orchestrator)
- [ ] WakeupAgentHandler (coalescing)
- [ ] CancelRunHandler
- [ ] ReapOrphanedRunsHandler
- [ ] Domain events (3 events + 3 handlers)
- [ ] Scheduler module (tick + reaper + pg advisory lock)
- [ ] Board heartbeat controller + DTOs
- [ ] Board VM controller + DTOs
- [ ] Integration test: heartbeat invocation (mock VM)
- [ ] Integration test: orphan reaper

## Success Criteria
- InvokeHeartbeat: creates run → calls VM → persists events → records cost
- VM provisioner: creates Fly.io machine on first call, reuses on subsequent
- SSE parser correctly yields events from chunked HTTP response
- Wakeup coalescing: 3 rapid wakeups → 1 heartbeat invocation
- Orphan reaper: marks stale runs as timed_out
- Scheduler: only one instance executes tick (pg advisory lock)
- Budget exceeded: auto-pauses agent

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| SSE parsing edge cases | High | High | Test with chunked responses, partial lines, reconnection |
| Fly.io API rate limits | Medium | Medium | Add retry with backoff, cache machine status |
| pg advisory lock contention | Low | Low | Lock is non-blocking (try_advisory_lock) |
| 10-step handler too large | High | Medium | Extract steps into private methods, keep handler as coordinator |

## Security Considerations
- API keys decrypted in memory only, never logged
- Agent JWT scoped to single run (runId in payload)
- VM env vars injected at boot, not persisted to disk
- FLY_API_TOKEN stored as env var, never in DB
- Run events may contain sensitive output — scope access by companyId

## Next Steps
- Phase 5: Claude adapter implements the executor that this engine calls
- Phase 7: Live events from this engine stream to WebSocket
- Phase 8: Cost recording feeds into cost tracking
