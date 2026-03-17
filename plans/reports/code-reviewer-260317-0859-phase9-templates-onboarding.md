# Code Review: Phase 9 — Templates + Onboarding

**Date:** 2026-03-17
**Scope:** 24 files (backend + frontend)
**Reviewer:** code-reviewer agent

---

## Scope

- **Backend:** domain interface, infra repository, 2 CQRS queries, 1 CQRS command, seed data/runner, 2 controllers, 1 DTO, shared-module, api-module updates
- **Frontend:** templates API client, 2 template components, public templates page, onboarding wizard + 4 step components, app.tsx routing, sign-up-page update
- **Scout edge cases found:** companyId not set in context after launch, no transaction on multi-step creation, issuePrefix collision risk, double API fetch in TemplateStep, actor.userId non-null assertion risk, API key stored in React state, incomplete onboarding re-entry handling

---

## Overall Assessment

Phase 9 is a clean, well-structured implementation. CQRS patterns are correctly applied, the public endpoint is properly annotated, the onboarding wizard flow is readable, and the seed runner is idempotent. However, there are four issues that range from high to critical severity that should be addressed before production: a broken post-onboarding company context, a missing database transaction in the template-instantiation command, an issuePrefix collision path, and the API key held in React component state longer than necessary.

Score: **6.5 / 10**

---

## Critical Issues

### C1. Newly created company never set in CompanyContext — dashboard renders nothing

**File:** `apps/web/src/pages/onboarding/steps/launch-step.tsx` (line ~37)

`handleLaunch` navigates to `/dashboard` after creation but never calls `setCompanyId(result.company.id)`. The `CompanyProvider` context still holds `null` (or a previous stale UUID from localStorage). Every dashboard query will use that stale/null id, causing an empty or broken dashboard immediately after sign-up.

```tsx
// After: await api.post(...)  store api key line
const { setCompanyId } = useCompanyContext();   // add hook at component top
// ...
setCompanyId(companyId);      // before navigate('/dashboard')
navigate('/dashboard');
```

---

## High Priority

### H1. No database transaction on `CreateCompanyFromTemplateCommand`

**File:** `apps/backend/src/application/commands/company/create-company-from-template-command.ts`

The command creates: company → user-company membership → N agents → goal across 5 separate `await` calls with no wrapping transaction. If any step fails (e.g. agent creation at index 2 of 5), the database is left in a partially initialised state — a company exists with no agents and no membership.

```ts
// Inject DataSource and wrap in a queryRunner transaction:
const qr = this.dataSource.createQueryRunner();
await qr.startTransaction();
try {
  // all creates go through qr.manager
  await qr.commitTransaction();
} catch (e) {
  await qr.rollbackTransaction();
  throw e;
} finally {
  await qr.release();
}
```

Alternatively, use TypeORM's `dataSource.transaction(async (em) => { ... })` helper to reduce boilerplate. This requires passing the EntityManager into each repository method, which would require adding an optional `em` param to each `create()` interface method.

### H2. issuePrefix collision from auto-derived name

**File:** `apps/backend/src/application/commands/company/create-company-from-template-command.ts` (line ~52)

```ts
const issuePrefix = cmd.companyName
  .replace(/[^a-zA-Z]/g, '')
  .slice(0, 4)
  .toUpperCase() || 'CO';
```

`issue_prefix` has a `UNIQUE` constraint in the DB schema. Two users naming their companies "Acme AI" and "Acme Inc" both produce `ACME`, and the second insert throws an unhandled DB constraint error (PG unique violation, not a NestJS `ConflictException`). The command should catch the constraint error and either auto-append a counter suffix or surface a `ConflictException`.

```ts
import { ConflictException } from '@nestjs/common';
// After company create:
} catch (err: unknown) {
  if (isUniqueViolation(err)) {
    throw new ConflictException('A company with a similar name already exists. Please use a more unique name.');
  }
  throw err;
}
```

### H3. API key held in React state without cleanup

**File:** `apps/web/src/pages/onboarding/onboarding-wizard-page.tsx` + `api-key-step.tsx`

The Anthropic API key is held in plain component state (`const [apiKey, setApiKey] = useState('')`). It is visible in React DevTools, remains in memory until the component unmounts, and is partially displayed in the review summary screen (`apiKey.slice(0, 12)`). While the `<input type="password">` field prevents display on screen, the value flows through several renders.

Mitigations:
1. Clear the `apiKey` state immediately after successful vault storage (`setApiKey('')` before `navigate`).
2. Do not slice/display the key in the review summary — show a static placeholder like `sk-ant-••••••••` instead of `apiKey.slice(0, 12)`.

