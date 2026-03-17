# Code Review: Phase 6 Frontend Implementation

**Date:** 2026-03-17
**Scope:** apps/web/src — lib/, providers/, hooks/, components/, pages/, app.tsx
**Files reviewed:** 49 files, ~1,658 LOC total
**TypeScript check:** PASSED (0 errors, strict mode enabled)
**Linting:** ESLint not installed in project — not executed

---

## Overall Assessment

Solid, production-oriented frontend. Clean separation of concerns: API layer, query keys, providers, hooks, components, pages. All files well under 200-line limit. No `any` types. No token storage in localStorage (cookies only for auth). No `dangerouslySetInnerHTML`. TypeScript strict mode passes cleanly. YAGNI/KISS/DRY principles respected throughout.

**Score: 8.7 / 10** — Not auto-approved (score < 9.5). See medium and high priority items below.

---

## Critical Issues

None.

---

## High Priority

### H1 — `setTimeout` without cleanup in CompanySettingsPage (memory leak / stale closure)

`/apps/web/src/pages/settings/company-settings-page.tsx` line 36:
```ts
setTimeout(() => setSaved(false), 2000);
```
No `clearTimeout` on component unmount or on re-trigger. If the component unmounts before 2 s (e.g. user navigates away), the state update fires on an unmounted component. React 18 suppresses the warning but it still creates a dangling timer.

Fix: store the timer ID in a `useRef` and clear it in a `useEffect` cleanup, or use a library utility.

---

### H2 — `companyId` stored in `localStorage` without validation/sanitization

`/apps/web/src/providers/company-provider.tsx` lines 13-15:
```ts
const [companyId, setCompanyIdState] = useState<string | null>(
  () => localStorage.getItem(STORAGE_KEY),
);
```
The value is read from `localStorage` and used directly in every API URL (`/companies/${cid}/...`). A tampered value (e.g. `../admin`) could potentially affect URL path construction. The risk is mitigated by same-origin API calls, but no format validation (UUID check) is applied before use.

Fix: validate the stored value is a valid UUID before trusting it, discard otherwise.

---

### H3 — No error boundary — any render crash surfaces as blank screen

Zero `ErrorBoundary` components exist anywhere in the tree. A thrown error during render in any page component will unmount the entire app with no user feedback.

Fix: wrap `<AppShell>` (or individual route groups) in a React `ErrorBoundary` with a fallback UI.

---

## Medium Priority

### M1 — `invalidate` callback in AgentDetailPage not wrapped in `useCallback`

`/apps/web/src/pages/agents/agent-detail-page.tsx` line 33:
```ts
const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.agents.detail(companyId!, id!) });
```
Recreated on every render; passed as `onSuccess` to three mutations. TanStack Query doesn't re-register mutations on change, but the pattern is fragile — if `companyId` or `id` change between render and mutation completion, the closure captures the old values.

Fix: wrap with `useCallback([companyId, id, qc])`.

---

### M2 — `AgentCard` receives `companyId` prop but never uses it

`/apps/web/src/components/agents/agent-card.tsx`:
```tsx
interface AgentCardProps {
  agent: Agent;
  companyId: string;  // declared but unused
  className?: string;
}
```
The route link uses `agent.id` only. Dead prop adds noise.

Fix: remove `companyId` from `AgentCardProps` and the call site in `agents-list-page.tsx`.

---

### M3 — `RunEventStream` polling with no stop condition for terminal runs

`/apps/web/src/components/runs/run-event-stream.tsx` line 15:
```ts
refetchInterval: 5_000,
```
Polling runs indefinitely regardless of run status (`succeeded`, `failed`, `timed_out`, `cancelled`). The parent `RunDetailPage` knows `run.status` but does not pass it to `RunEventStream`.

Fix: accept an optional `isTerminal` prop and set `refetchInterval: isTerminal ? false : 5_000`.

---

### M4 — `QueryClient` created outside `React.StrictMode` check — no `queryClientRef` pattern

`/apps/web/src/main.tsx` lines 7-13:
```ts
const queryClient = new QueryClient({ ... });
```
Module-level instantiation is fine for production, but in `StrictMode` the component tree double-renders while the client is shared. This is the standard setup for React Query and technically correct, noting it for awareness. No change required unless SSR is introduced.

---

### M5 — Sidebar shows hardcoded `'My Company'` instead of company name

`/apps/web/src/components/layout/sidebar.tsx` line 25:
```tsx
{companyId ? 'My Company' : 'AI Platform'}
```
The top bar already queries and displays the real company name. The sidebar shows a placeholder. Minor UX inconsistency.

Fix: query company name in sidebar (or lift state), or accept `companyName` prop from a parent that already has it.

---

### M6 — Theme stored in `localStorage` may be invalid

