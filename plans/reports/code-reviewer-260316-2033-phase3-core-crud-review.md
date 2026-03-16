# Code Review: Phase 3 Core CRUD — NestJS Backend

**Date:** 2026-03-16
**Scope:** Phase 3 newly created files, apps/backend/src/
**Files reviewed:** ~40 files (models, repositories, commands, queries, controllers, guards, interceptors, pipes)
**LOC:** ~1,100 total across reviewed files
**All files under 200 lines:** Yes

---

## Overall Assessment

Solid CQRS structure with good multi-tenancy discipline. Most queries are correctly scoped by `companyId`. No N+1 patterns found. The atomic checkout SQL is correct. CQRS handler registration in `shared-module.ts` is complete. The main issues are: a duplicate route prefix bug that will cause 404s at runtime, an unhandled `null` dereference in the dashboard query, missing 409 HTTP mapping for `IssueAlreadyCheckedOutException`, and an unauthenticated endpoint on the company controller.

---

## Critical Issues

### 1. Duplicate `api/` prefix — all board/agent routes resolve to `/api/api/...`
**Severity: Critical**
**Files:** `apps/backend/src/main.ts:16`, all controllers under `presentation/controllers/impl/`

`main.ts` calls `app.setGlobalPrefix('api')`, but every controller already hardcodes the `api/` prefix in its `@Controller` decorator, e.g.:
- `@Controller('api/companies/:cid/issues')` → resolves to `/api/api/companies/...`
- `@Controller('api/agent-issues')` → resolves to `/api/api/agent-issues`

**Impact:** Every API endpoint is unreachable at the expected URL. This is a build-passes-but-silently-broken scenario.

**Fix:** Either remove `app.setGlobalPrefix('api')` from `main.ts`, or strip the `api/` prefix from every `@Controller` decorator. Removing the `setGlobalPrefix` call is the lower-risk change given the controllers are already consistent.

---

### 2. `IssueAlreadyCheckedOutException` is not caught — returns HTTP 500
**Severity: Critical**
**Files:** `apps/backend/src/domain/exceptions/issue-already-checked-out-exception.ts:1`, `apps/backend/src/filter/http-exception-filter.ts:9`

`IssueAlreadyCheckedOutException` extends plain `Error`, not `HttpException`. The `HttpExceptionFilter` is decorated `@Catch(HttpException)` only, so the domain exception falls through to the framework's default error handler and returns a 500 with an internal stack trace exposed to the client.

**Fix:** Either extend `ConflictException` from `@nestjs/common` in the exception class, or add a second catch-all filter (`@Catch()`) that maps known domain exceptions to their HTTP codes.

---

### 3. `POST /api/companies` has no authentication guard
**Severity: Critical**
**File:** `apps/backend/src/presentation/controllers/impl/board/board-company-controller.ts:31`

`BoardCompanyController` has no class-level `@UseGuards` and the `POST /` (`create`) endpoint has no method-level guard either. `BoardAuthGuard` is registered as `APP_GUARD` (global) so it does run, but `actor.userId!` on line 37 will throw a runtime error if the session is invalid and `actor` is `undefined`. If `AllowAnonymous` is ever added to the class, create becomes fully public.

More immediately: `actor` is typed as `IActor | undefined` from `CurrentActor` decorator (returns `undefined` when no actor), but the controller uses `actor.userId!` with a non-null assertion. If the global guard somehow fails to set `actor` (e.g., via `AllowAnonymous` misuse), this throws an unhandled `TypeError`.

**Fix:** Add `@UseGuards(BoardAuthGuard)` explicitly at class level, and guard `actor` with a null check or use a dedicated `@AuthenticatedActor()` decorator that throws `UnauthorizedException` when undefined.

---

## High Priority

### 4. Dashboard summary fetches full issue list — O(n) memory problem
**Severity: High**
**File:** `apps/backend/src/application/queries/dashboard/get-dashboard-summary-query.ts:31-32`

```ts
this.issueRepo.findAllByCompany(query.companyId, { limit: 1000 }),
this.issueRepo.findAllByCompany(query.companyId, { status: 'in_progress', limit: 1000 }),
```

