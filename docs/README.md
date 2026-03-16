# Documentation Index

Welcome to the AI Company Platform documentation. This index helps you find the right document for your needs.

## Quick Start by Role

### For New Developers
1. Start here: [Project Overview & PDR](./project-overview-pdr.md) (5 min read)
2. Then read: [Codebase Summary](./codebase-summary.md) (15 min read)
3. Setup: [Deployment Guide - Local Dev](./deployment-guide.md#local-development-setup) (10 min)
4. Reference: [Code Standards](./code-standards.md) while coding
5. Deep dive: [System Architecture](./system-architecture.md) (20 min)

**Total onboarding time:** ~50 minutes to productive coding

### For DevOps / Operations
1. Start here: [Deployment Guide](./deployment-guide.md) (30 min read)
2. Reference: [System Architecture - Deployment](./system-architecture.md#deployment-architecture) (10 min)
3. Deep dive: [Code Standards - Security](./code-standards.md#security-checklist) (5 min)

### For Product / Project Managers
1. Start here: [Project Overview & PDR](./project-overview-pdr.md) (10 min read)
2. Track progress: [Development Roadmap](./project-roadmap.md) (15 min read)
3. Reference: Phase deliverables in roadmap for planning

### For Frontend Developers
1. Start here: [Design Guidelines](./design-guidelines.md) (20 min read)
2. Reference: [Code Standards - React](./code-standards.md#react-frontend-standards) (10 min)
3. Understand backend: [System Architecture - CQRS](./system-architecture.md#cqrs-pattern) (15 min)

### For Backend Developers
1. Start here: [Codebase Summary - Backend](./codebase-summary.md#backend-application) (15 min read)
2. Patterns: [Code Standards - NestJS](./code-standards.md#nestjs-patterns) (20 min)
3. Architecture: [System Architecture](./system-architecture.md) (30 min)
4. Reference: [Deployment Guide - Database](./deployment-guide.md#database-management) when needed

## Documentation by Topic

### Product & Strategy
- [Project Overview & PDR](./project-overview-pdr.md) — Vision, features, roadmap overview
- [Development Roadmap](./project-roadmap.md) — 9 phases, timeline, milestones

### Development
- [Code Standards](./code-standards.md) — Conventions, patterns, best practices
- [Codebase Summary](./codebase-summary.md) — File organization, architecture, LOC
- [System Architecture](./system-architecture.md) — Design, data flow, security

### Operations & Deployment
- [Deployment Guide](./deployment-guide.md) — Local setup, production, troubleshooting
- [Design Guidelines](./design-guidelines.md) — UI framework, components, accessibility

### Technical Deep Dives
- [blueprint/](./blueprint/) — 25+ detailed technical specifications
  - Product & vision (sections 00-01)
  - AI system design (sections 02)
  - Architecture & CQRS (sections 03-05)
  - Data & API (sections 06-09)
  - Operations & security (sections 10-12)
  - Frontend & deployment (sections 13-25)

## Document Structure

### Each document includes:
- **Overview** — Purpose and scope
- **Contents** — Section-by-section breakdown
- **Code examples** — Where applicable
- **Reference tables** — For quick lookup
- **Links** — Cross-references and related docs

## File Sizes (All Under 800 LOC Limit)

| Document | Lines | KB | Est. Read Time |
|----------|-------|----|----|
| project-overview-pdr.md | 170 | 7.3 | 10 min |
| codebase-summary.md | 410 | 15 | 20 min |
| code-standards.md | 619 | 17 | 30 min |
| system-architecture.md | 583 | 22 | 25 min |
| project-roadmap.md | 609 | 16 | 20 min |
| deployment-guide.md | 552 | 12 | 25 min |
| design-guidelines.md | 621 | 14 | 30 min |
| **TOTAL** | **3,564** | **103** | **160 min** |

## Common Questions

### "How do I get started developing?"
→ See [Deployment Guide - Local Setup](./deployment-guide.md#local-development-setup)

### "What are the code standards?"
→ See [Code Standards](./code-standards.md)

### "How is the codebase organized?"
→ See [Codebase Summary](./codebase-summary.md)

### "What's the system architecture?"
→ See [System Architecture](./system-architecture.md)

### "What phase are we in?"
→ See [Development Roadmap](./project-roadmap.md)

### "How do I deploy to production?"
→ See [Deployment Guide - Production](./deployment-guide.md#production-deployment-fly-io)

### "What's the product vision?"
→ See [Project Overview & PDR](./project-overview-pdr.md)

### "How do I build the UI?"
→ See [Design Guidelines](./design-guidelines.md)

### "Where's the detailed API spec?"
→ See [blueprint/12-api-architecture-nestjs.md](./blueprint/03-architecture/12-api-architecture-nestjs.md)

## Maintenance & Updates

### When to Update Documentation

- **Code changes:** Update within 1 day of merge to main
- **New phases:** Update roadmap before phase starts
- **New standards:** Add to code-standards.md before implementation
- **Deployment changes:** Update deployment-guide.md immediately

### How to Update

1. Identify which doc(s) need updating
2. Make changes locally
3. Review for accuracy and clarity
4. Commit with message: `docs: update {topic} for {reason}`
5. Verify links still work

### Reporting Issues

Found an error or gap?
- Create a GitHub issue with label `documentation`
- Or: Submit a pull request with fixes

## Navigation

**Parent:** [../README.md](../README.md)
**Sibling:** [./blueprint/README.md](./blueprint/README.md) — Technical specifications

---

**Last Updated:** March 16, 2026
**Total Coverage:** 100% of operational docs created
**Ready for:** Phase 4 development
