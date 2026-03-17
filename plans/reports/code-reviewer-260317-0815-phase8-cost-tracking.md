# Code Review: Phase 8 — Cost Tracking, Approvals, Governance

**Date:** 2026-03-17
**Reviewer:** code-reviewer agent
**Scope:** Phase 8 additions — cost tracking, approval workflow, API key vault, migration

---

## Scope

| Area | Files |
|------|-------|
| Migration | `1710000000004-CostTrackingAndApprovals.ts` |
| Models | `cost-event-model.ts`, `approval-model.ts` |
| Commands | `record-cost-event-command.ts`, `approve-command.ts`, `reject-command.ts`, `reconcile-budgets-command.ts` |
| Events | `on-approval-resolved-handler.ts`, `approval-resolved-event.ts` |
| Service | `api-key-vault-service.ts` |
| Controllers | `board-approval-controller.ts`, `board-api-key-vault-controller.ts` |
| Module | `shared-module.ts` |
| Frontend | `approvals-page.tsx`, `cost-dashboard-page.tsx` |
| Utilities | `utils/crypto.ts` |
| Scout | last commit touched `api-key-vault-service.ts`, `company-api-key-model.ts`, `shared-module.ts`, `scheduler-service.ts` |

LOC reviewed: ~700 (backend) + ~340 (frontend)

---

## Overall Assessment

Phase 8 is structurally solid. CQRS pattern is followed consistently, multi-tenant isolation is applied in most places, and AES-256-GCM is used correctly. However, there are two security-grade issues that must be addressed before production: a missing `companyId` ownership check on the revoke endpoint, and a hardcoded Anthropic-only validation URL that will silently pass any non-Anthropic key as invalid.

---

## Critical Issues

### C1 — Revoke endpoint bypasses tenant isolation

**File:** `board-api-key-vault-controller.ts:47`, `revoke-api-key-command.ts:9`

`RevokeApiKeyCommand` accepts only `keyId`. The handler calls `vault.revoke(keyId)` which runs `repo.update(keyId, { revokedAt })` — **no companyId ownership check**. Any authenticated board user who knows (or guesses) a UUID from another company can revoke that company's API key.

The controller route sits under `companies/:cid/api-keys/:keyId` and is protected by `CompanyAccessGuard`, which validates that the user belongs to `:cid`. But that guard does NOT verify that `keyId` belongs to `cid`. The gap is entirely in the command/service layer.

Fix: pass `companyId` into `RevokeApiKeyCommand` and add a `findOneBy({ id: keyId, companyId })` ownership check in `ApiKeyVaultService.revoke()` before updating — same pattern used in `ApproveHandler` and `RejectHandler`.

---

### C2 — API key validation hardcoded to Anthropic only

**File:** `api-key-vault-service.ts:86`

```typescript
const res = await fetch('https://api.anthropic.com/v1/models', {
  headers: { 'x-api-key': rawKey, 'anthropic-version': '2023-06-01' },
});
valid = res.ok;
```

The vault stores keys for any `provider` string (OpenAI, Azure, etc.). All non-Anthropic keys will always return `false` from validation, silently marking them invalid in the database even though they are correct. This also means every validation call leaks the key to the Anthropic endpoint when the stored provider is something else entirely.

Fix: dispatch validation per-provider, or stub `valid = true` for unrecognised providers rather than calling the wrong endpoint. At minimum, gate this block behind `if (record.provider === 'anthropic')`.

---

## High Priority

### H1 — `ReconcileBudgetsHandler` is a stub

**File:** `reconcile-budgets-command.ts:19–37`

The handler body is entirely logging statements — no actual reconciliation occurs. The comment says "heartbeat handler updates incrementally" and drift correction is deferred, but this is registered as a production `CommandHandler` scheduled by `scheduler-service.ts`. Budget overruns could go undetected if incremental updates drift. Either implement the reconciliation or explicitly mark this as not-yet-implemented with a TODO and ensure the scheduler does not run it until implemented.

---

### H2 — `resolvedByUserId` accepted from request body (approval workflow)

**File:** `resolve-approval-dto.ts`, `board-approval-controller.ts:56`

`resolvedByUserId` is a client-supplied string with only `z.string().min(1)` validation. The actual authenticated user identity should come from `request.actor.userId`, not the request body. A user can pass any userId string, recording false attribution in `resolved_by_user_id`. The `actor` is already set on the request by the auth middleware.

Fix: remove `resolvedByUserId` from the DTO and the controller body parsing; derive it from `request.actor.userId` in the controller method using a custom decorator or `@Req()`.

