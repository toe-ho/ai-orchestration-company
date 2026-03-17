# Phase 7: Real-time Events — Implementation Report

**Date:** 2026-03-17
**Status:** Completed

---

## Files Created

### Backend
| File | Lines | Purpose |
|------|-------|---------|
| `apps/backend/src/application/services/interface/i-company-event-publisher.ts` | 14 | `ICompanyEventPublisher` interface + `CompanyEvent` type + `COMPANY_EVENT_PUBLISHER` token |
| `apps/backend/src/application/services/impl/redis-company-event-publisher.ts` | 31 | Publishes to Redis channel `company:{companyId}` |
| `apps/backend/src/presentation/gateways/live-events-gateway.ts` | 155 | WebSocket gateway — bridges Redis pub/sub to Socket.io rooms, lazy per-company subscriber lifecycle |
| `apps/backend/src/module/realtime-module.ts` | 17 | `@Global()` NestJS module registering gateway + publisher |

### Frontend
| File | Lines | Purpose |
|------|-------|---------|
| `apps/web/src/lib/websocket-client.ts` | 34 | Singleton `getSocket(companyId)` / `disconnectSocket(companyId)` factory |
| `apps/web/src/hooks/use-websocket.ts` | 55 | Low-level hook: connects socket, tracks `connected` + `lastEvent`, cleans up on unmount |
| `apps/web/src/hooks/use-live-events.ts` | 72 | High-level hook: listens to typed events, invalidates React Query caches, appends run events |

---

## Files Modified

| File | Change |
|------|--------|
| `apps/backend/src/application/commands/agent/pause-agent-command.ts` | Inject `COMPANY_EVENT_PUBLISHER`, publish `agent.status_changed` (paused) |
| `apps/backend/src/application/commands/agent/resume-agent-command.ts` | Inject `COMPANY_EVENT_PUBLISHER`, publish `agent.status_changed` (active) |
| `apps/backend/src/application/commands/issue/checkout-issue-command.ts` | Inject `COMPANY_EVENT_PUBLISHER`, publish `issue.checked_out` |
| `apps/backend/src/application/commands/issue/update-issue-command.ts` | Inject `COMPANY_EVENT_PUBLISHER`, publish `issue.updated` |
| `apps/backend/src/application/events/handlers/on-heartbeat-completed.ts` | Inject `COMPANY_EVENT_PUBLISHER`, publish `heartbeat.run.completed` |
| `apps/backend/src/app.module.ts` | Import `RealtimeModule` before `SharedModule` |
| `apps/web/src/components/layout/app-shell.tsx` | Call `useLiveEvents()` at top level |
| `apps/web/src/components/runs/run-event-stream.tsx` | Remove `refetchInterval: 5_000` — WebSocket handles live updates |

---

## Dependencies Added

**Backend** (`apps/backend`):
- `@nestjs/websockets@10.4.22` — NestJS WebSocket decorators (v10 to match existing NestJS)
- `@nestjs/platform-socket.io@10.4.22` — Socket.io adapter for NestJS
- `socket.io` — WebSocket server

**Frontend** (`apps/web`):
- `socket.io-client` — WebSocket client

---

## Architecture Notes

- `RealtimeModule` is `@Global()` so `COMPANY_EVENT_PUBLISHER` token is available to all handlers in `SharedModule` and `ExecutionModule` without explicit imports
- `LiveEventsGateway` uses lazy per-company Redis subscribers: subscribes on first client connection, unsubscribes when last client leaves — avoids unnecessary Redis connections
- `psubscribe('live:{companyId}:*')` captures all run events (forwarded as `heartbeat.run.event`)
- `subscribe('company:{companyId}')` captures company-level events (forwarded using `event.type` as socket event name)
- Frontend `use-live-events` obtains the socket directly via `getSocket()` to bind typed event listeners, while `use-websocket` manages connection lifecycle

---

## Compile / Build Status

- Backend `tsc --noEmit`: **PASS** (0 errors)
- Frontend `tsc --noEmit`: **PASS** (0 errors)
- Tests: no test files exist in either app — no regressions

---

## Deviations from Plan

- None. All steps implemented as specified.

---

## Unresolved Questions

- None.
