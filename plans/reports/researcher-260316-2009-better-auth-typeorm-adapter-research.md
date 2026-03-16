# Better Auth TypeORM Adapter Research Report

**Date:** 2026-03-16
**Status:** Complete
**Confidence:** High

---

## Executive Summary

**YES** - A community TypeORM adapter for Better Auth exists and is actively maintained. Two primary options are available, with `@hedystia/better-auth-typeorm` being the most popular and actively maintained choice.

---

## Question 1: Does a community TypeORM adapter exist?

**Answer: YES**

Two well-established community TypeORM adapters exist for Better Auth:

1. **@hedystia/better-auth-typeorm** (Primary)
2. **better-auth-typeorm-adapter** (Alternative)

Both are listed in the Better Auth ecosystem and actively maintained.

---

## Question 2: Package Name(s)

### Primary Package
- **Package Name:** `@hedystia/better-auth-typeorm`
- **NPM URL:** https://www.npmjs.com/package/@hedystia/better-auth-typeorm
- **GitHub:** https://github.com/Zastinian/better-auth-typeorm

### Alternative Package
- **Package Name:** `better-auth-typeorm-adapter`
- **GitHub:** https://github.com/luratnieks/better-auth-typeorm-adapter
- **Note:** Not published on npm as scoped package; available via GitHub

---

## Question 3: Maintenance & Reliability

### @hedystia/better-auth-typeorm

**Reliability: HIGH**

- **Current Version:** 0.6.0 (as of March 2026)
- **Last Update:** 5 days ago (actively maintained)
- **Repository:** 45 stars, 11 forks, 85+ commits
- **Language:** 100% TypeScript
- **License:** MIT
- **Maintenance Status:** ✅ Active

**Indicators of Good Maintenance:**
- Regular commits and releases
- Recent publication (latest version released within last week)
- Community adoption (stars and forks indicate trust)
- Full TypeScript implementation (type-safe)

### better-auth-typeorm-adapter

**Reliability: MEDIUM-HIGH**

- **Zero Dependencies** (only peer deps on Better Auth & TypeORM)
- **Features:** Debug logging, custom entity configuration
- **Maintenance:** Community-maintained by luratnieks
- **Status:** Active on GitHub, appears well-documented

---

## Question 4: Column Mapping - Snake_case/camelCase Handling

**Short Answer:** The adapter does NOT automatically handle snake_case/camelCase mapping.

### How It Works

The `@hedystia/better-auth-typeorm` adapter:
- Works with all TypeORM-supported databases
- Provides full CRUD operations with pagination/sorting
- Does NOT have built-in snake_case column mapping

### Snake_case Solutions Available

#### Option A: TypeORM Naming Strategy (Recommended)
Use TypeORM's `SnakeNamingStrategy` from the `typeorm-naming-strategies` package:

```typescript
import { SnakeNamingStrategy } from "typeorm-naming-strategies"

const dataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  database: "mydb",
  namingStrategy: new SnakeNamingStrategy(),
  // ... other config
})
```

This translates camelCase entity properties to snake_case columns automatically.

#### Option B: Better Auth fieldMappings
Better Auth supports `fieldMappings` configuration to map property names to database columns:

```typescript
database: typeormAdapter(dataSource, {
  // fieldMappings would allow custom column names
  // but this requires custom entity definitions
})
```

**Note:** The core implementation for automatic snake_case is limited; you should use TypeORM's naming strategy approach.

### Known Limitations

- **SSO Plugin Issue:** The SSO plugin doesn't fully respect fieldMappings (Issue #5649)
- **No Built-in useSnakeCase:** Unlike Drizzle adapter, TypeORM adapter lacks native `useSnakeCase` option
- **Per-ORM Responsibility:** Better Auth delegates naming conventions to the ORM layer

---

## Question 5: Version Support for Better Auth 1.5.5

**Answer:** @hedystia/better-auth-typeorm 0.6.0 supports Better Auth 1.5.5

