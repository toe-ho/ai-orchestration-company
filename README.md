# AI Company Platform

A web platform where users create and run fully autonomous AI-powered companies. Users define a business goal, the platform assembles a team of AI agents, and those agents work 24/7 — writing code, designing UI, running marketing, managing tasks.

## Package Name

`@aicompany/*`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS 4, shadcn/ui, React Query |
| Backend | Node.js, NestJS, TypeScript, CQRS, @nestjs/schedule |
| Database | PostgreSQL (Neon/Supabase), TypeORM |
| Auth | Better Auth (sessions), Agent JWT, encrypted API keys |
| Execution | Fly.io Machines (per-company VMs) |
| Real-time | Redis pub/sub (Upstash) + WebSocket |
| Monorepo | pnpm workspaces + Turborepo |
| Testing | Vitest, Playwright |
| CI/CD | GitHub Actions |

## Monorepo Structure

```
apps/
├── backend/          # NestJS API + Scheduler
├── web/              # React frontend (Vite)
└── executor/         # Agent Executor (Fly.io VM)
packages/
├── shared/           # Types, constants, validators (Zod)
├── adapters/         # Agent runtime integrations
└── adapter-utils/    # Shared adapter utilities
config/
├── skills/           # Agent instruction files
└── templates/        # Company templates
docs/
└── blueprint/        # Full technical documentation (25 docs)
```

## Documentation

### Operational Documentation
- **[Project Overview & PDR](docs/project-overview-pdr.md)** — Product vision, features, technical architecture
- **[Codebase Summary](docs/codebase-summary.md)** — File organization, module structure, key statistics
- **[Code Standards](docs/code-standards.md)** — Naming conventions, patterns, testing guidelines
- **[System Architecture](docs/system-architecture.md)** — High-level design, data flow, security
- **[Development Roadmap](docs/project-roadmap.md)** — 9 phases, milestones, dependencies
- **[Deployment Guide](docs/deployment-guide.md)** — Local setup, production deployment, troubleshooting
- **[Design Guidelines](docs/design-guidelines.md)** — UI framework, components, accessibility

### Technical Specification
See [docs/blueprint/README.md](docs/blueprint/README.md) for the complete technical blueprint (25+ detailed specs).

## Local Dev Setup

**Prerequisites:** Docker Desktop or Docker Engine

1. Start infrastructure (PostgreSQL + Redis):
   ```bash
   docker compose up -d
   ```

2. Copy env and install deps:
   ```bash
   cp apps/backend/.env.example apps/backend/.env
   pnpm install
   ```

3. Run migrations and start apps:
   ```bash
   turbo db:migrate
   turbo dev
   ```

4. Stop infrastructure:
   ```bash
   docker compose down
   ```

> Data persists between restarts via named volumes. Use `docker compose down -v` to wipe data.
