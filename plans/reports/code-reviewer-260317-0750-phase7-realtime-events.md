# Code Review: Phase 7 Real-time Events Implementation

**Date:** 2026-03-17
**Reviewer:** code-reviewer agent
**Score: 7.5 / 10**

---

## Scope

| # | File | LOC |
|---|------|-----|
| 1 | `i-company-event-publisher.ts` | 13 |
| 2 | `redis-company-event-publisher.ts` | 30 |
| 3 | `live-events-gateway.ts` | 151 |
| 4 | `realtime-module.ts` | 16 |
| 5 | `pause-agent-command.ts` | 34 |
| 6 | `resume-agent-command.ts` | 34 |
| 7 | `checkout-issue-command.ts` | 35 |
| 8 | `update-issue-command.ts` | 35 |
| 9 | `on-heartbeat-completed.ts` | 51 |
| 10 | `app.module.ts` | 36 |
| 11 | `websocket-client.ts` | 34 |
| 12 | `use-websocket.ts` | 57 |
| 13 | `use-live-events.ts` | 71 |
| 14 | `app-shell.tsx` | 22 |

**Total:** ~619 LOC across 14 files. All files are under 200 LOC — compliant.

---

## Overall Assessment

The implementation is clean, well-modularized, and follows the project's CQRS and multi-tenancy patterns. Redis pub/sub bridging to Socket.io rooms is a standard and appropriate approach. The frontend separation of concerns (connection management, event subscription, cache invalidation) is good. The main issues are a **critical security gap** (no JWT/session validation on WebSocket handshake), a **logic bug in `clients` tracking**, and a **CORS wildcard** left open.

---

## Critical Issues

### 1. No authentication on WebSocket handshake

**File:** `live-events-gateway.ts` line 60-72

The gateway accepts any connection that supplies a `companyId` in handshake auth — there is no verification that the connecting user actually belongs to that company. An unauthenticated client can pass an arbitrary `companyId` and receive all real-time events for that company.

The HTTP layer is protected by `BoardAuthGuard` (session cookie via Better Auth), but `BoardAuthGuard` only intercepts HTTP contexts. `ExecutionContext.switchToHttp()` returns nothing useful for WebSocket connections, so the global guard silently passes through WebSocket connections without checking.

Required fix: validate the session cookie / token in `handleConnection` before allowing `client.join(roomId)`. The `AuthService` is injectable — use it to resolve the session from `client.handshake.headers` and verify `session.companyId === handshake.auth.companyId`.

```typescript
// handleConnection — add before client.join()
const session = await this.authService.auth.api
  .getSession({ headers: fromNodeHeaders(client.handshake.headers) })
  .catch(() => null);
if (!session?.user?.companyId || session.user.companyId !== companyId) {
  client.disconnect();
  return;
}
```

**Severity: Critical — data isolation breach for all companies.**

### 2. CORS wildcard on WebSocket gateway

**File:** `live-events-gateway.ts` line 24

```typescript
@WebSocketGateway({ cors: { origin: '*' }, namespace: '/events' })
```

`origin: '*'` allows any website to open a WebSocket connection to the backend. Combined with the missing auth check above, this is exploitable cross-origin. Even with auth fixed, the allowed origins should be restricted to the frontend domain (via environment variable), matching the HTTP CORS policy.

**Severity: High.**

---

## High Priority

### 3. `clients` Set tracks `companyId` instead of `socketId`

**File:** `live-events-gateway.ts` line 96 and 126

```typescript
// line 96 — adds companyId to the Set, not the connecting socketId
this.subscriptions.get(companyId)!.clients.add(companyId);
// line 126 — initialises Set with companyId
{ clients: new Set([companyId]), subscriber }
```

The `CompanySubscription.clients` field is a `Set<string>` intended to track which socket IDs are subscribed per company, but it receives the `companyId` string instead of `client.id`. As a result:
- The set always has exactly one entry (the companyId), regardless of how many sockets join.
- The `clients` field is never actually used for teardown logic — teardown is driven by the Socket.io room size (`remainingClients`), so the bug does not cause incorrect teardown today.
- However, it wastes memory and is misleading. If teardown logic ever migrates to use this set, it will silently be wrong.

Either remove the `clients` field entirely (it is YAGNI given teardown uses the room adapter), or fix to `client.id`.

**Severity: High (logic bug, low immediate impact but misleading).**

### 4. Status mismatch in `resume-agent-command.ts`