`/apps/web/src/providers/theme-provider.tsx` line 15:
```ts
(localStorage.getItem(STORAGE_KEY) as Theme) ?? 'light'
```
Cast directly to `Theme` with no validation. An injected string like `"exploit"` won't break anything visible but the `theme === 'dark'` check will silently default to `'light'` behavior without setting the correct class.

Fix: validate: `const stored = localStorage.getItem(STORAGE_KEY); return stored === 'dark' ? 'dark' : 'light';`

---

## Low Priority

### L1 — `BrowserRouter` placed inside `CompanyProvider` and `AuthProvider`

`/apps/web/src/app.tsx` lines 22-48: router is a grandchild of `AuthProvider`. This prevents using `useNavigate` inside `AuthProvider` (e.g. for automatic redirect on 401). Not a current problem since navigate is unused in the provider, but order should be `BrowserRouter > AuthProvider > CompanyProvider` for future flexibility.

---

### L2 — `AgentDetailPage` checks `agent.status === 'active' || agent.status === 'running'` as string literal

Line 45:
```ts
const isActive = agent.status === 'active' || agent.status === 'running';
```
`AgentStatus` is an enum from `@aicompany/shared`. Comparing against string literals bypasses enum exhaustiveness. If enum values change, this silently breaks.

Fix: import and use `AgentStatus.Active` / `AgentStatus.Running`.

---

### L3 — `run-event-stream` renders `JSON.stringify` output in `<pre>` without size cap

Line 41-43: large event payloads render without truncation/virtualization. Low risk for current use but could cause performance issues with high-frequency agents.

---

### L4 — ESLint not installed

`package.json` lists `"lint": "eslint src --ext .ts,.tsx"` but ESLint is not in devDependencies and not installed. The `lint` script fails. For a production codebase this should be addressed.

---

## Security Observations (All Clear)

| Check | Result |
|-------|--------|
| Auth tokens in localStorage | None — session cookies via `credentials: 'include'` |
| XSS vectors (`dangerouslySetInnerHTML`) | None found |
| `innerHTML` manipulation | None found |
| Direct URL injection without encode | `encodeURIComponent` used in search, `URLSearchParams` for list params |
| Sensitive data in query keys | None |
| CSRF | Same-origin API with session cookies; standard SPA pattern; acceptable |
| Auth state bypassed | All protected routes guarded by `ProtectedRoute` + loading state check |
| Credentials in source | None |

---

## Positive Observations

- **Zero TypeScript errors** with `strict: true`. No `any` casts.
- **Consistent `enabled: !!companyId` pattern** — queries never fire without a company context.
- **All files well under 200 lines** — excellent modularity.
- **Proper `credentials: 'include'`** — session cookie transport is correct.
- **`ApiError` typed error class** — error handling is consistent across all forms and mutations.
- **Query key factory pattern** (`queryKeys`) — all cache keys namespaced under company scope.
- **Radix UI primitives** — accessible dropdowns, dialogs, and tabs out of the box.
- **React 19 + `React.StrictMode`** — modern stack, StrictMode enabled.
- **Clear loading/error/empty states** in every data-fetching page.
- **ConfirmDialog for destructive actions** — terminate and cancel require confirmation.

---

## Recommended Actions (Prioritized)

1. **H1** — Fix `setTimeout` leak in `company-settings-page.tsx` with `useRef` + `useEffect` cleanup.
2. **H2** — Validate UUID format of `companyId` read from localStorage before use.
3. **H3** — Add at least one `ErrorBoundary` wrapping `<AppShell>` or the route tree root.
4. **M3** — Pass run status to `RunEventStream` to stop polling on terminal states.
5. **M2** — Remove unused `companyId` prop from `AgentCard`.
6. **M5** — Display real company name in Sidebar (already available from TopBar query).
7. **M6** — Validate theme value from localStorage instead of casting.
8. **L4** — Add ESLint + `@typescript-eslint` to devDependencies.
9. **L2** — Use enum constants for agent status comparisons.

---

## Metrics

| Metric | Value |
|--------|-------|
| Total files | 49 |
| Total LOC | ~1,658 |
| Max file size | 125 lines (agent-detail-page.tsx) |
| TypeScript errors | 0 (strict mode) |
| `any` types | 0 |
| ESLint errors | N/A (not installed) |
| Error boundaries | 0 |
| Critical security issues | 0 |
| Score | 8.7 / 10 |
| Auto-approved | No (score < 9.5) |

---

## Unresolved Questions

1. Is there an intended CSRF protection mechanism on the API server beyond same-origin? (Double-submit cookie, `SameSite=Strict`?) Frontend has no CSRF token header; this relies entirely on server-side `SameSite` cookie config.
2. The `AuthSession.session` field is typed as `Record<string, unknown>` — is this intentional or should it reflect a concrete session shape from the backend?
3. `Breadcrumbs` component is defined but not used in `AppShell` — is it intended for a future navigation enhancement?
