# Code Standards & Conventions

## Principles

- **YAGNI:** You Aren't Gonna Need It — build only what's currently needed
- **KISS:** Keep It Simple, Stupid — prefer simple solutions over complex ones
- **DRY:** Don't Repeat Yourself — avoid code duplication through abstraction
- **Small Files:** Keep files under 200 LOC (forces logical modularization)
- **Self-Documenting:** Code should be clear without excessive comments

## TypeScript & General Conventions

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files | kebab-case | `company-controller.ts`, `create-company-command.ts` |
| Classes | PascalCase | `CompanyController`, `CreateCompanyCommand` |
| Interfaces | PascalCase (I prefix) | `ICompany`, `IAdapter` |
| Functions | camelCase | `createCompany()`, `getCompanyById()` |
| Constants | UPPER_SNAKE_CASE | `MAX_AGENTS_PER_COMPANY`, `DEFAULT_TIMEOUT_MS` |
| Variables | camelCase | `companyId`, `agentStatus` |
| Enums | PascalCase (singular) | `AgentStatus`, `IssueType` |
| Private fields | camelCase (# prefix in classes) | `#sessionId` |

### File Organization

Keep files focused and under 200 lines:

```typescript
// File: user-service.ts (Good: single responsibility)
export class UserService {
  constructor(private userRepository: IUserRepository) {}

  async getUser(userId: string): Promise<IUser> { ... }
  async updateUser(userId: string, data: UpdateUserDto): Promise<IUser> { ... }
}

// DO NOT: Multiple unrelated classes in one file
// DO NOT: Exceed 200 LOC (split into separate files)
```

### Import Organization

Group and order imports:

```typescript
// 1. Absolute imports (NestJS, third-party)
import { Injectable } from '@nestjs/common';
import { z } from 'zod';

// 2. Package imports
import { IUserRepository } from '@aicompany/shared';

// 3. Relative imports
import { UserSchema } from '../validators/user-schema';
import { logger } from '../utils/logger';
```

### Type Annotations

Always use explicit types:

```typescript
// Good
const companyId: string = req.params.id;
const isActive: boolean = company.status === 'active';
const agents: IAgent[] = await agentRepository.list(companyId);

// Avoid
const companyId = req.params.id;  // Type is inferred
const agents = await agentRepository.list(companyId);  // Unclear return type
```

### Null Safety

Use strict null checks (tsconfig.json requires this):

```typescript
// Good: Explicit handling
function getCompanyOrNull(id: string): ICompany | null {
  return company ?? null;
}

// Good: Optional chaining
const agentName = agent?.name ?? 'Unknown';

// Avoid: Non-null assertion (use sparingly)
const companyId = (company as any).id;  // Only when absolutely sure

// Better: Proper typing
const companyId = company.id;  // Already typed
```

## NestJS Patterns

### Controllers

**Location:** `apps/backend/src/presentation/controllers/impl/`

```typescript
// File: company-controller.ts (< 100 LOC)
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateCompanyCommand } from '@app/application/commands/company/create-company-command';
import { GetCompanyQuery } from '@app/application/queries/company/get-company-query';

@Controller('api/companies')
export class CompanyController {
  constructor(
    private commandBus: CommandBus,
    private queryBus: QueryBus,
  ) {}

  @Get(':id')
  async getCompany(@Param('id') id: string) {
    return this.queryBus.execute(new GetCompanyQuery(id));
  }

  @Post()
  async createCompany(@Body() dto: CreateCompanyDto) {
    return this.commandBus.execute(new CreateCompanyCommand(dto));
  }
}
```

### Commands (Mutations)

**Location:** `apps/backend/src/application/commands/`

```typescript
// File: create-company-command.ts
export class CreateCompanyCommand {
  constructor(public readonly dto: CreateCompanyDto) {}
}

@CommandHandler(CreateCompanyCommand)
export class CreateCompanyCommandHandler implements ICommandHandler<CreateCompanyCommand> {
  constructor(private companyRepository: ICompanyRepository) {}

  async execute(command: CreateCompanyCommand): Promise<ICompany> {
    const company = await this.companyRepository.save({
      name: command.dto.name,
      createdAt: new Date(),
    });
    return company;
  }
}
```

### Queries (Reads)

**Location:** `apps/backend/src/application/queries/`

```typescript
// File: get-company-query.ts
export class GetCompanyQuery {
  constructor(public readonly companyId: string) {}
}

@QueryHandler(GetCompanyQuery)
export class GetCompanyQueryHandler implements IQueryHandler<GetCompanyQuery> {
  constructor(private companyRepository: ICompanyRepository) {}

  async execute(query: GetCompanyQuery): Promise<ICompanyDto> {
    const company = await this.companyRepository.findById(query.companyId);
    if (!company) {
      throw new CompanyNotFoundException(query.companyId);
    }
    return this.toDto(company);
  }

  private toDto(company: ICompany): ICompanyDto {
    return {
      id: company.id,
      name: company.name,
      status: company.status,
    };
  }
}
```

### Guards (Authorization)

**Location:** `apps/backend/src/guard/`

```typescript
// File: company-access-guard.ts
@Injectable()
export class CompanyAccessGuard implements CanActivate {
  constructor(private userCompanyRepository: IUserCompanyRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const companyId = request.params.cid;

    if (!userId || !companyId) return false;

    const userCompany = await this.userCompanyRepository.findByUserAndCompany(
      userId,
      companyId,
    );
    return !!userCompany;
  }
}

// Usage in controller
@Get(':cid/issues')
@UseGuards(CompanyAccessGuard)
async getIssues(@Param('cid') companyId: string) { ... }
```

### Decorators (Custom)

**Location:** `apps/backend/src/presentation/decorators/`

```typescript
// File: current-actor-decorator.ts
export const CurrentActor = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): IActor => {
    const request = ctx.switchToHttp().getRequest();
    return {
      id: request.user?.id || request.agent?.id,
      type: request.user ? 'user' : 'agent',
      companyId: request.company?.id,
    };
  },
);

// Usage
@Get('issues')
async getIssues(@CurrentActor() actor: IActor) {
  return this.queryBus.execute(new ListIssuesQuery(actor.companyId));
}
```

### Repositories (Data Access)

**Location:** `apps/backend/src/infrastructure/repositories/`

**Pattern:** Implement domain interfaces, use TypeORM internally

```typescript
// Interface (domain layer)
export interface ICompanyRepository {
  save(company: ICompany): Promise<ICompany>;
  findById(id: string): Promise<ICompany | null>;
  list(criteria: ListCriteria): Promise<ICompany[]>;
}

// Implementation (infrastructure layer)
@Injectable()
export class CompanyRepository implements ICompanyRepository {
  constructor(
    @InjectRepository(CompanyModel) private orm: Repository<CompanyModel>,
  ) {}

  async save(company: ICompany): Promise<ICompany> {
    return this.orm.save(company);
  }

  async findById(id: string): Promise<ICompany | null> {
    return this.orm.findOne({ where: { id } });
  }

  async list(criteria: ListCriteria): Promise<ICompany[]> {
    const query = this.orm.createQueryBuilder('c');
    if (criteria.companyId) query.where('c.companyId = :cid', { cid: criteria.companyId });
    if (criteria.status) query.andWhere('c.status = :status', { status: criteria.status });
    return query.limit(criteria.limit).offset(criteria.offset).getMany();
  }
}
```

### TypeORM Models (Database Entities)

**Location:** `apps/backend/src/infrastructure/persistence/models/`

```typescript
// File: company-model.ts
@Entity('companies')
export class CompanyModel extends BaseModel {
  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'enum', enum: CompanyStatus, default: CompanyStatus.Active })
  status!: CompanyStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @OneToMany(() => AgentModel, (agent) => agent.company, { cascade: true })
  agents!: AgentModel[];

  @OneToMany(() => IssueModel, (issue) => issue.company, { cascade: true })
  issues!: IssueModel[];
}
```

### Multi-Tenancy (companyId Scoping)

All queries must be scoped by companyId:

```typescript
// GOOD: Query scoped by companyId
async getIssues(companyId: string, filter?: IssueFilter): Promise<IIssue[]> {
  return this.orm.find({
    where: {
      companyId,  // Always include
      status: filter?.status,
    },
  });
}

// BAD: Missing companyId scope
async getIssues(filter?: IssueFilter): Promise<IIssue[]> {
  return this.orm.find({
    where: { status: filter?.status },  // Could return issues from other companies!
  });
}
```

## Validation with Zod

**Location:** `apps/backend/src/presentation/dtos/` or `packages/shared/src/schemas/`

```typescript
// File: create-company-dto.ts
import { z } from 'zod';

export const CreateCompanySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  budget: z.number().positive().optional(),
});

export type CreateCompanyDto = z.infer<typeof CreateCompanySchema>;

// Usage in controller
@Post()
async createCompany(@Body(new ZodValidationPipe(CreateCompanySchema)) dto: CreateCompanyDto) {
  return this.commandBus.execute(new CreateCompanyCommand(dto));
}
```

## Error Handling

### Custom Exceptions

**Location:** `apps/backend/src/domain/exceptions/`

```typescript
// File: company-not-found-exception.ts
export class CompanyNotFoundException extends NotFoundException {
  constructor(companyId: string) {
    super(`Company ${companyId} not found`);
    this.name = 'CompanyNotFoundException';
  }
}

// Throw in service
if (!company) {
  throw new CompanyNotFoundException(id);
}

// NestJS automatically maps to HTTP 404
```

### Try-Catch Patterns

```typescript
// Good: Specific error handling
try {
  await this.databaseService.connect();
} catch (error) {
  if (error instanceof ConnectionError) {
    logger.error('Database connection failed', error);
    throw new ServiceUnavailableException();
  }
  throw error;  // Re-throw unknown errors
}

// Avoid: Catching all without handling
try {
  await this.databaseService.connect();
} catch (error) {
  // Silently ignore
}
```

## Testing Standards

### Test File Naming

```typescript
// Unit test
feature.spec.ts

// Integration test
feature.e2e.ts

// Example: create-company-command.spec.ts
```

### Test Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateCompanyCommandHandler } from './create-company-command';

describe('CreateCompanyCommandHandler', () => {
  let handler: CreateCompanyCommandHandler;
  let mockRepository: ICompanyRepository;

  beforeEach(() => {
    mockRepository = {
      save: vi.fn(),
    };
    handler = new CreateCompanyCommandHandler(mockRepository);
  });

  it('should create a company with valid input', async () => {
    const dto = { name: 'Test Company' };
    const command = new CreateCompanyCommand(dto);

    mockRepository.save.mockResolvedValue({ id: '1', ...dto });

    const result = await handler.execute(command);

    expect(result).toEqual({ id: '1', name: 'Test Company' });
    expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining(dto));
  });

  it('should throw for empty name', async () => {
    const dto = { name: '' };
    const command = new CreateCompanyCommand(dto);

    await expect(handler.execute(command)).rejects.toThrow();
  });
});
```

### Mocking Guidelines

- Use `vi.fn()` for function mocks
- Mock only external dependencies (database, APIs)
- Don't mock classes under test
- Verify both return values and side effects

## React Frontend Standards

### File Naming

```typescript
// Components: PascalCase
CompanyDashboard.tsx
IssueList.tsx
AgentCard.tsx