---

## Medium Priority

### M1. TemplateStep makes a redundant API call

**File:** `apps/web/src/pages/onboarding/steps/template-step.tsx`

`TemplateStep` calls `templatesApi.listPublic()` independently of `PublicTemplatesPage`. If a user lands on `/sign-up` and goes directly into the wizard, no templates are cached — fine. But if they arrive via `/templates` and then click "Get Started", the list is fetched a second time with no shared cache. Consider lifting templates state to `OnboardingWizardPage` and passing the list down as a prop, or using a simple module-level cache/singleton promise. Low-overhead fix: fetch in the wizard parent on mount, pass as prop.

### M2. `reportsToIndex` out-of-bounds not guarded

**File:** `apps/backend/src/application/commands/company/create-company-from-template-command.ts` (line ~71)

```ts
const reportsTo =
  config.reportsToIndex != null ? (createdAgents[config.reportsToIndex]?.id ?? null) : null;
```

The optional chain `?.id` silently swallows a bad index value (e.g. `reportsToIndex: 99` in corrupted seed data), producing `reportsTo: null` instead of a hierarchy error. This is safe for the current hardcoded seeds but will silently flatten hierarchy if custom templates are added later. A runtime assertion or validation on the seed data would prevent silent misconfiguration.

### M3. `companyName` missing max-length validation in DTO

**File:** `apps/backend/src/presentation/controllers/dto/company/create-company-from-template-dto.ts`

```ts
companyName: z.string().min(1),
```

No `max()` constraint. A 10 000-character company name is accepted, stored, and used to derive an `issuePrefix`. The original `CreateCompanyCommand` also lacks max length — this is a pre-existing gap — but the new DTO introduces the same hole. Recommend `z.string().min(1).max(100)` for `companyName` and `z.string().optional().max(500)` for `description`/`goal`.

### M4. `findPublic()` has no ordering guarantee

**File:** `apps/backend/src/infrastructure/repositories/template-repository.ts`

`findAll()` orders by `createdAt ASC`, but `findPublic()` uses bare `findBy({ isPublic: true })` with no order clause. The template list in the onboarding wizard may render in an arbitrary DB order, which is inconsistent across page loads and between the public page and wizard.

```ts
findPublic(): Promise<ICompanyTemplate[]> {
  return this.repo.find({ where: { isPublic: true }, order: { createdAt: 'ASC' } });
}
```

### M5. Seed runner is update-blind (idempotency gap)

**File:** `apps/backend/src/infrastructure/persistence/seeds/run-template-seed.ts`

The runner only inserts if `existing` is null; it never updates. If a template's `agentConfigs` or `description` changes in `template-seed.ts` after initial seeding, `pnpm db:seed` will not apply the changes to production. The runner comment says "upserts" but the logic is insert-or-skip. Replace with TypeORM's `save()` unconditionally (or use `upsert`) to make reruns truly idempotent:

```ts
await repo.save(repo.create({ ...seed, agentConfigs: ... }));
// TypeORM save() performs UPSERT by PK
```

### M6. Onboarding wizard has no re-entry / back-navigation guard

**File:** `apps/web/src/pages/onboarding/onboarding-wizard-page.tsx`

An authenticated user who already has a company can navigate to `/onboarding` at any time and submit the wizard again, creating a duplicate company. There is no check for whether the user already completed onboarding. The wizard should check for existing companies on mount (via the existing list-companies endpoint) and redirect to `/dashboard` if at least one company exists.

---

## Low Priority

### L1. `ICompanyTemplate.agentConfigs` typed as `Record<string, unknown>` not `unknown[]`

**File:** `packages/shared/src/entities/company-template.ts`

The shared interface types `agentConfigs` as `Record<string, unknown>` (a JS object), but the seed data and the command handler treat it as an `AgentConfig[]` (an array). The DB model also uses `Record<string, unknown>`. Arrays are valid JSON but are not a `Record<string, unknown>` per TypeScript. The frontend's `CompanyTemplate` interface uses `unknown[]` correctly. Align all three:

```ts
// packages/shared/src/entities/company-template.ts
agentConfigs: unknown[];
// company-template-model.ts
agentConfigs!: unknown[];
```

### L2. `BoardTemplateController` is missing `CompanyAccessGuard`

**File:** `apps/backend/src/presentation/controllers/impl/board/board-template-controller.ts`

The `POST /companies/from-template` route is authenticated (requires session via default auth guard) but has no `@UseGuards(CompanyAccessGuard)`. That is correct since the endpoint creates a new company and no pre-existing company context is needed. The absence is intentional and fine — but the contrast with every other board controller using `CompanyAccessGuard` is surprising without a comment. Add an inline comment to signal this is intentional:

