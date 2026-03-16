# Code Review: Phase 4 Heartbeat Execution Engine

**Date:** 2026-03-16
**Scope:** Phase 4 — heartbeat lifecycle, SSE parsing, VM provisioner, pg advisory locks, DI modules
**Score: 7.5 / 10**

---

## Scope

| File | LOC | Status |
|------|-----|--------|
| `invoke-heartbeat-handler.ts` | 124 | OK |
| `execution-engine-service.ts` | 92 | OK |
| `flyio-provisioner-service.ts` | 72 | OK |
| `scheduler-service.ts` | 78 | OK |
| `execution-module.ts` | 62 | OK |
| `shared-module.ts` | 141 | OK |

All files within 200-line limit. Architecture is clean CQRS/DI — command handlers are thin, services encapsulate infra. Good layering overall.

---

## Overall Assessment

Solid Phase 4 implementation. The 10-step lifecycle is structurally correct. Error containment is mostly good. Several real bugs exist (untracked setTimeout, seq counter double-increment, cancel with empty VM URL) plus meaningful security and race condition concerns.

---

## Critical Issues

### 1. setTimeout fires after handler returns — untracked and never cancelled on error
**File:** `invoke-heartbeat-handler.ts` line 121

```ts
setTimeout(() => this.commandBus.execute(new HibernateVmCommand(run.companyId)), this.idleTimeoutMin * 60_000);
```

- The promise returned by `commandBus.execute` inside `setTimeout` is **fire-and-forget** — hibernation errors are silently swallowed.
- If another heartbeat starts for the same company within the idle window, the old timer still fires and hibernates the VM mid-execution.
- There is no handle to cancel the timer if `HibernateVmCommand` should not run (e.g., concurrent run started).
- **Impact:** VM hibernated while another run is in-flight → network failure → orphaned run.

Fix direction: use a per-company `Map<string, NodeJS.Timeout>` to track and replace timers, and `.catch(err => logger.error(...))` on the inner promise.

---

### 2. seq counter double-increment between SSE parser and caller
**File:** `execution-engine-service.ts` lines 8, 64–65 vs `invoke-heartbeat-handler.ts` line 110

`parseSseChunk` takes a `{ value: number }` ref and increments it (`seq.value++`). The caller in `invoke-heartbeat-handler.ts` also tracks its own `let seq = 0` and passes it to `eventRepo.insertEvent` as `seq: seq++`. These are **two independent counters** — the engine-internal seq and the handler seq will diverge as soon as any event is yielded.

Result: `heartbeat_run_events.seq` values are set from the handler-side counter which is unrelated to what the SSE parser assigned internally. The SSE-internal seq is simply thrown away. This is not a crash but the event log will have sequential integers from 0 regardless — so the parser's seq is YAGNI dead code.

Fix: remove the `seq` param from `parseSseChunk`; only track seq in the handler, which is the authoritative writer.

---

### 3. `cancel-run-command.ts` passes empty string as executor URL
**File:** `cancel-run-command.ts` line 30

```ts
await this.runner.cancel('', cmd.runId);
```

`ExecutionEngineService.cancel` uses the first param as `executorUrl`, with fallback to `this.executorUrl`. In production (`nodeEnv !== 'development'`), `this.executorUrl` is `''` (set to empty string on line 48 of `execution-engine-service.ts`), so the fallback is also empty, and `executorUrl` parameter is also empty. The cancel POST goes to `http://undefined:3200/cancel` or similar malformed URL — **cancel always silently fails in production**.

The run's VM URL should be read from the `HeartbeatRunModel.vmMachineId` or a stored executor URL to construct the cancel target.

---

## High Priority Issues

### 4. Run status not set to 'failed' when pre-run steps fail (Steps 1–3)
**File:** `invoke-heartbeat-handler.ts` lines 52–79

Steps 1–3 (`loadAndValidate`, `vault.retrieve`, `EnsureVmCommand`) execute **before** the run record is created (Step 4). If any of them throw, no run record exists to mark failed — the error just propagates to the scheduler's `.catch`. That's acceptable. But the run is created with `status: 'queued'` in Step 4, then `try/catch` wraps only Steps 5–9.

If `agentJwt` signing or the `queryBus` context query fails (Steps 5–6), the run record exists but the outer catch on line 76 correctly sets it to `'failed'`. This part is fine.

