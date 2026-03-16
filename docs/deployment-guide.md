# Deployment Guide

## Local Development Setup

### Prerequisites

- Node.js 18+ (check `.nvmrc` for exact version)
- Docker Desktop or Docker Engine
- pnpm 9+ (`npm install -g pnpm`)
- PostgreSQL client tools (optional, for debugging)

### Quick Start

1. **Start infrastructure** (PostgreSQL + Redis):
   ```bash
   docker compose up -d
   ```
   This starts:
   - PostgreSQL 16 on `localhost:5432`
   - Redis 7 on `localhost:6379`
   - Data persists in named volumes

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Configure environment**:
   ```bash
   cp apps/backend/.env.example apps/backend/.env
   ```
   (Pre-configured for local development; keys are non-sensitive)

4. **Run migrations**:
   ```bash
   turbo db:migrate
   ```
   This executes TypeORM migrations:
   - Creates all tables (companies, agents, users, issues, etc.)
   - Sets up indexes and relationships
   - Seeds initial data (if applicable)

5. **Start development servers**:
   ```bash
   turbo dev
   ```
   This runs in parallel:
   - Backend: `http://localhost:3000`
   - Frontend: `http://localhost:5173` (Vite dev server)
   - Executor: `http://localhost:3001` (stub)

6. **Verify everything is running**:
   ```bash
   curl http://localhost:3000/api/health
   # Returns: {"status":"ok"}
   ```

### Stopping Development

```bash
# Stop all dev servers (Ctrl+C in turbo terminal)

# Stop infrastructure
docker compose down

# Preserve data between restarts (default with named volumes)
# Wipe data completely
docker compose down -v
```

### Common Development Commands

```bash
# Run tests
turbo test

# Type check
turbo type-check

# Linting
turbo lint

# Build for production
turbo build

# View dependency graph
turbo graph
```

## Environment Variables

### Backend Configuration (apps/backend/.env)

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/aicompany

# Redis
REDIS_URL=redis://localhost:6379

# Authentication
BETTER_AUTH_SECRET=your-secret-key-for-session-encryption
JWT_SECRET=your-secret-key-for-agent-jwt

# API Configuration
API_PORT=3000
NODE_ENV=development

# Claude API (for Phase 5+)
CLAUDE_API_KEY=sk-... (empty in development, required in production)

# Fly.io (for production execution)
FLY_API_TOKEN=your-fly-token (empty in development)
FLY_ORG_SLUG=your-org (empty in development)
```

### Environment Variables by Environment

| Variable | Dev | Staging | Production | Required |
|----------|-----|---------|-----------|----------|
| DATABASE_URL | local postgres | Neon connection | Neon connection | Yes |
| REDIS_URL | local redis | Upstash endpoint | Upstash endpoint | Yes |
| BETTER_AUTH_SECRET | dev key | unique key | unique key | Yes |
| JWT_SECRET | dev key | unique key | unique key | Yes |
| CLAUDE_API_KEY | (empty) | sk-... | sk-... | Phase 5+ |
| FLY_API_TOKEN | (empty) | token | token | Phase 5+ |
| NODE_ENV | development | production | production | Yes |

**Security Note:** Never commit `.env` files to git. Use `.env.example` as a template.

## Database Management

### Running Migrations

```bash
# Run all pending migrations
turbo db:migrate

# Run specific migration
cd apps/backend
npm run typeorm migration:run

# Revert last migration
npm run typeorm migration:revert

# Generate new migration (after schema change)
npm run typeorm migration:generate --name="DescriptionOfChange"
```

### Database Schema

The schema is managed by TypeORM migrations. Key tables:

- `companies` - Company entities
- `agents` - AI agents
- `users` - User accounts
- `user_company` - User-to-company relationships
- `issues` - Issues/tasks
- `projects` - Projects
- `goals` - Goals
- `activity_entries` - Audit log
- `issue_comments` - Comments on issues
- Better Auth tables (`better_auth_*`) - Session management

### Database Backups

**Development (Local):**
```bash
# Backup local PostgreSQL
pg_dump -U postgres aicompany > backup.sql

# Restore from backup
psql -U postgres aicompany < backup.sql
```

**Production (Neon):**
Use Neon's built-in backup features in dashboard:
- Automatic daily backups
- Manual snapshots available
- 7-day retention

## Application Deployment

### Development Deployment (Docker Compose)

Already covered in Quick Start section.

### Production Deployment (Fly.io)

#### Prerequisites

- Fly.io account with organization
- Fly CLI installed (`brew install flyctl`)
- Authenticated with Fly: `fly auth login`

#### Initial Deployment

1. **Create Fly app**:
   ```bash
   fly apps create aicompany-api
   ```

2. **Configure app** (fly.toml):
   ```toml
   app = "aicompany-api"
   primary_region = "us-east"

   [build]
   builder = "docker"

   [env]
   NODE_ENV = "production"

   [http_service]
   internal_port = 3000
   force_https = true

   [[vm]]
   cpu_kind = "shared"
   cpus = 1
   memory_mb = 512
   ```

3. **Set secrets**:
   ```bash
   fly secrets set \
     DATABASE_URL=postgresql://... \
     REDIS_URL=redis://... \
     BETTER_AUTH_SECRET=... \
     JWT_SECRET=... \
     CLAUDE_API_KEY=sk-...
   ```

4. **Deploy**:
   ```bash
   fly deploy
   ```

5. **Verify deployment**:
   ```bash
   fly status
   curl https://aicompany-api.fly.dev/api/health
   ```

#### Ongoing Deployments

```bash
# Deploy after code changes
git push origin main
fly deploy

# View logs
fly logs