// Hooks: camelCase with use prefix
useCompanyQuery.ts
useIssueFilters.ts

// Utils: camelCase
formatCurrency.ts
validateEmail.ts
```

### Component Structure

```typescript
// File: CompanyDashboard.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ICompany } from '@aicompany/shared';

interface CompanyDashboardProps {
  companyId: string;
  onNavigate?: (route: string) => void;
}

export function CompanyDashboard({
  companyId,
  onNavigate,
}: CompanyDashboardProps) {
  const [filter, setFilter] = useState<string>('');
  const { data: company, isLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => fetchCompany(companyId),
  });

  if (isLoading) return <LoadingSpinner />;
  if (!company) return <NotFound />;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{company.name}</h1>
      {/* Content */}
    </div>
  );
}
```

### Styling with Tailwind CSS 4

```typescript
// Use Tailwind classes directly
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  <h2 className="text-lg font-semibold text-gray-900">Issues</h2>
  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
    New Issue
  </button>
</div>

// Avoid: Inline styles
<div style={{ display: 'flex', padding: '16px' }}>  // Bad
```

## Commit & Git Standards

### Conventional Commits

```bash
# Format: <type>(<scope>): <description>

# Examples:
git commit -m "feat(company): add company creation endpoint"
git commit -m "fix(guard): resolve company access guard bug"
git commit -m "docs(api): update API routes documentation"
git commit -m "test(issue): add checkout workflow tests"
git commit -m "refactor(command): simplify command handler structure"

