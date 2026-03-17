# Phase 6: Frontend Pages

## Context Links
- Parent: [plan.md](./plan.md)
- Dependencies: Phase 1 (shared types), Phase 2 (auth endpoints), Phase 3 (CRUD endpoints)
- Docs: [13-frontend-architecture](../../docs/blueprint/03-architecture/13-frontend-architecture.md), [17-api-design](../../docs/blueprint/04-data-and-api/17-api-design.md)
- Research: [researcher-02](./research/researcher-02-frontend-ai-system.md) — React 19 + Vite + Tailwind 4 + shadcn/ui

## Overview
- **Date:** 2026-03-16
- **Priority:** P2
- **Status:** complete
- **Review:** approved
- **Description:** Build all frontend pages using React 19 + React Router + React Query + Tailwind 4 + shadcn/ui. API client layer, layout components, auth pages, dashboard, agents, issues, org chart, settings.

## Key Insights
- Tailwind v4: CSS-first config via `@theme` in globals.css, OKLCH colors
- shadcn/ui: components.json with cssVariables=true for Tailwind v4
- React Query: `useQuery` for reads, `useMutation` with optimistic updates for writes
- React Router v6: nested routes, outlet layout pattern
- API client: thin fetch wrapper, per-domain modules (companies, agents, issues)

## Requirements

### Functional
- **API Client Layer:**
  - Base fetch wrapper (auth headers, error handling, base URL)
  - Per-domain modules: auth, companies, agents, issues, goals, projects, approvals, heartbeat-runs, costs, templates, dashboard
- **Layout:**
  - Sidebar (company nav, agent list, settings)
  - TopBar (user menu, company switcher, notifications)
  - Breadcrumbs (auto-generated from route)
- **Auth Pages:** Sign In, Sign Up (email + OAuth buttons)
- **Dashboard:** Company overview — agent count, active runs, issue stats, cost summary, recent activity
- **Agents:** List (cards + status badges), Detail (config, runtime state, runs list, org position)
- **Issues:** List (kanban board + table view), Detail (description, comments, attachments, run history)
- **Org Chart:** Visual agent hierarchy (reportsTo tree)
- **Settings:** Company settings, API key management, member management
- **Runs:** Run detail (event stream, logs, cost)

### Non-Functional
- Dark mode toggle (class-based, ThemeProvider)
- Responsive: desktop-first, mobile-friendly sidebar collapse
- Loading states: skeleton loaders via shadcn/ui Skeleton
- Error boundaries per route
- Files < 200 lines

## Architecture

```
src/
├── main.tsx              — entry point
├── app.tsx               — Router + QueryClientProvider + ThemeProvider
├── globals.css           — Tailwind 4 @theme
├── lib/
│   ├── api-client.ts     — base fetch wrapper
│   ├── api/              — per-domain API modules
│   └── query-keys.ts     — React Query key factory
├── hooks/
│   ├── use-auth.ts       — auth state + actions
│   ├── use-company.ts    — current company context
│   └── use-theme.ts      — dark mode toggle
├── components/
│   ├── layout/           — Sidebar, TopBar, Breadcrumbs, AppShell
│   ├── ui/               — shadcn/ui components (auto-generated)
│   ├── agents/           — AgentCard, AgentStatusBadge, OrgChart
│   ├── issues/           — IssueCard, KanbanBoard, IssueStatusBadge
│   ├── runs/             — RunCard, RunEventStream, RunTimeline
│   └── shared/           — StatusBadge, EmptyState, ConfirmDialog
├── pages/
│   ├── auth/             — sign-in, sign-up
│   ├── dashboard/        — company dashboard
│   ├── agents/           — list, detail
│   ├── issues/           — list, detail
│   ├── runs/             — detail
│   ├── settings/         — company, api-keys, members
│   └── onboarding/       — wizard (Phase 9)
└── providers/
    ├── auth-provider.tsx
    ├── company-provider.tsx
    └── theme-provider.tsx
```

