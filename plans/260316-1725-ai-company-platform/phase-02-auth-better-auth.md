# Phase 2: Auth — Better Auth Integration

## Context Links
- Parent: [plan.md](./plan.md)
- Dependencies: Phase 1 (DB tables: users, sessions, userCompanies)
- Docs: [19-security](../../docs/blueprint/05-security/19-security.md), [12-api-architecture](../../docs/blueprint/03-architecture/12-api-architecture-nestjs.md), [17-api-design](../../docs/blueprint/04-data-and-api/17-api-design.md)

## Overview
- **Date:** 2026-03-16
- **Priority:** P1 — blocks all authenticated endpoints
- **Status:** pending
- **Review:** pending
- **Description:** Integrate Better Auth for user session management (email + OAuth), implement auth guards for both board users and agents, set up company access control.

## Key Insights
- Better Auth handles raw requests — MUST disable NestJS body parser in main.ts
- Better Auth sets HTTP-only secure cookies automatically
- Agent auth uses JWT (ephemeral, per-run, 48h TTL) OR persistent API key (pcp_ prefix, SHA-256 hash)
- `@AllowAnonymous()` decorator bypasses auth for public routes
- Session cookies pass via raw Express req/res context

## Requirements

### Functional
- Email sign-up/sign-in with Better Auth
- OAuth: Google + GitHub providers
- Session management (HTTP-only cookies)
- `BoardAuthGuard` — validates session cookie, extracts userId
- `AgentAuthGuard` — validates JWT Bearer or pcp_ API key, extracts agentId + companyId
- `CompanyAccessGuard` — verifies actor belongs to company (via userCompanies or agent.companyId)
- `CompanyRoleGuard` — checks role (owner/admin/viewer) for board users
- `@CurrentActor()` decorator — returns IActor { type, userId?, agentId?, companyId? }
- `@CompanyId()` decorator — extracts companyId from route param or actor
- `@RunId()` decorator — extracts X-Run-Id header
- `@Roles()` decorator — marks required roles
- `@AllowAnonymous()` decorator — skip auth
- Auth controller: POST sign-up, POST sign-in, GET session, OAuth callbacks
- UserCompany CRUD: add member, remove member, update role

### Non-Functional
- Session TTL: 30 days
- JWT TTL: 48h (AGENT_JWT_TTL_SECONDS env var)
- API key hash: SHA-256, stored as hex
- Rate limit: 10 sign-up attempts / 15 min per IP

## Architecture

```
Request → Guard Layer → Controller
  │
  ├── BoardAuthGuard: cookie → Better Auth session → userId
  ├── AgentAuthGuard: Bearer JWT → verify → agentId,companyId
  │                   OR pcp_ key → SHA-256 → lookup agentApiKeys table
  ├── CompanyAccessGuard: actor + :cid param → userCompanies or agent.companyId
  └── CompanyRoleGuard: userCompanies.role check
```

## Related Code Files

### apps/backend/src/
- `config/auth-config.ts` — AUTH_SECRET, AUTH_URL, AGENT_JWT_SECRET, AGENT_JWT_TTL_SECONDS
- `guard/board-auth-guard.ts` — session cookie validation
- `guard/agent-auth-guard.ts` — JWT + API key validation
- `guard/company-access-guard.ts` — company membership check
- `guard/company-role-guard.ts` — role-based access
- `decorator/current-actor.ts` — @CurrentActor() param decorator
- `decorator/company-id.ts` — @CompanyId() param decorator
- `decorator/run-id.ts` — @RunId() param decorator
- `decorator/roles.ts` — @Roles() metadata decorator
- `decorator/allow-anonymous.ts` — @AllowAnonymous() metadata
- `presentation/controllers/impl/public/auth-controller.ts` — sign-up, sign-in, session, OAuth
- `application/services/impl/auth-service.ts` — Better Auth instance setup
- `application/services/impl/agent-jwt-service.ts` — sign/verify agent JWTs
- `infrastructure/repositories/user-company-repository.ts`
- `domain/repositories/i-user-company-repository.ts`
- `utils/hash.ts` — SHA-256 helper for API key hashing

## Implementation Steps

1. **Install Better Auth**
   - `pnpm --filter @aicompany/backend add better-auth`
   - Configure Better Auth instance in auth-service.ts
   - Set AUTH_SECRET, AUTH_URL from ConfigModule
   - Enable email + password plugin
   - Enable Google + GitHub OAuth providers

2. **Auth service setup**
   - Create auth-service.ts wrapping Better Auth
   - Expose `handler` for raw request/response passthrough
   - Better Auth manages users + sessions tables directly
   - Ensure main.ts has body parser DISABLED for `/api/auth/*` routes

