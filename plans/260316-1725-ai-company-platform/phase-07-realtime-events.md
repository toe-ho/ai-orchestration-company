# Phase 7: Real-time Events

## Context Links
- Parent: [plan.md](./plan.md)
- Dependencies: Phase 4 (events to stream), Phase 6 (frontend to receive)
- Docs: [12-api-architecture](../../docs/blueprint/03-architecture/12-api-architecture-nestjs.md), [17-api-design](../../docs/blueprint/04-data-and-api/17-api-design.md)
- Research: [researcher-02](./research/researcher-02-frontend-ai-system.md) — React Query + WebSocket

## Overview
- **Date:** 2026-03-16
- **Priority:** P2
- **Status:** pending
- **Review:** pending
- **Description:** Wire Redis pub/sub (Upstash) for backend event distribution, NestJS WebSocket gateway for client connections, frontend WebSocket hook that invalidates React Query caches on events.

## Key Insights
- Two-tier: Redis pub/sub fans events to all backend instances → WebSocket pushes to connected clients
- React Query invalidation (not direct cache set) is simpler and sufficient for most events
- Direct setQueryData only for high-frequency updates (run event streaming)
- WebSocket namespace by companyId: `ws://host/api/companies/:cid/events/ws`
- Events: agent.status_changed, issue.updated, heartbeat.run.started/completed, approval.created, cost.alert

## Requirements

### Functional
- **RedisLiveEventsService** — PUBLISH events to Redis channel per company
- **RealtimeGateway** — @WebSocketGateway, subscribe to Redis, push to connected clients
- **Frontend WebSocket hook** — connect, receive events, invalidate queries
- **Event types:** agent.status_changed, issue.updated, issue.checked_out, heartbeat.run.started, heartbeat.run.completed, heartbeat.run.event (transcript), approval.created, cost.alert
- **Run transcript streaming:** live event-by-event as agent executes

### Non-Functional
- Reconnection: automatic with exponential backoff
- Auth: validate session cookie on WebSocket handshake
- Memory: unsubscribe Redis channels when no clients connected
- Heartbeat ping/pong every 30s to detect dead connections

## Architecture

```
Backend Instance A                    Redis (Upstash)                Backend Instance B
       │                                    │                              │
  Event published                     PUBLISH                        SUBSCRIBE
  (heartbeat handler)  ──────────►  company:{cid}  ──────────►  RealtimeGateway
       │                                    │                              │
       │                                    │                         WebSocket push
       │                                    │                              │
       │                                    │                         Client browser
```

## Related Code Files

### Backend
- `application/services/interface/i-live-events-service.ts` — publish interface
- `application/services/impl/redis-live-events-service.ts` — Redis PUBLISH/SUBSCRIBE
- `infrastructure/external/redis/redis-module.ts` — Redis connection setup
- `infrastructure/external/redis/redis-client.ts` — ioredis wrapper
- `presentation/gateways/realtime-gateway.ts` — @WebSocketGateway
- `module/realtime-module.ts` — WebSocket + Redis pub/sub registration

### Frontend
- `src/hooks/use-websocket.ts` — WebSocket connection + reconnect
- `src/hooks/use-live-events.ts` — event listener + React Query invalidation
- `src/lib/websocket-client.ts` — WebSocket wrapper with reconnect logic

## Implementation Steps

1. **Redis client setup**
   - Install ioredis: `pnpm --filter @aicompany/backend add ioredis`
   - Create redis-client.ts: connect using REDIS_URL
   - Create redis-module.ts: provide RedisClient as injectable
   - Separate pub and sub clients (ioredis requires it for SUBSCRIBE)

2. **RedisLiveEventsService**
   - Implement ILiveEventsService interface
   - `publish(companyId, event)`: PUBLISH to channel `company:{companyId}`
   - Event payload: `{ type: string, data: any, timestamp: string }`
   - JSON.stringify before publish