# Monitor performance
fly metrics
```

#### Scaling

```bash
# Increase machine resources
fly scale memory 1024  # 1GB RAM
fly scale cpu shared   # Shared CPU (default)
fly scale count 2      # 2 machines for redundancy

# Auto-scaling (based on CPU/memory)
fly autoscale set min=1 max=3
```

### Database Setup (Neon)

1. **Create Neon project**:
   - Go to neon.tech
   - Create new project
   - Save connection string

2. **Run migrations**:
   ```bash
   DATABASE_URL=postgresql://... turbo db:migrate
   ```

3. **Verify schema**:
   ```bash
   psql "DATABASE_URL" -c "\dt"
   ```

### Redis Setup (Upstash)

1. **Create Upstash database**:
   - Go to upstash.com
   - Create new Redis database
   - Save REST API endpoint

2. **Test connection**:
   ```bash
   curl -X GET "https://your-database.upstash.io/get/test" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

## CI/CD Pipeline

### GitHub Actions

Located in `.github/workflows/`:

#### Workflow: Tests & Type Check

```yaml
name: Test & Type Check
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: pnpm
      - run: pnpm install
      - run: turbo test
      - run: turbo type-check
```

#### Workflow: Deploy to Production

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: turbo build
      - run: turbo test
      - name: Deploy to Fly
        uses: superfly/flyctl-actions@master
        with:
          args: "deploy"
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

### Pre-commit Checks

Before pushing:

```bash
# Run tests
turbo test

# Type check
turbo type-check

# Lint
turbo lint

# Build
turbo build
```

All must pass before commit is allowed.

## Monitoring & Observability

### Application Health

```bash
# Check API health
curl http://localhost:3000/api/health

# View logs (development)
docker logs -f <container-id>

# View logs (production)
fly logs -a aicompany-api
```

### Metrics to Monitor

- **Response Times:** API response time at p50, p95, p99
- **Error Rates:** 4xx and 5xx error percentages
- **Database Queries:** Query execution time, connection pool usage
- **Memory Usage:** Heap size, garbage collection frequency
- **Uptime:** Service availability percentage

### Production Monitoring Tools

- **Fly.io Metrics:** Built-in CPU, memory, disk monitoring
- **Datadog** (optional): APM, log aggregation, alerting
- **Sentry** (optional): Error tracking and performance monitoring

## Troubleshooting

### Development Issues

**Docker containers won't start:**
```bash
docker compose down -v  # Remove volumes
docker compose up -d    # Restart
```

**Database migrations fail:**
```bash
docker exec aicompany-db psql -U postgres -d aicompany -f migration.sql
```

**Port already in use:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

**Node modules corrupted:**
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Production Issues

**Deployment fails:**
```bash
fly logs -a aicompany-api  # Check logs
fly deploy --verbose       # Verbose output
```

**Database connection issues:**
```bash
# Test connection
psql "DATABASE_URL" -c "SELECT 1"

# Check connection pool
# (adjust in backend config if needed)
```

**Out of memory:**
```bash
fly scale memory 1024  # Increase to 1GB
fly deploy
```

## Security Checklist

### Development

- [ ] `.env` file in `.gitignore`
- [ ] No hardcoded secrets in code
- [ ] Database credentials stored in `.env` only
- [ ] HTTPS enforced in production

### Production

- [ ] Environment variables set via Fly secrets
- [ ] Database credentials encrypted (Neon auto-encrypts)
- [ ] API keys encrypted in application layer
- [ ] CORS configured for specific domains
- [ ] Rate limiting enabled
- [ ] Security headers (HSTS, X-Frame-Options, etc.) configured
- [ ] Regular dependency updates
- [ ] Security patches applied within 24 hours

## Backup & Disaster Recovery

### Backup Strategy

| Component | Backup Method | Frequency | Retention |
|-----------|--------------|-----------|-----------|
| Database | Neon snapshots | Daily | 7 days |
| Redis | Upstash persistence | Auto | 24 hours |
| Application Code | Git repository | Per commit | Unlimited |
| Secrets | Fly secrets backup | Manual | N/A |

### Restore Procedure

1. **Restore database from Neon snapshot:**
   - Go to Neon dashboard
   - Select snapshot date
   - Restore to new branch or production

2. **Verify application health:**
   ```bash
   curl https://api.example.com/api/health
   ```

3. **Check data consistency:**
   - Verify company counts
   - Check agent statuses
   - Review recent activities

## Performance Optimization

### Database Optimization

- Indexes on frequently queried columns (companyId, userId, agentId)
- Connection pooling via PgBouncer (production)
- Query caching with Redis (Phase 7)

### API Optimization

- Pagination for list endpoints (default: 20 items)
- Response compression (gzip)
- HTTP caching headers (Cache-Control)
- CDN for static assets

### Frontend Optimization

- Vite tree-shaking
- Code splitting by route
- Image optimization
- Lazy loading for components

## Scaling Considerations

### Horizontal Scaling

- Fly.io multi-machine deployment
- Load balancer (Fly auto-provides)
- Session replication (stored in PostgreSQL, not memory)
- Redis clustering (Upstash handles)

### Database Scaling

- Read replicas (Neon supports)
- Partitioning by companyId (future optimization)
- Query optimization & indexing

## Support & Documentation

- **Technical Docs:** See `docs/blueprint/` for detailed specs
- **API Docs:** Swagger/OpenAPI (auto-generated from NestJS)
- **Code Standards:** See `code-standards.md`
- **Architecture:** See `system-architecture.md`

---

**Last Updated:** March 2026
**Version:** 1.0
**Reference:** See [system-architecture.md](./system-architecture.md) for infrastructure overview