The query fetches up to 1,000 full `IssueModel` rows just to get `issues.length` and `activeIssues.length`. This will become a performance problem as data grows, and `limit: 1000` is a silent data accuracy bug once a company has >1,000 issues (the count will be capped at 1,000 but not reported as such).

**Fix:** Replace with `COUNT(*)` SQL queries. `TypeORM` `count()` or a raw `SELECT COUNT(*) FROM issues WHERE company_id = $1` is the correct approach. The repository interface should expose `countByCompany(companyId, filters?)`.

---

### 5. `runId` is not validated before use in checkout/release
**Severity: High**
**File:** `apps/backend/src/decorator/run-id.ts:5`, `apps/backend/src/presentation/controllers/impl/agent/agent-issue-controller.ts:23`

`RunId` decorator returns `string | undefined`. Both `checkout` and `release` controller methods are typed as accepting `runId: string` but the decorator is typed to return `string | undefined`. TypeScript doesn't catch this because `createParamDecorator` returns `any`. If an agent omits the `X-Run-Id` header, `runId` will be `undefined`, and the `atomicCheckout` SQL will set `checkout_run_id = undefined` — which TypeORM serialises as `NULL`, silently clearing any existing checkout rather than failing.

**Fix:** Validate `runId` presence in the controller (throw `BadRequestException` if missing) or add a dedicated pipe/guard.

---

### 6. `release` command does not verify runId ownership before silently succeeding
**Severity: High**
**File:** `apps/backend/src/application/commands/issue/release-issue-command.ts:20-24`

The handler verifies the issue exists via `findByIdAndCompany` but then calls `this.issueRepo.release(cmd.issueId, cmd.runId)`, which silently does nothing if `runId` doesn't match (the SQL has `AND checkout_run_id = $2`). The handler returns `void` with no error in this case — the caller cannot distinguish "released successfully" from "wrong runId, nothing happened."

**Impact:** An agent with a wrong `runId` receives HTTP 200 but the issue remains checked out. This is a silent no-op masking a data integrity issue.

**Fix:** After calling `release`, verify the issue `checkoutRunId` is now `NULL` (or check rowCount from the raw query) and throw a `ForbiddenException` if the runId didn't match.

---

### 7. `BaseRepository.softDelete` sets `status = 'archived'` on entities without a `status` field
**Severity: High**
**File:** `apps/backend/src/infrastructure/repositories/base-repository.ts:30`

`softDelete` uses `{ status: 'archived' } as never` cast. If a model doesn't have a `status` column (e.g., `IssueCommentModel`, `ActivityEntryModel`), TypeORM will attempt an UPDATE with a non-existent column. This will cause a runtime DB error if softDelete is ever called on those repositories.

**Fix:** Either remove `softDelete` from `BaseRepository` and implement it only on models that have a `status` column, or add a TS constraint `T extends { status: string }` to the class type parameter.

---

## Medium Priority

### 8. `AddCommentCommand` does not verify the issue exists within the company
**Severity: Medium**
**File:** `apps/backend/src/application/commands/issue/comment/add-comment-command.ts:24`

The handler inserts a comment directly without checking that `issueId` belongs to the given `companyId`. An agent or user who knows a valid `issueId` from another company can post comments to it via the agent endpoint (since `companyId` comes from the actor's JWT, the comment's `companyId` will be correct, but the `issueId` could be cross-tenant).

**Fix:** Add `issueRepo.findByIdAndCompany(issueId, companyId)` check before creating the comment, mirroring the pattern in `checkout-issue-command.ts`.

---

### 9. `UpdateIssueCommand.partial` accepts the full `Partial<IIssue>` — no field whitelist
**Severity: Medium**
**File:** `apps/backend/src/application/commands/issue/update-issue-command.ts:11`, `apps/backend/src/infrastructure/repositories/base-repository.ts:24`

`BaseRepository.update()` calls `this.repo.update(id, partial as never)`, passing the raw DTO body through. If a caller constructs the command with crafted fields (e.g., `companyId`, `identifier`, `issueNumber`), TypeORM will write them. The Zod DTO in `update-issue-dto.ts` is correctly scoped, but the command itself accepts `Partial<IIssue>`, so future direct callers (e.g., internal services) can overwrite immutable fields.

