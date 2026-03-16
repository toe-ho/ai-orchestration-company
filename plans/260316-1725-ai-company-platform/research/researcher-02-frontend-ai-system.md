# Research: Frontend & AI Execution System

## 1. React 19 + Vite + Tailwind v4 in Monorepo

**Setup Pattern:** Use `apps/` and `packages/` structure with pnpm workspaces + Turborepo.

```json
{
  "name": "@aicompany/root",
  "private": true,
  "packageManager": "pnpm@9+",
  "workspaces": ["apps/*", "packages/*"]
}
```

**Tailwind v4 Key Change:** Config moved from `tailwind.config.js` → CSS-first via `@theme` directive in `globals.css`.

```css
@import "tailwindcss";
@theme {
  --color-primary: hsl(214 88% 51%);
}
```

**Gotchas:** Each app/package needs its own `tailwind.config.ts` (PostCSS plugin), shared theme via CSS variables in packages. Turborepo caches built CSS artifacts—avoid race conditions with parallel builds on first setup.

**Version Lock:** React 19.x, Vite 5+, Tailwind 4.1+, pnpm 9+.

---

## 2. shadcn/ui + Tailwind v4 Theming & Dark Mode

**Installation:** Use `shadcn-ui init` with Tailwind v4 preset (auto-generates components.json with cssVariables=true).

**Dark Mode Setup:**
- Tailwind v4 defaults to `prefers-color-scheme`
- For manual toggle: add `.dark` selector mode in `tailwind.config.ts` + ThemeProvider that toggles `document.documentElement.classList`
- Colors auto-convert to OKLCH (replaces HSL for better color science)

**Theming Pattern:**
```css
@theme {
  --color-primary: okLch(53% 0.28 262);
  --color-secondary: okLch(60% 0.15 150);
}
```

Components inherit via CSS vars. No need to override individual component files.

---

## 3. React Query + WebSocket Real-Time Updates

**Two Patterns:**
1. **Query Invalidation** (event-driven): WebSocket → `queryClient.invalidateQueries({queryKey})` → refetch. Best for coarse-grain updates. Send compact events like `{entity: ["posts", "list"]}`.
2. **Direct Cache Update** (optimistic): WebSocket data → `queryClient.setQueryData(key, newData)`. Better for high-frequency small updates (avoid refetch storms).

**Optimistic Mutations:**
```javascript
useMutation({
  onMutate: async (newData) => {
    await queryClient.cancelQueries({queryKey: ['items']});
    const prev = queryClient.getQueryData(['items']);
    queryClient.setQueryData(['items'], old => [...old, newData]);
    return { prev };
  },
  onError: (_err, _vars, context) => queryClient.setQueryData(['items'], context.prev),
})
```

**WebSocket Hook:** Attach WebSocket listener in `useEffect`, use invalidation/setQueryData in listener callback. Cancel queries before mutations to avoid overwrites.

---

## 4. Claude CLI Adapter: Spawning & Context

**SDK Usage** (`@anthropic-ai/claude-code@latest`):
```javascript
import { spawnSync } from 'child_process';
const result = spawnSync('claude', [
  'code', '--file', 'context.md', 'your-prompt'
], { encoding: 'utf8', stdio: 'pipe' });
```

**stdin Limitation:** Direct piping (`echo "prompt" | claude`) fails—stdin not in raw mode for Ink terminal UI. Workaround: use `--file` or write prompt to temp file.

**--context-file:** Resume sessions with `--context-file path/to/.claude/session`. Stores execution state for multi-turn interactions.

**Structured Output:** Parse stdout (markdown) or capture stderr for errors. No built-in JSON mode—regex stdout or use wrapper.

**Gotcha:** Child process inherits env vars. Ensure `ANTHROPIC_API_KEY` available. Exit code 1 on failure. For long-running tasks, consider background spawn with event listeners.

---

## 5. Turborepo 2+ Best Practices

**turbo.json Pipeline:**
```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"],
      "cache": true
    },
    "test": {
      "dependsOn": ["build"],
      "cache": true
    }
  },
  "remoteCache": {
    "enabled": true,
    "signature": true
  }
}
```

**Remote Caching:** Requires Vercel account or custom server. Sign with `TURBO_REMOTE_CACHE_SIGNATURE_KEY`. Enable signatures via `signature: true` in config.

**Package Graph:** Turborepo reads lockfile + `package.json` workspaces → auto-detects dependencies. Use `^` prefix in `dependsOn` to build upstream packages first.

**Cache Strategy:** Outputs (dist/, build/) cached; lock files ignored. Task naming must match npm scripts. Parallel by default; add `outputs` for reproducible caching.

**Gotcha:** Remote cache only works in CI/CD with auth token (`TURBO_TOKEN`). Local builds still use disk cache in `.turbo/`.

---

## Summary Table

| Component | Version | Key Constraint |
|-----------|---------|-----------------|
| React | 19.x | Strict mode, concurrent features |
| Vite | 5.1+ | Tailwind v4 PostCSS plugin |
| Tailwind | 4.1+ | CSS-first config, OKLCH colors |
| shadcn/ui | v0.9+ | Tailwind v4 compatible |
| React Query | 5.x | WebSocket + setQueryData for real-time |
| Turborepo | 2.1+ | Package graph + remote caching |
| pnpm | 9.x | Strict peer deps, workspace links |

---

## Unresolved Questions
- How to structure Claude CLI adapter for concurrent session management? (Session token isolation?)
- Should WebSocket updates use event namespacing for large feature sets?

---

**Sources:**
- [Building a Scalable Frontend Monorepo with Turborepo, Vite, TailwindCSS V4, React 19](https://dev.to/harrytranswe/building-a-scalable-frontend-monorepo-with-turborepo-vite-tailwindcss-v4-react-19-tanstack-21ko)
- [Tailwind v4 - shadcn/ui](https://ui.shadcn.com/docs/tailwind-v4)
- [Theming - shadcn/ui](https://ui.shadcn.com/docs/theming)
- [Dark Mode - shadcn/ui](https://ui.shadcn.com/docs/dark-mode)
- [Using WebSockets with React Query](https://tkdodo.eu/blog/using-web-sockets-with-react-query)
- [Optimistic Updates | TanStack Query React Docs](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
- [Query Invalidation | TanStack Query React Docs](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation)
- [CLI reference - Claude Code Docs](https://code.claude.com/docs/en/cli-reference)
- [@anthropic-ai/claude-code - npm](https://www.npmjs.com/package/@anthropic-ai/claude-code)
- [Remote Caching - Turborepo](https://turborepo.dev/docs/core-concepts/remote-caching)
- [Configuring turbo.json - Turborepo](https://turborepo.dev/docs/reference/configuration)
- [Caching - Turborepo](https://turborepo.dev/docs/crafting-your-repository/caching)