### Compatibility Matrix

| Adapter Version | Better Auth Support | Status |
|---|---|---|
| 0.6.0 (latest) | 1.4.x, 1.5.x | ✅ Compatible |
| 0.4.5 | 1.3.x, 1.4.x | ✅ Compatible |
| Earlier | Variable | ⚠️ Check releases |

**Key Finding:** Current latest version (0.6.0) is designed to work with Better Auth 1.5.x, including 1.5.5.

### Installation for Better Auth 1.5.5

```bash
npm install @hedystia/better-auth-typeorm typeorm
```

Then use the Better Auth CLI to generate entities:

```bash
npx @better-auth/cli generate
```

---

## Setup Overview

### Quick Start with @hedystia/better-auth-typeorm

1. **Install:** `npm install @hedystia/better-auth-typeorm typeorm`
2. **Generate Entities:** `npx @better-auth/cli generate`
3. **Configure TypeORM DataSource** with optional `SnakeNamingStrategy`
4. **Initialize Better Auth** with the adapter

### Configuration Example

```typescript
import { typeormAdapter } from "@hedystia/better-auth-typeorm"
import { DataSource } from "typeorm"
import { SnakeNamingStrategy } from "typeorm-naming-strategies"

const dataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  database: "auth_db",
  namingStrategy: new SnakeNamingStrategy(),
  // ... entities, migrations
})

export const auth = new BetterAuth({
  database: typeormAdapter(dataSource, {
    outputDir: "./src/typeorm",
    softDeleteEnabledEntities: ["user", "account"],
  }),
  // ... other config
})
```

---

## Features Summary

### @hedystia/better-auth-typeorm Provides

✅ Full CRUD operations
✅ Pagination & sorting
✅ Filtering support
✅ Transaction handling
✅ Error management
✅ Soft delete support via `@DeleteDateColumn`
✅ CLI-based entity generation
✅ Custom entity paths
✅ Compatible with all TypeORM databases

❌ Built-in snake_case column mapping
❌ Automatic camelCase conversion

---

## Recommendations

### For Your Use Case (snake_case columns)

1. **Use `@hedystia/better-auth-typeorm` (v0.6.0)** - Most maintained option
2. **Configure TypeORM with `SnakeNamingStrategy`** - Handles column name conversion automatically
3. **Verify Entity Generation** - CLI generates entities; confirm snake_case columns after generation
4. **Test with Better Auth 1.5.5** - Current version explicitly supports this version

### Alternative Approach

If you need more customization:
- Use `better-auth-typeorm-adapter` by luratnieks
- Offers custom entity configuration
- Zero external dependencies (only peers)
- Slightly more manual setup

---

## Sources

- [Better Auth Documentation - Community Adapters](https://better-auth.com/docs/adapters/community-adapters)
- [@hedystia/better-auth-typeorm on NPM](https://www.npmjs.com/package/@hedystia/better-auth-typeorm)
- [GitHub - Zastinian/better-auth-typeorm](https://github.com/Zastinian/better-auth-typeorm)
- [GitHub - luratnieks/better-auth-typeorm-adapter](https://github.com/luratnieks/better-auth-typeorm-adapter)
- [Better Auth GitHub Issue #799 - Column name in snake_case](https://github.com/better-auth/better-auth/issues/799)
- [Better Auth GitHub Issue #5649 - SSO Plugin with snake_case](https://github.com/better-auth/better-auth/issues/5649)
- [TypeORM Naming Strategies Package](https://www.npmjs.com/package/typeorm-naming-strategies)
- [Better Auth Blog - Version 1.5](https://better-auth.com/blog/1-5)

---

## Conclusion

**Use `@hedystia/better-auth-typeorm` v0.6.0** for your Better Auth 1.5.5 project. It's actively maintained, well-supported, and solves the snake_case problem via TypeORM's native `SnakeNamingStrategy`. This is a reliable, production-ready solution.