**File:** `resume-agent-command.ts` lines 26-30

```typescript
const updated = await this.agentRepo.update(cmd.id, { status: 'idle' });
await this.publisher.publishCompanyEvent(cmd.companyId, {
  type: 'agent.status_changed',
  data: { agentId: cmd.id, status: 'active' },  // ← 'active' ≠ 'idle'
```

The DB write sets `status: 'idle'` but the published event broadcasts `status: 'active'`. Any UI or downstream consumer listening to `agent.status_changed` will show the wrong state, and cache invalidation in `use-live-events.ts` will refetch a stale value vs what was just broadcast.

Fix: align the event payload to match the persisted value (`'idle'`), or change both to `'active'` if that is the intended post-resume state.

**Severity: High (data integrity — UI shows wrong agent status).**

### 5. `updateIssue` publishes raw `Partial<IIssue>` as event data

**File:** `update-issue-command.ts` line 30

```typescript
data: { issueId: cmd.id, changes: cmd.partial as Record<string, unknown> },
```

`cmd.partial` is the full unvalidated partial from the HTTP body. If the controller passes user-controlled input directly to the command (no field allowlist), this event will broadcast any keys the user injected — including potentially internal fields like `companyId` or `createdAt`. Review the calling controller to confirm input is sanitized before the command is dispatched.

**Severity: High (potential data leakage in event stream).**

---

## Medium Priority

### 6. `use-live-events.ts` calls `getSocket()` directly, bypassing `useWebSocket`'s cleanup

**File:** `use-live-events.ts` lines 27-28

`useLiveEvents` calls `useWebSocket(companyId)` for connection management, but then immediately calls `getSocket(cid)` again to attach event listeners. Because `getSocket` creates a new entry in the singleton map if one does not exist, and `useWebSocket` manages teardown via `disconnectSocket`, this introduces a subtle ordering dependency: if `useWebSocket` cleanup fires before `useLiveEvents` cleanup, the socket reference may be stale or disconnected, but event listeners are not yet removed.

In practice, since both effects share the same `companyId` dependency and React runs effects in declaration order with cleanups in reverse order, this is unlikely to cause a real leak today. However, `useLiveEvents` should receive the socket reference from `useWebSocket` rather than calling `getSocket` directly, eliminating the coupling.

**Severity: Medium (architectural fragility, possible edge-case leak on StrictMode double-mount).**

### 7. `realtime-module.ts` — provider registered twice

**File:** `realtime-module.ts` lines 8-15

```typescript
providers: [
  LiveEventsGateway,
  { provide: COMPANY_EVENT_PUBLISHER, useClass: RedisCompanyEventPublisher },
],
exports: [
  { provide: COMPANY_EVENT_PUBLISHER, useClass: RedisCompanyEventPublisher },
],
```

The export token `{ provide: COMPANY_EVENT_PUBLISHER, useClass: RedisCompanyEventPublisher }` creates a new provider descriptor in the exports array. NestJS resolves exported tokens by the token string/symbol, so this works, but the `useClass` on the export is redundant — only the token needs to be re-exported. The correct form is `exports: [COMPANY_EVENT_PUBLISHER]`. The current form may cause NestJS to instantiate a second instance of `RedisCompanyEventPublisher` in some module resolution paths.

**Severity: Medium (potential double Redis connection).**

### 8. `on-heartbeat-completed.ts` — non-atomic read-modify-write on token counters

**File:** `on-heartbeat-completed.ts` lines 26-32

The handler reads existing cumulative token counts, then writes back the incremented value as two separate operations with no transaction or optimistic locking. If two heartbeat completions arrive for the same agent within the same millisecond (e.g., under load), both reads will see the pre-increment state and one increment will be silently lost.

This is acceptable for approximate billing telemetry but should be documented explicitly, or switched to an atomic DB increment (`UPDATE ... SET tokens = tokens + $1`).

**Severity: Medium (data accuracy).**

### 9. `websocket-client.ts` — stale socket reuse after explicit disconnect

**File:** `websocket-client.ts` lines 10-13

```typescript
const existing = sockets.get(companyId);
if (existing?.connected || existing?.active) return existing;
```

If `disconnectSocket` is called and then `getSocket` is called again before the old socket is garbage-collected (e.g., during React StrictMode double-mount or rapid companyId switches), the old socket object will still be in the map as `!connected && !active`, so a new one is created — but the old one remains in memory until the map entry is overwritten. The `disconnectSocket` already deletes the map entry, so this path should be unreachable in practice; however, the condition should be validated against ioredis `Socket` lifecycle states to confirm `active` covers the reconnecting state.