---

### H3 — `getSummary` query mixes ORM aliases and raw column names

**File:** `cost-event-repository.ts:32–42`

The `createQueryBuilder` uses raw SQL column names (`ce.agent_id`, `ce.cost_cents`, `ce.company_id`, `ce.created_at`) mixed with TypeORM camelCase entity properties in `where`/`andWhere` clauses. TypeORM `createQueryBuilder` translates property names to column names automatically for `where` conditions but **not** for `.select()` raw aliases. This is fragile: if column naming changes, the aggregation silently breaks while `where` clauses continue working.

Prefer consistent use of either all-ORM aliases or a single native query. At minimum add a comment documenting the intentional raw column usage.

---

## Medium Priority

### M1 — `decrypt` return type unsafely concatenates Buffer + string

**File:** `utils/crypto.ts:26`

```typescript
return decipher.update(data) + decipher.final('utf8');
```

`decipher.update(data)` without an encoding argument returns a `Buffer`. Concatenating `Buffer + string` in JS coerces the Buffer to its string representation (e.g., `[object Buffer]`) rather than UTF-8. This works accidentally in Node because Buffer's `+` coercion calls `.toString()` which defaults to UTF-8, but it is relying on implicit behaviour and TypeScript does not catch it. Should be `decipher.update(data, undefined, 'utf8') + decipher.final('utf8')` or combine both into a `Buffer.concat` and call `.toString('utf8')` once.

---

### M2 — `approval_comments` table missing in `down()` migration rollback

**File:** `1710000000004-CostTrackingAndApprovals.ts:83–90`

`agent_api_keys` table is created in `up()` but not dropped in `down()`. Rollback will leave the `agent_api_keys` table behind, which could cause constraint failures if the migration is re-run.

Fix: add `DROP TABLE IF EXISTS "agent_api_keys"` to `down()`.

---

### M3 — `approval.status` and `approval.type` are untyped `TEXT`

**File:** `approval-model.ts:14,17`

Both `type` and `status` are plain `text` columns with no DB constraint and no TypeScript enum. Invalid strings can be persisted. The domain logic in `on-approval-resolved-handler.ts` string-compares `event.type === 'hire_agent'` — a typo silently produces wrong behaviour. Define TypeScript string-literal union types (or enums) and add `CHECK` constraints in the migration.

---

### M4 — `OnApprovalResolvedHandler` swallows `hire_agent` auto-create failures silently

**File:** `on-approval-resolved-handler.ts:35–37`

When `CreateAgentCommand` throws, the handler catches, logs, and returns without re-throwing. This means an approved `hire_agent` request can succeed in the approval table but fail to create the agent, with no observable signal to the board user. Consider emitting a failure event, updating the approval status to `failed`, or at minimum surfacing a WebSocket notification so the approval UI can reflect the outcome.

---

### M5 — `RejectHandler` does not publish `ApprovalResolvedEvent`

**File:** `reject-command.ts`

`ApproveHandler` publishes `ApprovalResolvedEvent` after updating status. `RejectHandler` does not. If any future handler needs to react to rejections (e.g., notifying an agent that requested a hire), it will be missed. For symmetry and correctness, `RejectHandler` should also publish the event with `status: 'rejected'`.

---

### M6 — Cost dashboard `getMonthRange` called at render time, not query time

**File:** `cost-dashboard-page.tsx:14–18`

`getMonthRange()` is called at module/component render, not inside the `queryFn`. The `from`/`to` values are computed once on mount. If the page stays open past midnight on the last day of the month, the query will use stale boundaries. Move the call inside `queryFn` or derive it from a `useMemo` with a proper invalidation key based on the current month.

---

## Low Priority

### L1 — `maskedKey` computed with fixed 4-char prefix/suffix

**File:** `api-key-vault-service.ts:33–35`

For keys shorter than 8 characters, the fallback is `'****'`. This covers the edge case but keys 8 chars long would show full prefix + suffix (e.g., `abcd...efgh` where `abcdefgh` is the whole key). The condition `rawKey.length > 8` is correct for strictly-greater-than-8, but a key of exactly 8 chars shows `abcd...efgh` which reveals the full key. Change to `rawKey.length > 8` → `rawKey.length >= 9`, or use `rawKey.length > 8` and ensure the mask hides the overlap. Current logic is `rawKey.length > 8` which means 8-char keys fall through to `****` — actually fine. No change needed, but worth a clarifying comment.

---

