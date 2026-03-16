# Phase 9: Templates + Onboarding

## Context Links
- Parent: [plan.md](./plan.md)
- Dependencies: Phase 3 (company/agent CRUD), Phase 6 (frontend pages), Phase 8 (API key vault)
- Docs: [15-database-design](../../docs/blueprint/04-data-and-api/15-database-design.md), [17-api-design](../../docs/blueprint/04-data-and-api/17-api-design.md)

## Overview
- **Date:** 2026-03-16
- **Priority:** P3
- **Status:** pending
- **Review:** pending
- **Description:** Company templates CRUD + seed data (3 starter templates), CreateCompanyFromTemplate command, multi-step onboarding wizard UI, API key setup with validation, public template browsing.

## Key Insights
- Templates store agentConfigs as JSONB — array of pre-configured agent definitions
- CreateCompanyFromTemplate: creates company + all agents + default goal in one transaction
- Onboarding wizard: 4 steps (goal → template → API key → launch)
- Public template browsing pre-login (marketing page)
- Templates are seeded, not user-created (admin only in future)

## Requirements

### Functional
- **CompanyTemplate CRUD:**
  - Seed 3 templates: "AI SaaS Startup", "Marketing Agency", "Development Shop"
  - List templates (public, filterable by category)
  - Get template detail
- **CreateCompanyFromTemplate:**
  - Transaction: create company → create agents from agentConfigs → create default goal
  - Auto-set issuePrefix from template
  - Return created company with agents
- **Onboarding Wizard UI:**
  - Step 1: Define goal (company name + description + goal text)
  - Step 2: Choose template (browse cards, select one)
  - Step 3: API key setup (enter Anthropic key, validate, store)
  - Step 4: Review + Launch (summary, create button)
- **Public template controller:** browse templates without auth

### Non-Functional
- Template seed runs on first migration or via CLI command
- Wizard state persisted in React state (not server-side)
- API key validation before proceeding (call Anthropic /v1/models)

## Architecture

```
Onboarding Wizard (Frontend)
  Step 1: Goal ──────────────────────────────┐
  Step 2: Template ──────────────────────────┤
  Step 3: API Key ─── POST /api-keys ───────┤
  Step 4: Launch  ─── POST /companies/from-template
                                              │
                                              ▼
                    CreateCompanyFromTemplateHandler
                    ├── Create Company
                    ├── Create Agents (from template.agentConfigs)
                    ├── Create Default Goal
                    └── Return company + agents
```

## Related Code Files

### Application — Commands
- `application/commands/company/create-company-from-template-command.ts`
- `application/commands/company/create-company-from-template-handler.ts`

### Application — Queries
- `application/queries/template/list-templates-query.ts` + handler
- `application/queries/template/get-template-query.ts` + handler

### Infrastructure
- `infrastructure/repositories/template-repository.ts`
- `infrastructure/persistence/seeds/template-seed.ts` — 3 starter templates

### Presentation
- `presentation/controllers/impl/public/public-template-controller.ts` — unauthenticated
- `presentation/controllers/impl/board/board-template-controller.ts` — authenticated (for future admin)
- `presentation/controllers/dto/company/create-company-from-template-dto.ts`

### Frontend
- `src/pages/onboarding/onboarding-wizard-page.tsx` — wizard container
- `src/pages/onboarding/steps/goal-step.tsx` — Step 1
- `src/pages/onboarding/steps/template-step.tsx` — Step 2
- `src/pages/onboarding/steps/api-key-step.tsx` — Step 3
- `src/pages/onboarding/steps/launch-step.tsx` — Step 4
- `src/components/templates/template-card.tsx` — template preview card
- `src/components/templates/template-grid.tsx` — grid of template cards
- `src/pages/templates/public-templates-page.tsx` — pre-login browsing

## Implementation Steps

1. **Template entity + repository**
   - CompanyTemplate model already defined in Phase 1
   - TemplateRepository: findAll, findBySlug, findPublic
   - Query handlers: ListTemplatesHandler, GetTemplateHandler