However: if `this.runRepo.update(run.id, { status: 'failed', ... })` itself throws (line 78), the error propagates upward unhandled to the scheduler. The scheduler's `.catch` only logs it. The run record stays in `'queued'` forever. The orphan reaper will eventually time it out (10 min) but this is a silent data inconsistency.

### 5. `ensureVm` has a TOCTOU race for concurrent heartbeats for the same company
**File:** `flyio-provisioner-service.ts` lines 25–53

```ts
const existing = await this.vmRepo.findByCompanyId(companyId);
if (existing?.status === VmStatus.Running) return existing;
// ... create machine
```

Two concurrent heartbeats for the same company can both read `existing` as `null` (first run) and both attempt `client.createMachine(...)`, resulting in two Fly.io machines for one company. There is no DB-level upsert guard or advisory lock protecting this critical section.

The scheduler dispatches all agents with `.catch()` in a fire-and-forget loop, so concurrent execution is real.

Fix: use `INSERT ... ON CONFLICT DO NOTHING` / optimistic lock, or a per-company pg advisory lock around `ensureVm`.

### 6. `runtimeStateRepo.upsert` accumulates tokens **additively but not cumulatively**
**File:** `on-heartbeat-completed.ts` lines 22–26

```ts
await this.runtimeStateRepo.upsert(event.agentId, event.companyId, {
  cumulativeInputTokens: event.inputTokens,    // ← THIS run's tokens, not total
  ...
});
```

The field is named `cumulativeInputTokens` but the value passed is per-run tokens (not previous + this run). Whether this is wrong depends on whether `upsert` does `SET col = col + $value` or `SET col = $value`. Without seeing `AgentRuntimeStateRepository.upsert`, this is a data integrity risk if it does `SET`.

### 7. `adapterConfig` cast is unsafe
**File:** `invoke-heartbeat-handler.ts` line 104

```ts
timeoutSec: (agent.adapterConfig['timeoutSec'] as number) ?? 600,
```

If `adapterConfig['timeoutSec']` is `null`, `0`, or `false` (all falsy), the `??` will not kick in (only guards against `null`/`undefined`). A `0` value would send a 0-second timeout to `AbortSignal.timeout(0)`, aborting immediately. Should be:

```ts
timeoutSec: (typeof agent.adapterConfig['timeoutSec'] === 'number' && agent.adapterConfig['timeoutSec'] > 0)
  ? agent.adapterConfig['timeoutSec'] : 600,
```

---

## Medium Priority Issues

### 8. pg advisory lock held across full heartbeat batch — blocks all other instances
**File:** `scheduler-service.ts` lines 24–38

The tick acquires the advisory lock, dispatches all agents **fire-and-forget**, then immediately releases the lock in `finally`. This is actually correct — the lock prevents a second instance from picking up the same agents in the same tick. Good. However, the `findAgentsDueForHeartbeat` query does not update `last_heartbeat_at` — so the next tick (30s later) will pick up the same agents again if the run hasn't finished and updated the field. Confirm `last_heartbeat_at` is updated after run completion.

### 9. `parseSseChunk` splits on `\n\n` but SSE spec allows `\r\n\r\n`
**File:** `execution-engine-service.ts` line 9

SSE per RFC 8895 uses `\r\n` as line terminator. If the executor sends `\r\n\r\n` delimited events, the split on `\n\n` will fail and events accumulate in the buffer forever. Low risk if executor is controlled, but worth a comment.

### 10. SSE `data:` multiline concatenation is broken
**File:** `execution-engine-service.ts` lines 16–17

```ts
else if (line.startsWith('data:')) dataStr += line.slice(5).trim();
```

SSE multiline data fields are newline-joined: `data: line1\ndata: line2` should become `line1\nline2`. This code concatenates them without a separator: `line1line2`. For the current executor where data is single-line JSON, this is benign, but if payload is ever split across multiple `data:` lines, JSON.parse will fail silently (caught and skipped).

### 11. `GetHeartbeatContextQuery` loads all company goals — unbounded query
**File:** `get-heartbeat-context-query.ts` line 36

```ts
this.goalRepo.findAllByCompany(query.companyId),
```

No pagination or limit. Large companies with many goals will send an unbounded payload to the executor VM and may hit memory pressure. Should have a reasonable cap (e.g., top 50 active goals).

### 12. `shared-module.ts` exports all command handlers globally
**File:** `shared-module.ts` line 139

```ts
exports: [...REPOSITORY_PROVIDERS, ...COMMAND_HANDLERS, ...QUERY_HANDLERS, TypeOrmModule],
```

