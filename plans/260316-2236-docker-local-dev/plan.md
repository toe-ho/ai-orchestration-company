---
title: "Docker Compose Local Dev Infrastructure"
description: "Add docker-compose.yml for PostgreSQL 16 + Redis 7 local dev infra; apps still run natively via turbo dev"
status: complete
priority: P2
effort: 1h
branch: main
tags: [docker, postgres, redis, local-dev, devex]
created: 2026-03-16
---

# Docker Compose Local Dev Infrastructure

## Context

- Parent platform plan: [plans/260316-1725-ai-company-platform/plan.md](../260316-1725-ai-company-platform/plan.md)
- Backend `.env.example`: `apps/backend/.env.example`
- Scope: infra-only (no app Dockerfiles, no production Docker)

## Phases

| # | Phase | Effort | Status | File |
|---|-------|--------|--------|------|
| 1 | Docker Compose + .env alignment | ~1h | complete | [phase-01](./phase-01-docker-compose-env-alignment.md) |

## Key Dependencies

- No blockers — standalone addition to existing repo
- Apps consume `DATABASE_URL` and `REDIS_URL` from `apps/backend/.env`

## Locked Decisions

- PostgreSQL 16, Redis 7
- Apps run via `pnpm dev` / `turbo dev` — not containerized
- Named volumes for data persistence between restarts
- Credentials: `aicompany / aicompany / aicompany` (local dev only)