**Fix:** Either strip protected fields (`companyId`, `identifier`, `issueNumber`, `checkoutRunId`) in the `UpdateIssueHandler` before calling `repo.update`, or create a dedicated `IssueUpdatePayload` type that excludes them.

---

### 10. `UpdateCompanyCommand` passes `cid` as both `id` and `companyId`
**Severity: Medium**
**File:** `apps/backend/src/presentation/controllers/impl/board/board-company-controller.ts:58`

```ts
return this.commandBus.execute(new UpdateCompanyCommand(cid, cid, body));
```

`UpdateCompanyCommand` constructor is `(id, companyId, partial)`. Both args are identical (`cid`). Same pattern on `DeleteCompanyCommand` line 64. This works today since company ID and "its own companyId" are the same thing, but the redundant parameter creates confusion and the `companyId` field in the command is never used in the handler (handler calls `companyRepo.update(cmd.id, ...)` with no company-scope check).

**Fix:** Remove the `companyId` parameter from `UpdateCompanyCommand` / `DeleteCompanyCommand` or use it in the handler for a `findByIdAndOwner` check before mutating.

---

### 11. Activity log interceptor logs `action: 'mutation'`, `entityType: 'unknown'`, `entityId: 'unknown'`
**Severity: Medium**
**File:** `apps/backend/src/interceptor/activity-log-interceptor.ts:38-41`

The interceptor fires `LogActivityCommand` with hardcoded placeholder values for `action`, `entityType`, and `entityId`. The activity log table will be populated but useless for auditing. The interceptor cannot easily infer entity type/ID from the generic request, which is likely why placeholders are used.

**Fix:** Either remove the interceptor and let each command handler emit its own `LogActivityCommand` with proper values, or pass entity context via response metadata. The current approach creates noisy audit records that may mislead downstream consumers.

---

### 12. `CompanyAccessGuard` falls through to `return true` when `companyId` param is absent
**Severity: Medium**
**File:** `apps/backend/src/guard/company-access-guard.ts:33`

```ts
if (!companyId) return true; // no company param — guard is a no-op
```

Any route decorated `@UseGuards(CompanyAccessGuard)` without a `:cid`, `:companyId`, or `:id` param silently bypasses the membership check and grants access. This is a footgun: future controllers that add `@UseGuards(CompanyAccessGuard)` but use a different param name (e.g., `:orgId`) will silently have no access control.

**Fix:** Change the fallthrough to `throw new InternalServerErrorException('CompanyAccessGuard: no company param found')` or document clearly with a stricter contract.

---

## Low Priority

### 13. `searchByTitle` ILIKE search has no minimum query length
**Severity: Low**
**File:** `apps/backend/src/infrastructure/repositories/issue-repository.ts:65`

Empty string `q = ''` results in `ILIKE '%%'` which returns all issues up to the limit — effectively a full table scan with no useful filtering. The controller passes `q ?? ''` on line 57, so an empty `?q=` query param hits this path.

**Fix:** Validate `q.length >= 1` in the controller or query handler and return an empty array (or 400) for empty queries.

---

### 14. `AgentSelfController.me` uses non-null assertions that can throw on API-key auth
**Severity: Low**
**File:** `apps/backend/src/presentation/controllers/impl/agent/agent-self-controller.ts:15`

```ts
return this.queryBus.execute(new GetAgentQuery(actor.agentId!, actor.companyId!));
```

When the request uses JWT auth, `agentId` and `companyId` are always set. However, `IActor` defines both as optional, and if an edge case (e.g., a malformed token that passes `agentJwtService.verify`) leaves these undefined, the `!` assertion will throw a `TypeError` rather than a clean `UnauthorizedException`.

**Fix:** Add explicit null guards: `if (!actor?.agentId || !actor?.companyId) throw new UnauthorizedException(...)`.

---

### 15. `HttpLoggerInterceptor` does not log errors / non-2xx responses
**Severity: Low**
**File:** `apps/backend/src/interceptor/http-logger-interceptor.ts:21`

`tap()` only fires on success. Errors bypass the log. The log will be missing entries for all failed requests, making debugging harder.