Command/query handlers don't need to be exported from a `@Global()` module — they are registered with NestJS CQRS bus automatically. Exporting them leaks internals and inflates the global provider scope unnecessarily (KISS violation). Only `REPOSITORY_PROVIDERS` and `TypeOrmModule` need to be exported.

---

## Low Priority Issues

### 13. Error messages expose internal agent IDs at `logger.error`
**File:** `invoke-heartbeat-handler.ts` line 77

```ts
this.logger.error(`Heartbeat run ${run.id} failed: ${err}`);
```

`${err}` on an `Error` object includes the message, stack trace, and potentially any context interpolated into the error (including upstream API responses from Fly.io that include machine config). Consider `err instanceof Error ? err.message : String(err)` to avoid logging raw stack traces at `error` level in production.

### 14. `findAgentsDueForHeartbeat` uses raw string SQL values
**File:** `scheduler-service.ts` lines 59–64

```ts
.where(`a.status = 'active'`)
```

The string `'active'` is a hardcoded literal. If the enum ever changes or a typo occurs, there is no compile-time catch. Prefer TypeORM's `.where('a.status = :status', { status: 'active' })` pattern for consistency.

### 15. `WakeupAgentHandler` marks request processed only after heartbeat completes
**File:** `wakeup-agent-command.ts` lines 42–43

```ts
await this.commandBus.execute(new InvokeHeartbeatCommand(...));
await this.wakeupRepo.markProcessed(request.id);
```

If `InvokeHeartbeatCommand` throws, `markProcessed` is never called and the wakeup request stays pending — the 30s coalesce window check on line 29 will find it and suppress the next legitimate wakeup. The request should be marked processed in a `finally` block.

---

## Positive Observations

- JWT is scoped to `{ agentId, companyId, runId }` — correctly prevents cross-run token reuse.
- API key retrieved via vault (encrypted at rest, `decrypt` on retrieval) — never logged.
- `request.envVars` uses `ADAPTER_API_KEY` key so the key name is not the raw provider key name.
- Advisory lock pattern is correct for multi-instance deployment: `pg_try_advisory_lock` is non-blocking, released in `finally`.
- Orphan reaper checks `lastEvent > cutoff` before reaping — avoids false positives on slow-but-alive runs.
- SSE buffer boundary handling (`lastIndexOf('\n\n')`) is correct: avoids partial message processing.
- File sizes all well within 200-line limit.
- `CancelRunHandler` swallows VM signal failures gracefully and still marks DB status cancelled — correct.

---

## Recommended Actions (Priority Order)

1. **[Critical]** Fix `setTimeout` hibernation timer — track per-company, replace on new run, add `.catch` logging.
2. **[Critical]** Fix cancel URL — store and retrieve executor VM URL from `HeartbeatRunModel` or resolve from `CompanyVmModel`.
3. **[Critical]** Fix `ensureVm` TOCTOU — add optimistic lock or pg advisory lock around VM creation path.
4. **[High]** Remove dead `seq` param from `parseSseChunk` — handler is the single seq authority.
5. **[High]** Verify `runtimeStateRepo.upsert` accumulates correctly (increments, not overwrites).
6. **[High]** Guard `timeoutSec` extraction with proper numeric check, not just `??`.
7. **[Medium]** Fix `WakeupAgentHandler.markProcessed` to run in `finally`.
8. **[Medium]** Add limit/cap to `goalRepo.findAllByCompany` in context query.
9. **[Medium]** Remove command/query handlers from `SharedModule` exports.
10. **[Low]** Add `\r\n` support or comment in SSE parser; fix multiline `data:` concatenation.

---

## Metrics

| Metric | Value |
|--------|-------|
| Files reviewed | 6 primary + 10 supporting |
| Total LOC | ~700 |
| Files over 200 lines | 0 |
| Critical issues | 3 |
| High issues | 4 |
| Medium issues | 4 |
| Low issues | 3 |
| Security concerns | 0 (API key, JWT: clean) |

---

## Unresolved Questions

1. Does `AgentRuntimeStateRepository.upsert` do SQL `SET col = col + $delta` or `SET col = $value`? This determines if issue #6 is a real bug.
2. Does `last_heartbeat_at` get updated after `HeartbeatRunCompletedEvent` is handled? If not, the scheduler will dispatch the same agent every 30s regardless of run duration.
3. Is the executor VM URL always derivable from the `CompanyVm` record at cancel time, or is it ephemeral per-run?
