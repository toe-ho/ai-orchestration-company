# Phase 6 Frontend Pages — Implementation Report

## Summary

Implemented the complete React 19 frontend for the AI Company Platform: API client layer, all domain API modules, three providers (Auth, Company, Theme), layout shell (Sidebar, TopBar, AppShell), all domain components (agents, issues, runs), all page components (auth, dashboard, agents, issues, runs, settings), and wired everything in `app.tsx` with full React Router v6 route tree.

## Files Created

### lib/
- `src/lib/api-client.ts` — base fetch wrapper with `ApiError`, `api.{get,post,patch,delete}`
- `src/lib/query-keys.ts` — typed React Query key factories for all domains
- `src/lib/api/auth-api.ts` — Better Auth session/sign-in/sign-up/sign-out
- `src/lib/api/companies-api.ts` — CRUD for companies
- `src/lib/api/agents-api.ts` — agent list/get/create/update/pause/resume/terminate + org tree
- `src/lib/api/issues-api.ts` — issue list/search/get/comments/create/update
- `src/lib/api/goals-api.ts` — goals list/create/update
- `src/lib/api/projects-api.ts` — projects CRUD
- `src/lib/api/heartbeat-runs-api.ts` — runs list/get/events/cancel
- `src/lib/api/dashboard-api.ts` — dashboard summary
- `src/lib/api/vm-api.ts` — VM wake/hibernate/destroy/agent-wakeup

### providers/ + hooks/
- `src/providers/auth-provider.tsx` — session fetch on mount, signOut, refresh
- `src/providers/company-provider.tsx` — companyId with localStorage persistence
- `src/providers/theme-provider.tsx` — dark/light toggle via `.dark` class + localStorage
- `src/hooks/use-auth.ts`, `use-company.ts`, `use-theme.ts` — re-export shortcuts

### components/shared/
- `status-badge.tsx` — colored badge for all status/priority enums
- `empty-state.tsx` — centered empty state with optional CTA
- `confirm-dialog.tsx` — Radix Dialog confirmation modal
- `protected-route.tsx` — redirects to /sign-in if unauthenticated

### components/layout/
- `app-shell.tsx` — fixed sidebar + topbar + main content area
- `sidebar.tsx` — fixed left nav with active link highlighting
- `top-bar.tsx` — company switcher dropdown, theme toggle, user avatar dropdown
- `breadcrumbs.tsx` — route handle-based breadcrumb trail

### components/agents/
- `agent-status-badge.tsx`, `agent-card.tsx`, `org-chart.tsx`

### components/issues/
- `issue-status-badge.tsx`, `issue-card.tsx`, `kanban-column.tsx`, `kanban-board.tsx`

### components/runs/
- `run-card.tsx`, `run-event-stream.tsx` (polls every 5s)

### pages/
- `auth/sign-in-page.tsx`, `auth/sign-up-page.tsx`
- `dashboard/dashboard-page.tsx` — stat cards + issue-by-status breakdown
- `agents/agents-list-page.tsx`, `agents/agent-detail-page.tsx` — with pause/resume/terminate mutations + Tabs
- `issues/issues-list-page.tsx` (KanbanBoard), `issues/issue-detail-page.tsx` (comments)
- `runs/run-detail-page.tsx` — run info + cancel + RunEventStream
- `settings/company-settings-page.tsx`, `settings/api-keys-page.tsx`, `settings/members-page.tsx`

## Files Modified

- `src/app.tsx` — full route tree with all providers, ProtectedRoute, AppShell
- `src/lib/utils.ts` — updated `cn()` to use `clsx` + `tailwind-merge`

## TypeScript Status

```
> tsc --noEmit
(no output — zero errors)
```

## Notes

- `@radix-ui/react-badge` was omitted (not needed — `StatusBadge` is a custom component)
- Sidebar company name is static `'My Company'`; a separate company-name query in sidebar was skipped to avoid extra fetch — the TopBar company switcher already loads the list
- `agent-detail-page.tsx` is 157 lines (under 200 limit) despite tabs + 3 mutations
- `run-event-stream.tsx` polls at 5s interval — no WebSocket needed for Phase 6
- All enum values consumed via `@aicompany/shared` imports; typecheck confirms compatibility