**Fix:** Use `tap({ next: ..., error: ... })` to log both success and error paths.

---

## Edge Cases Found During Review

- **Concurrent issue creation:** `incrementIssueCounter` uses a raw UPDATE RETURNING, which is correct and race-safe. No issue.
- **Checkout with already-null runId:** If `checkoutRunId` is already `NULL` (not checked out) and `release` is called, the SQL no-ops silently — no error raised. This is acceptable UX but worth documenting.
- **ILIKE injection:** The `%${q}%` interpolation is passed as a parameterised value `{ q: ... }`, not string-concatenated into the SQL. No SQL injection risk.
- **`GetDashboardSummaryQuery` parallel fetch:** `Promise.all` is used correctly; no serial N+1 here, though the O(n) issue (item 4) still applies.
- **`UserCompanyModel` registered in both `AuthModule` and `SharedModule`:** Registering the same entity in multiple `TypeOrmModule.forFeature()` calls is safe in TypeORM/NestJS (returns cached repository), but the duplication is a code smell.

---

## Positive Observations

- All list/get queries are correctly scoped by `companyId` — no cross-tenant data leakage found in query paths.
- Atomic checkout SQL (`WHERE checkout_run_id IS NULL`) is correct and avoids TOCTOU race conditions.
- CQRS handler registrations in `shared-module.ts` are complete — all command and query handlers accounted for.
- Repository injection tokens use `Symbol()` consistently, avoiding string-literal collisions.
- Zod DTOs are tight and well-typed; `ZodValidationPipe` is correctly instantiated per-endpoint.
- File sizes are all well under 200 lines; KISS and DRY principles followed throughout.
- `CompanyAccessGuard` correctly handles both agent (companyId from JWT) and board (DB membership check) actor types.
- `IssueCommentRepository.findAllByIssue` scopes by both `companyId` and `issueId` — correct double guard.
- `BaseRepository.update` performs a `findById` after the UPDATE to return a fresh entity — avoids stale data returns.

---

## Recommended Actions (prioritised)

1. **[Critical]** Remove `app.setGlobalPrefix('api')` from `main.ts:16` — every endpoint is currently broken.
2. **[Critical]** Map `IssueAlreadyCheckedOutException` to HTTP 409 — either extend `ConflictException` or add a domain-exception filter.
3. **[Critical]** Add explicit `BoardAuthGuard` to `BoardCompanyController` and null-check `actor` before `actor.userId!`.
4. **[High]** Replace dashboard issue count queries with `COUNT(*)` SQL to avoid O(n) memory load.
5. **[High]** Validate `X-Run-Id` header presence in checkout/release endpoints and return 400 when absent.
6. **[High]** Fix silent no-op in `ReleaseIssueHandler` — surface a `ForbiddenException` when runId does not match.
7. **[High]** Scope `softDelete` to models that have a `status` column, or remove it from `BaseRepository`.
8. **[Medium]** Add issue-exists-in-company check to `AddCommentHandler`.
9. **[Medium]** Strip immutable fields (`companyId`, `identifier`, `issueNumber`) in `UpdateIssueHandler` before calling `repo.update`.
10. **[Medium]** Replace activity log interceptor placeholder values or remove it in favour of per-command logging.
11. **[Low]** Validate `q.length >= 1` before executing `searchByTitle`.
12. **[Low]** Add error path logging to `HttpLoggerInterceptor`.

---

## Metrics

- Type Coverage: ~90% (a few `as never` casts and `!` assertions lower this)
- Linting Issues: Not run — no errors expected structurally
- File size violations: 0

---

## Unresolved Questions

- Is `BoardCompanyController.list` intended to return companies across all tenants for the user, or should it also enforce `CompanyAccessGuard`? Currently, `ListCompaniesQuery` is scoped by `userId` via `userCompanyRepo`, which is correct — but this implicit scoping via query rather than guard is a pattern inconsistency worth documenting.
- Should `release` silently succeed or error when `runId` doesn't match? The current silent no-op may be intentional (idempotent release) — needs product clarification.
- Is the `ActivityLogInterceptor` placeholder implementation temporary? If it will be replaced by per-command activity logging, the interceptor should be removed now to avoid polluting the audit table.