## Related Code Files

### API Layer
- `src/lib/api-client.ts` — base fetch: headers, auth cookie, error handling
- `src/lib/api/auth-api.ts` — signUp, signIn, getSession, signOut
- `src/lib/api/companies-api.ts` — list, create, get, update, delete
- `src/lib/api/agents-api.ts` — list, create, get, update, pause, resume, terminate, wakeup
- `src/lib/api/issues-api.ts` — list, create, get, update, search
- `src/lib/api/goals-api.ts` — list, create, update
- `src/lib/api/projects-api.ts` — list, create, get, update
- `src/lib/api/approvals-api.ts` — list, create, approve, reject
- `src/lib/api/heartbeat-runs-api.ts` — list, get, getEvents, cancel
- `src/lib/api/costs-api.ts` — getSummary
- `src/lib/api/templates-api.ts` — list, get
- `src/lib/api/dashboard-api.ts` — getSummary
- `src/lib/api/api-keys-api.ts` — list, store, delete, validate
- `src/lib/api/vm-api.ts` — getStatus, wake, hibernate
- `src/lib/query-keys.ts` — factory: agents.list(cid), agents.detail(id), etc.

### Layout Components
- `src/components/layout/app-shell.tsx` — sidebar + topbar + outlet
- `src/components/layout/sidebar.tsx` — nav links, company name, agent shortcuts
- `src/components/layout/top-bar.tsx` — user menu, company switcher
- `src/components/layout/breadcrumbs.tsx` — auto from route matches

### Page Components
- `src/pages/auth/sign-in-page.tsx`
- `src/pages/auth/sign-up-page.tsx`
- `src/pages/dashboard/dashboard-page.tsx`
- `src/pages/agents/agents-list-page.tsx`
- `src/pages/agents/agent-detail-page.tsx`
- `src/pages/issues/issues-list-page.tsx`
- `src/pages/issues/issue-detail-page.tsx`
- `src/pages/runs/run-detail-page.tsx`
- `src/pages/settings/company-settings-page.tsx`
- `src/pages/settings/api-keys-page.tsx`
- `src/pages/settings/members-page.tsx`

### Domain Components
- `src/components/agents/agent-card.tsx`
- `src/components/agents/agent-status-badge.tsx`
- `src/components/agents/org-chart.tsx`
- `src/components/issues/issue-card.tsx`
- `src/components/issues/issue-status-badge.tsx`
- `src/components/issues/kanban-board.tsx`
- `src/components/issues/kanban-column.tsx`
- `src/components/runs/run-card.tsx`
- `src/components/runs/run-event-stream.tsx`
- `src/components/runs/run-timeline.tsx`
- `src/components/shared/status-badge.tsx`
- `src/components/shared/empty-state.tsx`
- `src/components/shared/confirm-dialog.tsx`

### Providers + Hooks
- `src/providers/auth-provider.tsx` — session state, login/logout
- `src/providers/company-provider.tsx` — selected company context
- `src/providers/theme-provider.tsx` — dark mode
- `src/hooks/use-auth.ts`
- `src/hooks/use-company.ts`
- `src/hooks/use-theme.ts`

## Implementation Steps

1. **API client layer**
   - Base fetch: prepend VITE_API_BASE_URL, include credentials, parse JSON, throw on 4xx/5xx
   - Per-domain modules: thin wrappers calling base fetch
   - Query keys factory: `queryKeys.agents.list(companyId)` etc.

2. **Providers**
   - AuthProvider: call GET /api/auth/get-session on mount, expose user + isAuthenticated
   - CompanyProvider: selected companyId in state, persist to localStorage
   - ThemeProvider: toggle .dark class on documentElement

3. **Router setup**
   - Public routes: /sign-in, /sign-up
   - Protected routes (wrapped in AuthProvider check):
     - / → redirect to /dashboard
     - /dashboard
     - /agents, /agents/:id
     - /issues, /issues/:id
     - /runs/:rid
     - /settings, /settings/api-keys, /settings/members
   - AppShell layout wraps all protected routes