# Types: feat, fix, docs, test, refactor, chore, style, perf
```

### Commit Hygiene

- One logical change per commit
- Keep commits focused and small
- Write clear, descriptive messages
- Don't commit debugging code or console.logs
- Don't commit sensitive info (.env files, API keys)

## Project Structure Rules

### What Goes Where

| Category | Location |
|----------|----------|
| Domain logic | `domain/` (entities, exceptions, interfaces) |
| Use cases | `application/` (commands, queries) |
| Database | `infrastructure/persistence/` |
| APIs | `infrastructure/http/` or `presentation/` |
| HTTP layer | `presentation/controllers/`, `dtos/` |
| Shared code | `packages/shared/` |
| Adapter plugins | `packages/adapters/` |
| Utilities | `packages/adapter-utils/` |

### Module Dependencies (Clean Architecture)

```
Presentation (Controllers)
  ↓
Application (Commands/Queries)
  ↓
Domain (Entities, Interfaces)
  ↓
Infrastructure (Repositories, DB)

(Shared code accessible to all layers)
```

**Never violate:** Don't import from Presentation into Domain

## Performance Guidelines

- **Query Performance:** Always paginate large result sets
- **Database Indexes:** Index on companyId, userId, agentId (critical for multi-tenancy)
- **Caching:** Use Redis for frequently accessed data (planned for Phase 7)
- **API Response Times:** Target < 200ms at p95 for typical queries
- **File Size:** Keep all code files under 200 LOC (encourages modularization)

## Documentation in Code

```typescript
// Good: Brief comment explaining why (not what)
// Multi-tenancy requires filtering by companyId to prevent data leaks
async listIssues(companyId: string): Promise<IIssue[]> {
  return this.repository.find({ companyId });
}

// Avoid: Obvious comments
// Get the company by ID
async getCompany(id: string): Promise<ICompany> {
  return this.repository.findById(id);
}

// Avoid: Outdated comments
// This was a workaround for bug #123 (but bug has been fixed)
```

## Security Checklist

- [ ] All queries scoped by companyId
- [ ] User authentication verified on all endpoints
- [ ] API keys encrypted in database
- [ ] Secrets not committed to git
- [ ] SQL injection prevented (use parameterized queries)
- [ ] CORS configured correctly
- [ ] Rate limiting enabled (if applicable)
- [ ] Input validation with Zod schemas
- [ ] Error messages don't leak system details

---

**Last Updated:** March 2026
**Version:** 1.0
**Reference:** [codebase-summary.md](./codebase-summary.md) for file locations