2. **Template seed data**
   - Create template-seed.ts with 3 templates:
   - **"AI SaaS Startup"** (category: tech):
     - CEO (claude, strategic planning)
     - CTO (claude, technical architecture)
     - Engineer x2 (claude, code implementation)
     - Designer (claude, UI/UX)
   - **"Marketing Agency"** (category: marketing):
     - CEO (claude, strategy)
     - Marketer (claude, content + campaigns)
     - Designer (claude, creative assets)
     - PM (claude, project coordination)
   - **"Development Shop"** (category: tech):
     - CTO (claude, architecture)
     - Engineer x3 (claude, full-stack dev)
     - QA (claude, testing)
   - Each agent config: name, role, title, adapterType, adapterConfig, runtimeConfig
   - Run seed via migration or CLI: `pnpm db:seed`

3. **CreateCompanyFromTemplate handler**
   - Validate template exists
   - Transaction:
     - Create company with name, description, issuePrefix from template
     - Create UserCompany (owner role)
     - For each agentConfig in template: CreateAgent (reportsTo wiring)
     - Create default Goal from template.goalTemplate
   - Return { company, agents, goal }

4. **Public template controller**
   - `@AllowAnonymous()`
   - GET /api/templates — list public templates
   - GET /api/templates/:slug — get template detail

5. **Board template controller**
   - POST /api/companies/from-template — create company from template
   - Body: { templateSlug, companyName, description, goal }

6. **Frontend: public templates page**
   - Grid of TemplateCards showing name, description, category, agent count
   - CTA: "Get Started" → redirect to sign-up if not authenticated

7. **Frontend: onboarding wizard**
   - Multi-step form with progress indicator (1/4, 2/4, etc.)
   - State managed via React useState (wizard context)
   - **Step 1 (Goal):** text inputs for company name, description, goal
   - **Step 2 (Template):** TemplateGrid, select one, show agent preview
   - **Step 3 (API Key):** input for Anthropic API key, "Validate" button (calls POST validate), success/error feedback
   - **Step 4 (Launch):** summary of selections, "Create Company" button
   - On launch: POST /api-keys (store key) → POST /companies/from-template
   - On success: redirect to /dashboard

8. **Template card component**
   - Name, description, category badge
   - Agent count + role icons
   - Click to select (in wizard) or view detail (public page)

9. **Router updates**
   - Add /onboarding route (protected, no sidebar)
   - Add /templates route (public)
   - After sign-up: redirect to /onboarding if no companies

## Todo List
- [ ] Template repository (interface + impl)
- [ ] Template query handlers (list + get)
- [ ] Template seed data (3 templates)
- [ ] CreateCompanyFromTemplate command + handler
- [ ] Public template controller
- [ ] Board template controller + DTO
- [ ] Frontend: public templates page
- [ ] Frontend: TemplateCard + TemplateGrid components
- [ ] Frontend: onboarding wizard page
- [ ] Frontend: Step 1 — goal form
- [ ] Frontend: Step 2 — template selection
- [ ] Frontend: Step 3 — API key setup + validation
- [ ] Frontend: Step 4 — review + launch
- [ ] Router: /onboarding + /templates routes
- [ ] Test: create company from template (full flow)
- [ ] Test: wizard navigation (forward/back)

## Success Criteria
- 3 seed templates appear on public templates page
- Onboarding wizard: complete 4 steps → company created with agents
- API key validated before proceeding (reject invalid keys)
- Template agents created with correct hierarchy (reportsTo)
- Default goal created from template
- New users redirected to onboarding after sign-up
- Public templates page works without authentication

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Template schema changes break seeded data | Medium | Low | Version templates, migration updates seed |
| API key validation slow (network call) | Medium | Low | Show loading spinner, timeout after 10s |
| Wizard state lost on page refresh | Medium | Low | Accept it — wizard is short, localStorage if needed later |

## Security Considerations
- API key entered in wizard → stored encrypted immediately (Phase 8 vault)
- Raw key never persisted in frontend state beyond current session
- Public template endpoint has no sensitive data
- CreateCompanyFromTemplate requires authenticated session

## Next Steps
- Future: user-created templates (admin panel)
- Future: template marketplace
- Future: import/export company config