### L2 — `byAgent` renders UUIDs truncated to 8 chars in cost dashboard

**File:** `cost-dashboard-page.tsx:75–77`

The UI shows `row.agentId.slice(0, 8)…` — not a bug but unhelpful UX. A future improvement would be to resolve agent names via a lookup or join in the backend summary query.

---

### L3 — `StoreApiKeyDto` does not validate `provider` against an allowlist

**File:** `store-api-key-dto.ts`

`provider` is `z.string().min(1)` with no enum constraint. Combined with the Anthropic-only validation (C2), arbitrary provider strings will be stored and then fail validation silently.

---

## Edge Cases Found by Scout

- **scheduler-service.ts** triggers `ReconcileBudgetsCommand` on a cron — the stub body (H1) means this runs a no-op on a schedule.
- **company-api-key-model.ts** `maskedKey` column was added via `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` (migration), but `CompanyApiKeyModel` entity declares it `nullable: true`. Existing rows before the migration will have `null` maskedKey — `listMasked` will return `maskedKey: null` which the frontend must handle gracefully (currently the API type likely allows null, check `i-api-key-vault-service.ts`).
- **`approval_comments` table** has no corresponding TypeORM entity registered in `shared-module.ts`. Querying or inserting comments will fail at runtime unless done through raw SQL. Either register `ApprovalCommentModel` or remove the table from the migration.
- **`agent_api_keys` table** created in migration but `AgentApiKeyModel` entity and `AgentApiKeyRepository` are imported in `shared-module.ts` — these are registered correctly. No issue.
- **Double-resolution race**: two board users approving the same approval concurrently will both pass the `status !== 'pending'` check (there is no optimistic lock or check), resulting in two `ApprovalResolvedEvent` publishes and potentially two agent auto-creations for the same hire request.

---

## Positive Observations

- AES-256-GCM implementation is correct: random 12-byte IV per encryption, GCM auth tag stored alongside ciphertext, no ECB mode, key from base64-encoded config value.
- `CompanyAccessGuard` correctly scopes all board routes — the guard is applied at controller class level, not per-method.
- CQRS command/query separation is clean and consistent throughout Phase 8 additions.
- `approve-command.ts` correctly performs `approval.companyId !== cmd.companyId` ownership check before mutation — good pattern that should be replicated in revoke (C1).
- Migration uses `CREATE TABLE IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS` — safe for replay.
- `CostEventModel` uses `@Index` on `['companyId', 'createdAt']` matching the migration index — consistent.
- Zod DTOs used for all input validation — no raw `class-validator` decorators.
- Frontend pages handle loading, error, and empty states — no uncaught rendering failures.

---

## Recommended Actions (Prioritised)

1. **[Critical]** Add `companyId` ownership check to `RevokeApiKeyCommand` / `ApiKeyVaultService.revoke()` — prevents cross-tenant key revocation.
2. **[Critical]** Gate `validate()` Anthropic API call behind `provider === 'anthropic'` check — prevents mis-validation of non-Anthropic keys.
3. **[High]** Derive `resolvedByUserId` from authenticated actor, not request body — prevents false audit attribution.
4. **[High]** Implement or stub-guard `ReconcileBudgetsHandler` — the scheduled no-op is misleading and may mask future drift.
5. **[Medium]** Add `RejectHandler` → publish `ApprovalResolvedEvent` for symmetry.
6. **[Medium]** Fix `ApprovalCommentModel` registration in `shared-module.ts` (or remove the table) — table exists but entity is not registered.
7. **[Medium]** Add `DROP TABLE IF EXISTS "agent_api_keys"` to migration `down()`.
8. **[Medium]** Add DB `CHECK` constraints or TypeScript enum for `approvals.status` and `approvals.type`.
9. **[Medium]** Fix `decrypt()` return to explicitly encode both chunks as UTF-8 (`Buffer.concat` approach).
10. **[Medium]** Add optimistic locking or re-check status inside a transaction in `ApproveHandler` to prevent double-resolution race.

---

## Unresolved Questions

1. Is `ReconcileBudgetsHandler` intentionally a no-op placeholder, or was the implementation accidentally omitted? The scheduler reference implies it should run real reconciliation.
2. Does the frontend `approvalsApi.approve()` send `resolvedByUserId` from the auth session token or from a separate field? If the backend enforces actor identity (after fixing H2), the frontend call signature needs updating.
3. Which providers are supported by the vault? An explicit allowlist at DTO level (L3) and per-provider validation routing (C2) depends on this being defined.
