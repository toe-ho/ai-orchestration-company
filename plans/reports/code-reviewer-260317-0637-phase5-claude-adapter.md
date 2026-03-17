# Code Review: Phase 5 — Claude Adapter + Executor App

**Date:** 2026-03-17
**Reviewer:** code-reviewer agent
**Score: 7.8 / 10**

---

## Scope

- Files reviewed: 11
- Total LOC: 748
- Packages: `@aicompany/adapters` (claude/), `@aicompany/adapter-utils`, `apps/executor`
- TypeCheck: PASS (both packages, zero errors)
- File size: All files under 200 lines — compliant

---

## Overall Assessment

Solid, clean Phase 5 delivery. The SSE streaming pipeline, env allowlist, process lifecycle, and JWT auth are all correctly structured. TypeScript is clean. No magic numbers hardcoded in hot paths. Two medium-severity issues (SIGKILL timer leak on normal exit, missing agentId ownership check in cancel route) and one low-severity concern (JWT runId cross-check) need attention. No critical security vulnerabilities.

---

## Critical Issues

None.

---

## High Priority

### 1. `spawnWithTimeout` leaks parent `process.env` into child processes

**File:** `packages/adapter-utils/src/process-helpers.ts` line 45

```ts
env: { ...process.env, ...opts.env },
```

`spawnWithTimeout` is called only from `health()` with `env: {}`, which means it still inherits the full parent env including secrets. The `health()` call passes an empty env object and expects it to be isolated, but the spread merges it on top of the full parent env.

The `spawnStreaming` path is correctly isolated because `ClaudeAdapter.execute()` calls `cleanEnv()` first and passes the cleaned result. But `spawnWithTimeout` spreads `process.env` unconditionally.

**Impact:** Minor in current use (`health()` only runs `claude --version`) but a footgun for any future caller who passes `env: {}` expecting full isolation.

**Fix:** Replace with `env: opts.env` (no parent spread), matching `spawnStreaming`'s approach. Callers that need parent env must opt-in explicitly.

---

## Medium Priority

### 2. SIGKILL escalation timer is never cleared on normal process exit

**File:** `packages/adapter-utils/src/process-helpers.ts` lines 152–154

```ts
setTimeout(() => {
  try { process.kill(-pid, 'SIGKILL'); } catch { /* already dead */ }
}, 5000);
```

When `cancel()` is called and the process exits cleanly within 5 seconds, the SIGKILL `setTimeout` still fires. While `kill()` throws and is swallowed, this creates a lingering timer that holds the event loop open unnecessarily and could interfere with test teardown or clean shutdowns.

**Fix:** Return the SIGKILL timer handle from `killTree()` so callers can clear it, or capture it in `cancel()` and clear on the `done` promise resolution.

---

### 3. Cancel route does not enforce agentId ownership

**File:** `apps/executor/src/routes/cancel-route.ts` lines 13–34

The route validates the JWT (authentication) but never checks that the requesting `agentId` matches `run.agentId`. Any authenticated agent can cancel any other agent's run by supplying its `runId`.

```ts
validateAgentJwt(token);  // agentId extracted but never used
const run = executionManager.get(body.runId);
// no check: payload.agentId === run.agentId
```

**Fix:** Extract the payload from `validateAgentJwt` and assert `payload.agentId === run.agentId` before calling `run.cancel()`. Return 403 on mismatch.

---

### 4. No graceful shutdown — active runs orphaned on SIGTERM

**File:** `apps/executor/src/main.ts`

There is no `SIGTERM`/`SIGINT` handler. When the container receives a stop signal, all active spawned `claude` child processes are orphaned (the parent dies before sending SIGTERM to children). `executionManager.cancelAll()` is never called on shutdown.

**Fix:** Add a shutdown handler:
```ts
const shutdown = async () => {
  executionManager.cancelAll();
  await app.close();
  process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
```

---

## Low Priority

### 5. JWT `runId` not cross-validated against body `runId`

**File:** `apps/executor/src/routes/execute-route.ts`

The JWT payload contains a `runId` field (validated in `auth-validator.ts`) but the execute route never checks that `payload.runId === request.runId`. An agent could present a JWT for run `A` but submit a request body with `runId: B`, causing the execution to be registered under the wrong runId.

**Fix:** After JWT validation, assert `payload.runId === request.runId`; return 400/403 on mismatch.

---

### 6. `activeCancels` and `executionManager` are separate maps (potential drift)

**File:** `packages/adapters/src/claude/claude-adapter.ts` line 12; `apps/executor/src/services/execution-manager.ts`