3. **RealtimeGateway**
   - `@WebSocketGateway({ namespace: '/events', cors: true })`
   - handleConnection: validate session cookie, extract userId, join company room
   - handleDisconnect: leave room, cleanup
   - Subscribe to Redis channels for connected companies
   - On Redis message: broadcast to company room via `server.to(companyId).emit(event)`
   - Lazy subscribe: only subscribe to Redis channel when first client connects
   - Lazy unsubscribe: unsubscribe when last client disconnects

4. **Wire existing events to publish**
   - InvokeHeartbeatHandler: publish run.started, run.event (each SSE), run.completed
   - CheckoutIssueHandler: publish issue.checked_out
   - UpdateIssueHandler: publish issue.updated
   - PauseAgentHandler/ResumeAgentHandler: publish agent.status_changed
   - CreateApprovalHandler: publish approval.created
   - BudgetExceededEvent handler: publish cost.alert

5. **Frontend WebSocket client**
   - `websocket-client.ts`: connect to `ws://{host}/api/companies/{cid}/events/ws`
   - Auto-reconnect with exponential backoff (1s → 2s → 4s → 8s → max 30s)
   - Ping/pong handling
   - Connection state tracking

6. **useWebSocket hook**
   - Connects on mount with current companyId
   - Reconnects on companyId change
   - Disconnects on unmount
   - Exposes: connected, lastEvent, connectionState

7. **useLiveEvents hook**
   - Listens to WebSocket events
   - Maps event types to React Query invalidations:
     - `agent.status_changed` → invalidate `agents.list`, `agents.detail`
     - `issue.updated` → invalidate `issues.list`, `issues.detail`
     - `heartbeat.run.started` → invalidate `runs.list`
     - `heartbeat.run.completed` → invalidate `runs.list`, `runs.detail`, `dashboard`
     - `heartbeat.run.event` → append to run events cache via setQueryData
     - `cost.alert` → invalidate `costs`, `dashboard`
   - Mounts at AppShell level (always active when authenticated)

8. **Run transcript streaming**
   - Special handling for `heartbeat.run.event` — high frequency
   - Use setQueryData to append events (no refetch)
   - RunEventStream component: auto-scroll, new events highlighted
   - Buffer: batch UI updates every 100ms to avoid re-render storms

## Todo List
- [ ] Redis client + module (ioredis, pub/sub separation)
- [ ] RedisLiveEventsService (publish to company channel)
- [ ] RealtimeGateway (WebSocket + Redis subscribe)
- [ ] Wire heartbeat events to publish
- [ ] Wire issue/agent/approval events to publish
- [ ] Frontend: websocket-client.ts (connect, reconnect, ping)
- [ ] Frontend: useWebSocket hook
- [ ] Frontend: useLiveEvents hook (event → query invalidation)
- [ ] Run transcript streaming (setQueryData append)
- [ ] Test: event published → WebSocket received
- [ ] Test: reconnection after disconnect

## Success Criteria
- Agent status change on backend → dashboard updates within 1s
- Issue update → kanban board reflects change without refresh
- Run events stream live in run detail page
- WebSocket reconnects automatically after network drop
- No events leak between companies (channel isolation)
- Multiple browser tabs receive same events

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Redis pub/sub message loss | Low | Medium | Events are supplementary — UI can always refetch |
| WebSocket memory leak (no cleanup) | Medium | Medium | Strict disconnect handling, Redis unsubscribe on last client |
| Re-render storms from high-frequency events | Medium | Medium | Batch updates, throttle UI, use setQueryData |

## Security Considerations
- WebSocket handshake validates session cookie
- Company channel isolation: client can only join own companies
- No sensitive data in events (IDs only, client refetches full data)
- Rate limit: max 100 events/sec per channel

## Next Steps
- Phase 8: cost.alert events trigger UI notifications
- Future: typing indicators, presence (who's viewing what)