3. **Auth controller**
   - Create auth-controller.ts with @AllowAnonymous()
   - Route all `/api/auth/*` requests to Better Auth handler
   - Better Auth handles: POST sign-up/email, POST sign-in/email, GET get-session, OAuth flows

4. **Board auth guard**
   - Create board-auth-guard.ts implementing CanActivate
   - Extract session cookie from request
   - Call Better Auth session validation
   - Attach userId to request for downstream use
   - Skip if @AllowAnonymous() metadata present

5. **Agent auth guard**
   - Create agent-auth-guard.ts
   - Check Authorization header: `Bearer <jwt>` or `pcp_<key>`
   - JWT path: verify with AGENT_JWT_SECRET, extract agentId + companyId
   - API key path: SHA-256 hash the raw key, lookup in agentApiKeys table
   - Attach agentId + companyId to request

6. **Agent JWT service**
   - Create agent-jwt-service.ts
   - `sign(agentId, companyId, runId)` → JWT with 48h TTL
   - `verify(token)` → { agentId, companyId, runId }
   - Use jsonwebtoken package

7. **Company access guard**
   - Create company-access-guard.ts
   - Extract companyId from route `:cid` or `:id` param
   - For board users: check userCompanies junction
   - For agents: verify agent.companyId matches

8. **Company role guard**
   - Create company-role-guard.ts
   - Read @Roles() metadata from handler
   - Lookup userCompanies.role for the user+company pair
   - Reject if role insufficient

9. **Decorators**
   - `@CurrentActor()`: createParamDecorator reading user/agent from request
   - `@CompanyId()`: extract from route params or actor context
   - `@RunId()`: extract from X-Run-Id header
   - `@Roles('owner', 'admin')`: SetMetadata
   - `@AllowAnonymous()`: SetMetadata

10. **UserCompany repository**
    - Interface in domain/repositories
    - Implementation querying userCompanies table
    - Methods: findByUserAndCompany, findCompaniesByUser, addMember, removeMember, updateRole

11. **Hash utility**
    - `hashApiKey(raw: string): string` — SHA-256 hex digest
    - Used by agent auth guard and API key creation (Phase 8)

12. **Register guards globally or per-module**
    - BoardAuthGuard as default guard via APP_GUARD (board controllers)
    - AgentAuthGuard applied via @UseGuards on agent controllers
    - CompanyAccessGuard + CompanyRoleGuard stacked where needed

## Todo List
- [ ] Install Better Auth + configure
- [ ] Auth service (Better Auth wrapper)
- [ ] Auth controller (public routes)
- [ ] Board auth guard (session cookie)
- [ ] Agent auth guard (JWT + API key)
- [ ] Agent JWT service (sign/verify)
- [ ] Company access guard
- [ ] Company role guard
- [ ] All decorators (@CurrentActor, @CompanyId, @RunId, @Roles, @AllowAnonymous)
- [ ] UserCompany repository (interface + impl)
- [ ] Hash utility (SHA-256)
- [ ] Register guards in modules
- [ ] Test: sign-up → sign-in → get-session flow
- [ ] Test: agent JWT creation + verification
- [ ] Test: company access denied for non-member

## Success Criteria
- User can sign up with email, sign in, get session
- OAuth flows redirect correctly for Google/GitHub
- BoardAuthGuard rejects unauthenticated requests with 401
- AgentAuthGuard accepts valid JWT and valid pcp_ API key
- CompanyAccessGuard returns 403 for non-members
- CompanyRoleGuard blocks viewer from admin-only routes
- @CurrentActor() returns correct IActor in controllers

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Better Auth body parser conflict | High | High | Disable NestJS body parser for auth routes specifically |
| OAuth redirect URI mismatch | Medium | Medium | Document exact callback URLs in .env.example |
| JWT secret rotation | Low | Medium | Plan key rotation strategy (not Phase 2 scope) |

## Security Considerations
- AUTH_SECRET minimum 32 bytes, generated via `openssl rand -base64 32`
- AGENT_JWT_SECRET separate from AUTH_SECRET
- HTTP-only secure cookies (SameSite=Lax)
- API keys: raw key shown once at creation, only hash stored
- Rate limiting on auth endpoints (10 attempts / 15 min)
- No password stored in plain text (Better Auth handles bcrypt)

## Next Steps
- Phase 3: CRUD endpoints use guards from this phase
- Phase 4: Heartbeat creates agent JWTs per run
- Phase 8: Agent API key creation/revocation