The adapter maintains its own `activeCancels` map, while the executor maintains `executionManager`. If `executionManager.remove()` is called (e.g., via cancel route) the adapter's `activeCancels` map still holds the entry until the `finally` block runs. This is mostly benign but means `adapter.cancel()` could be called twice — once via the cancel route (which removes from executionManager), and once via the timeout. The `cancel()` implementation handles this safely (checks map presence), so no bug, but the two-map pattern is worth consolidating in a future refactor.

---

### 7. `agentId`/`taskId` used as path components without sanitization

**File:** `packages/adapters/src/claude/claude-session-manager.ts` lines 18–19

`agentId` and `taskId` are concatenated into filesystem paths via `path.join()`. If either contains `..` or absolute path segments, directory traversal is possible. In the current trust model (agentId comes from JWT, taskId from contextJson), this is low risk but not zero.

**Fix:** Validate that both values are safe identifiers (e.g., `/^[a-zA-Z0-9_-]+$/`) before constructing the path.

---

### 8. `contextJson['taskId']` cast is unvalidated

**File:** `packages/adapters/src/claude/claude-adapter.ts` line 23

```ts
const taskId = (contextJson['taskId'] as string | undefined) ?? 'default';
```

If `contextJson['taskId']` is present but is not a string (e.g., a number), the as-cast silently accepts it and `path.join()` will coerce it. Minor robustness issue.

---

## Edge Cases Found by Scout

- Double-cancel: timeout fires and cancel route fires concurrently. Safe — `activeCancels` map check prevents double-invoke, `killTree` swallows `SIGTERM` errors on dead PID.
- Connection drop mid-stream: `reply.raw.write()` can throw if client disconnects; the `try/catch` in the finally-adjacent error handler catches this. The outer `for await` will throw on a broken pipe, caught by the `catch (err)` block. Handled correctly.
- Large prompt writes: `fs.writeFile` to `/tmp` is synchronous in spirit (awaited). If `/tmp` fills up, `writeFile` will reject and bubble out of `execute()` before SSE headers are sent — the route's try/catch will catch it but will attempt to write an error event after `writeHead(200)` was already called. Not a crash, but the client will see a `200` with an error SSE frame — acceptable behavior.
- Line queue memory growth: if the readline produces lines faster than the async iterator consumes them, `lineQueue` (plain array with `shift()`) grows unboundedly. Under normal Claude CLI output this is fine, but worth noting for adversarial/malformed output.

---

## Positive Observations

- Allowlist-based `cleanEnv` is the right approach — tight and auditable.
- `finally` block in `execute()` guarantees temp file cleanup even on exceptions.
- `spawnStreaming` correctly sets `detached: false`, preventing process group detachment.
- `killTree` uses negative PID (`-pid`) for process group kill — correct for container environments.
- JWT validation properly checks `TokenExpiredError` vs `JsonWebTokenError` separately.
- SSE headers include `X-Accel-Buffering: no` — necessary for nginx proxied deployments.
- All files well under 200 LOC; clean single-responsibility modules.
- TypeScript strict mode passes with zero errors.
- `cleanOldSessions` gracefully handles missing directories without throwing.

---

## Recommended Actions

| Priority | Issue | Action |
|---|---|---|
| High | `spawnWithTimeout` env leak | Remove `...process.env` spread on line 45 |
| Medium | SIGKILL timer never cleared | Return timer handle from `killTree`, clear on `done` |
| Medium | Cancel route no ownership check | Assert `payload.agentId === run.agentId`, return 403 |
| Medium | No graceful shutdown | Add SIGTERM/SIGINT handler calling `cancelAll()` |
| Low | JWT runId not cross-checked | Assert `payload.runId === request.runId` in execute route |
| Low | Path traversal in session manager | Sanitize `agentId`/`taskId` before path construction |

---

## Metrics

| Metric | Value |
|---|---|
| Files reviewed | 11 |
| Total LOC | 748 |
| Largest file | process-helpers.ts (158 lines) |
| Type errors | 0 |
| Critical issues | 0 |
| High issues | 1 |
| Medium issues | 3 |
| Low issues | 3 |

---

## Unresolved Questions

1. Should the executor support >1 concurrent run per agent in future phases? The current `getByAgent()` returns first match (O(n) scan); if concurrency limit is raised, a `Set<runId>` per agentId would be needed.
2. Is `--resume` flag stable in the Claude CLI? If `existingSession` contains a stale/invalid session ID, the CLI may error out. Is there a fallback strategy (retry without `--resume`)?
3. Is `AGENT_JWT_SECRET` rotated? If so, is there a grace-period for in-flight tokens during rotation?