4. **Layout components**
   - Sidebar: shadcn/ui NavigationMenu, company name, nav links (Dashboard, Agents, Issues, Settings)
   - TopBar: user avatar dropdown (profile, sign out), company switcher (if multiple)
   - Breadcrumbs: useMatches() from React Router

5. **Auth pages**
   - Sign In: email + password form, Google/GitHub OAuth buttons
   - Sign Up: name + email + password form, OAuth buttons
   - Use useMutation for form submission

6. **Dashboard page**
   - useQuery: dashboard summary (agent count, active runs, issue breakdown, cost this month)
   - Cards: agent status distribution, issue pipeline (mini kanban), recent activity list
   - Cost widget: monthly spend vs budget bar

7. **Agents pages**
   - List: grid of AgentCards, filter by status, search by name
   - AgentCard: avatar, name, role, status badge, last heartbeat time
   - Detail: tabs (Overview, Runs, Config, Org)
   - Overview tab: runtime state, current task, recent activity
   - Runs tab: paginated list of HeartbeatRuns
   - Config tab: current config JSON + revision history
   - Actions: pause, resume, terminate, wakeup buttons

8. **Issues pages**
   - List: toggle between KanbanBoard and table view
   - KanbanBoard: columns per status, drag-drop (future), issue cards
   - IssueCard: identifier, title, priority badge, assignee avatar
   - Detail: description (markdown render), comments thread, attachments, run history
   - Actions: edit, assign, change status

9. **Run detail page**
   - Run metadata: agent, status, duration, cost
   - Event stream: scrollable log of RunEvents (like terminal output)
   - Timeline: visual progress of run steps

10. **Settings pages**
    - Company: name, description, budget, runner config
    - API Keys: list stored keys (masked), add new, delete, validate
    - Members: list userCompanies, invite (future), change role, remove

11. **Shared components**
    - StatusBadge: generic colored badge (maps status → color)
    - EmptyState: illustration + message + CTA button
    - ConfirmDialog: shadcn/ui AlertDialog for destructive actions

## Todo List
- [x] API client (base fetch + all domain modules)
- [x] Query keys factory
- [x] AuthProvider + useAuth hook
- [x] CompanyProvider + useCompany hook
- [x] ThemeProvider + useTheme hook
- [x] Router setup (public + protected routes)
- [x] AppShell layout (Sidebar, TopBar, Breadcrumbs)
- [x] Auth pages (Sign In, Sign Up)
- [x] Dashboard page
- [x] Agents list page + AgentCard
- [x] Agent detail page (tabs)
- [x] Issues list page + KanbanBoard
- [x] Issue detail page
- [x] Run detail page + event stream
- [x] Settings pages (company, API keys, members)
- [x] Shared components (StatusBadge, EmptyState, ConfirmDialog)
- [x] Dark mode toggle
- [x] Responsive sidebar collapse

## Success Criteria
- All pages render with correct data from API
- Auth flow: sign up → sign in → dashboard (cookie persisted)
- Company context: switching company updates all queries
- Kanban board displays issues in correct columns
- Agent detail shows real-time status and run history
- Run event stream displays log output
- Dark mode toggle works across all pages
- No TypeScript errors, no console errors

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| shadcn/ui + Tailwind v4 compatibility | Medium | Medium | Pin versions, test component rendering early |
| Large page components > 200 lines | High | Low | Split into sub-components aggressively |
| API contract mismatch | Medium | Medium | Use shared Zod schemas for type safety |

## Security Considerations
- Credentials: include in fetch (cookies)
- No tokens in localStorage (session cookies only)
- CSRF: SameSite=Lax cookies + origin check
- API keys shown once then masked (frontend never stores raw key)
- XSS: React auto-escapes, no dangerouslySetInnerHTML

## Next Steps
- Phase 7: WebSocket hook for real-time updates
- Phase 9: Onboarding wizard pages
