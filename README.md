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

See [docs/blueprint/README.md](docs/blueprint/README.md) for the complete technical blueprint.

## Development

```bash
pnpm install
turbo dev
```