```ts
// No CompanyAccessGuard — creates a new company, no existing membership required
@Post('from-template')
```

### L3. `TemplateStep` `useEffect` depends on `selectedId` prop but re-fetches on every change

**File:** `apps/web/src/pages/onboarding/steps/template-step.tsx`

```ts
useEffect(() => {
  templatesApi.listPublic().then(...).finally(() => setLoading(false));
}, [selectedId]);
```

`selectedId` changes when the user picks a template (parent state update), causing `listPublic()` to fire again on selection. Change the dependency array to `[]` (fetch once on mount), then handle pre-selection separately.

### L4. No 404 handling in `PublicTemplatesPage` error state

**File:** `apps/web/src/pages/templates/public-templates-page.tsx`

The catch handler sets a generic `'Failed to load templates.'` message regardless of error type. A network error vs. a 500 vs. actual empty-templates are all treated identically. Low priority but an inline retry button would improve UX.

---

## Edge Cases Found by Scout

| # | Issue | Severity |
|---|-------|----------|
| E1 | Company created but `setCompanyId` never called — context stuck at null | Critical (C1) |
| E2 | Multi-step creation without transaction — partial state on failure | High (H1) |
| E3 | `issuePrefix` auto-derived from company name collides on unique constraint | High (H2) |
| E4 | API key in React state not cleared after use, partially displayed | High (H3) |
| E5 | `TemplateStep` re-fetches on every `selectedId` change | Low (L3) |
| E6 | User can re-enter `/onboarding` and duplicate-create company | Medium (M6) |
| E7 | `reportsToIndex` out-of-range silently produces flat hierarchy | Medium (M2) |

---

## Positive Observations

- CQRS pattern followed correctly across all new query/command handlers — proper `QueryHandler`/`CommandHandler` decorators, no business logic in controllers.
- `@AllowAnonymous()` on the public template controller is the right decorator pattern and is consistent with existing public endpoints.
- `ZodValidationPipe` used on the command DTO — validation at the presentation boundary, not in the command.
- `isValidAnthropicKey` provides basic format validation before submission — good UX.
- Seed runner is self-contained, uses its own `DataSource`, and handles errors with non-zero exit code.
- `TemplateGrid` empty state is handled cleanly.
- `agentConfigs` type cast with `as unknown as AgentConfig[]` is explicit rather than `as any`.
- `CompanyTemplateModel` has `@PrimaryColumn` using the template slug as PK — avoids unnecessary UUID joins.

---

## Recommended Actions (prioritised)

1. **[Critical]** Set `companyId` in `CompanyContext` in `LaunchStep` before navigating to `/dashboard`.
2. **[High]** Wrap `CreateCompanyFromTemplateCommand.execute()` in a DB transaction.
3. **[High]** Catch unique-constraint violations on `issuePrefix` and throw `ConflictException` with a user-readable message.
4. **[High]** Clear `apiKey` state after vault storage; replace partial key display in review summary with a static mask.
5. **[Medium]** Fix `findPublic()` to include `ORDER BY createdAt ASC`.
6. **[Medium]** Fix seed runner to upsert (not skip-if-exists) to support template data updates.
7. **[Medium]** Add `max()` constraints to `companyName`, `description`, `goal` in `CreateCompanyFromTemplateDto`.
8. **[Medium]** Guard `/onboarding` route — redirect authenticated users who already have a company.
9. **[Low]** Align `agentConfigs` type to `unknown[]` across shared interface, model, and frontend API type.
10. **[Low]** Fix `TemplateStep` `useEffect` deps array to `[]` to avoid refetch on selection.

---

## Metrics

| Metric | Value |
|--------|-------|
| Files reviewed | 24 |
| Critical issues | 1 |
| High issues | 3 |
| Medium issues | 6 |
| Low issues | 4 |
| CQRS adherence | Correct |
| Transaction coverage | Missing on CreateCompanyFromTemplate |
| Type safety issues | `agentConfigs` array/object mismatch |
| Security concerns | API key in React state, no key clearing |

---

## Unresolved Questions

1. Is the `issuePrefix` uniqueness UX intentional? (force users to pick unique names) If so, surface a clear error message to the frontend rather than a raw 500.
2. Should the onboarding wizard support custom (non-template) company creation, or is template selection always mandatory? The current wizard blocks progression without a selected template, but a "blank" template option may be expected in future phases.
3. Is there a plan to cache templates on the frontend (React Query / SWR)? Both `PublicTemplatesPage` and `TemplateStep` fetch independently — consolidating would also eliminate the `useEffect` dep issue (L3).
