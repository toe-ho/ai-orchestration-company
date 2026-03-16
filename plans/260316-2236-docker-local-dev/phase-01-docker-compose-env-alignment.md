---
# Context Links
- Parent plan: [plan.md](./plan.md)
- Backend env: `apps/backend/.env.example`
- Web env: `apps/web/.env.example`
---

# Phase 01 — Docker Compose + .env Alignment

## Overview

- **Date:** 2026-03-16
- **Priority:** P2
- **Status:** complete
- **Description:** Create `docker-compose.yml` at repo root with PostgreSQL 16 + Redis 7. Align `.env.example` credentials with compose service definitions.

## Key Insights

- Backend already has `DATABASE_URL=postgres://user:password@localhost:5432/aicompany` and `REDIS_URL=redis://localhost:6379` in `.env.example`
- Docker services will expose on the same localhost ports — no URL changes needed in apps
- Use simple dev credentials (`aicompany/aicompany/aicompany`) — documented as local-only
- Named volumes ensure data survives `docker compose restart`
- Healthchecks prevent race conditions when apps start before DB is ready

## Requirements

- PostgreSQL 16 on port 5432, DB `aicompany`, user `aicompany`, password `aicompany`
- Redis 7 on port 6379, no auth (local dev)
- Named volumes: `postgres_data`, `redis_data`
- Healthchecks on both services
- Single network (default bridge is fine; explicit `aicompany-net` for clarity)
- Root-level `.env.example` with compose-specific vars (POSTGRES_PASSWORD etc.) — optional, keep minimal

## Architecture

```
docker-compose.yml (repo root)
├── service: postgres
│   ├── image: postgres:16-alpine
│   ├── port: 5432:5432
│   ├── volume: postgres_data
│   └── healthcheck: pg_isready
└── service: redis
    ├── image: redis:7-alpine
    ├── port: 6379:6379
    ├── volume: redis_data
    └── healthcheck: redis-cli ping
```

Apps connect via `localhost` (not service names) since they run outside Docker.

## Related Code Files

**Create:**
- `docker-compose.yml` — repo root

**Update:**
- `apps/backend/.env.example` — align DB credentials to match compose defaults
- `README.md` — add "Local Dev Setup" section with `docker compose up -d` instructions

**No changes needed:**
- `apps/web/.env.example` — no infra deps
- Any app source files

## Implementation Steps

1. **Create `docker-compose.yml`** at repo root:
   - postgres:16-alpine with env vars, volume mount, healthcheck
   - redis:7-alpine with volume mount, healthcheck
   - Named volumes block at bottom

2. **Update `apps/backend/.env.example`**:
   - Change `DATABASE_URL` to use new credentials: `postgres://aicompany:aicompany@localhost:5432/aicompany`
   - `REDIS_URL` stays `redis://localhost:6379` (no change needed)

3. **Update `README.md`**:
   - Add "Prerequisites" section (Docker Desktop / Docker Engine)
   - Add "Start local infra" step: `docker compose up -d`
   - Add "Stop infra" step: `docker compose down`

## Todo List

- [ ] Create `docker-compose.yml`
- [ ] Update `apps/backend/.env.example` DB credentials
- [ ] Update `README.md` with local dev setup instructions

## Success Criteria

- `docker compose up -d` starts both services with no errors
- `docker compose ps` shows both healthy
- Backend connects to PostgreSQL and Redis with values from `.env.example`
- `docker compose down && docker compose up -d` retains DB data (volume persists)

## Risk Assessment

- **Port conflicts**: 5432 or 6379 already in use locally → document in README, use non-standard ports if needed (e.g. 5433)
- **Credential drift**: `.env.example` must stay in sync with compose env vars → mitigated by single source of truth in this phase

## Security Considerations

- Credentials are dev-only, never committed in `.env` (gitignored)
- No Redis auth for local dev — acceptable, Redis not exposed beyond localhost
- Document: never use these credentials in staging/production

## Next Steps

- Phase 4 (Heartbeat + Execution Engine) can now rely on local Redis being available
- Future: add `adminer` or `redis-commander` service for DB UI (YAGNI for now)