**Severity: Low-Medium (edge case).**

---

## Low Priority

### 10. `safeParseJson` returns `raw` string on parse failure instead of `null`

**File:** `live-events-gateway.ts` lines 143-150

On JSON parse failure, `safeParseJson` returns the raw string. The caller on line 115 passes this directly to `this.server.to(roomId).emit(...)`, which would broadcast an unexpected string payload to all room clients. Should return `null` and add a guard before emitting.

### 11. `use-websocket.ts` sets `connected` from `socket.connected` synchronously before `connect` event fires

**File:** `use-websocket.ts` line 32

```typescript
setConnected(socket.connected);
```

When the socket is newly created, `socket.connected` is `false` at this point. This is correct behavior, but on a re-render where the socket already exists and is connected (singleton from `getSocket`), the initial `setConnected(true)` on line 32 correctly captures current state before the first `connect` event. The pattern is acceptable but worth a comment.

### 12. No `onModuleInit` decorator on `LiveEventsGateway`

**File:** `live-events-gateway.ts` line 44

`onModuleInit` is defined as a plain method without `@OnModuleInit()` — NestJS does not require the decorator when the method name matches the lifecycle hook exactly, so this works. But for consistency with the `OnModuleDestroy` pattern, adding the decorator improves clarity.

---

## Positive Observations

- Clean interface/implementation separation for `ICompanyEventPublisher` — easy to swap for a different transport.
- `OnModuleDestroy` implemented in both `RedisCompanyEventPublisher` and `LiveEventsGateway` — Redis connections are properly cleaned up on shutdown.
- Lazy Redis subscriber creation per company (`ensureSubscription`) — no unnecessary connections when no clients are present.
- Proper teardown of Redis subscriber when last client leaves a room.
- Frontend cleanup is thorough: event listeners removed, `disconnectSocket` called on hook unmount.
- `use-live-events` uses `queryClient.invalidateQueries` with query-key constants from `query-keys.ts` — avoids hardcoded strings.
- All command handlers use `findByIdAndCompany` for multi-tenancy scoping before mutation — consistent with code standards.
- All files under 200 LOC, following project standards.

---

## Recommended Actions (Priority Order)

1. **[Critical]** Add session/JWT validation in `handleConnection` in `live-events-gateway.ts` — verify user owns the requested companyId via `AuthService` before `client.join()`.
2. **[Critical]** Restrict CORS `origin` from `'*'` to the frontend domain env var.
3. **[High]** Fix status mismatch in `resume-agent-command.ts` — align DB write and published event to same status value.
4. **[High]** Fix `clients` Set in `ensureSubscription` — pass `client.id` or remove the unused field.
5. **[High]** Audit `UpdateIssueCommand` caller to ensure `cmd.partial` is allowlisted before reaching the event publisher.
6. **[Medium]** Fix `realtime-module.ts` exports to use `exports: [COMPANY_EVENT_PUBLISHER]` token only.
7. **[Medium]** Refactor `use-live-events.ts` to accept socket from `useWebSocket` rather than calling `getSocket` directly.
8. **[Low]** Guard `safeParseJson` callers — skip emit on null result.
9. **[Low]** Document or fix non-atomic token accumulation in `on-heartbeat-completed.ts`.

---

## Metrics

| Metric | Value |
|--------|-------|
| Files reviewed | 14 |
| Total LOC | ~619 |
| Files over 200 LOC | 0 |
| Critical issues | 2 |
| High issues | 3 |
| Medium issues | 4 |
| Low issues | 3 |
| Security gaps | 2 (no WS auth, open CORS) |

---

## Unresolved Questions

1. Does the `BoardAuthGuard` skip WebSocket context by design, or was the WS path assumed to be covered? If agent actors also need WebSocket access, the auth check will need to handle both session cookies and agent API keys.
2. What is the intended post-resume agent status — `'idle'` or `'active'`? The inconsistency in `resume-agent-command.ts` needs a business-logic decision, not just a code fix.
3. Is the `clients` Set in `CompanySubscription` intended for future use (e.g., per-client rate limiting), or can it be removed per YAGNI?
4. Is `UpdateIssueCommand` called from a controller that applies a Zod allowlist before dispatching, or does it pass the raw request body?
