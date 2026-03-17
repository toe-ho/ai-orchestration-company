# Phase 5: Claude Adapter + Executor App

## Context Links
- Parent: [plan.md](./plan.md)
- Dependencies: Phase 1 (packages/adapters, packages/adapter-utils), Phase 4 (execution engine calls executor)
- Docs: [12-api-architecture](../../docs/blueprint/03-architecture/12-api-architecture-nestjs.md), [14-monorepo-setup-guide](../../docs/blueprint/03-architecture/14-monorepo-setup-guide.md)
- Research: [researcher-02](./research/researcher-02-frontend-ai-system.md) — Claude CLI adapter details

## Overview
- **Date:** 2026-03-16
- **Completed:** 2026-03-17
- **Priority:** P1 — first working adapter
- **Status:** complete
- **Review:** complete
- **Description:** Implement the executor app (Fastify HTTP server on Fly.io VMs) and the Claude CLI adapter. Executor receives POST /execute from control plane, spawns claude CLI via adapter, streams SSE events back.

## Key Insights
- Claude CLI: `claude --output-format json --context-file <path>` for structured output + session resume
- stdin piping fails (Ink terminal UI) — use temp file or --file for prompt injection
- ANTHROPIC_API_KEY must be in child process env
- Executor runs inside Fly.io VM — one VM per company, multiple agents share it
- SSE response: executor streams events back to control plane via chunked HTTP response
- Session codec: serialize/deserialize .claude/session path for multi-turn resume

## Requirements

### Functional
- **apps/executor:** Fastify HTTP server (port 3200)
  - POST /execute — receive IExecutionRequest, run adapter, stream SSE response
  - POST /cancel — abort running execution
  - GET /health — { status, activeRuns, adapter }
- **packages/adapters — Claude adapter:**
  - Spawn `claude` CLI as child process
  - Pass prompt via --file (temp file)
  - Pass context via --context-file for session resume
  - Parse JSON stdout output
  - Stream events: system, stdout, stderr, usage, result
  - Handle timeout (kill process tree after timeoutSec)
  - Handle cancellation (SIGTERM → SIGKILL after 5s)
- **packages/adapter-utils:**
  - Session codec: save/load session context file path per agent+task
  - Env cleaner: strip dangerous vars (PATH manipulation, etc.)
  - Process helpers: spawn with timeout, kill tree, stream stdout

### Non-Functional
- One adapter execution at a time per agent (maxConcurrentRuns: 1)
- Graceful shutdown on SIGTERM
- Memory limit awareness (Fly.io VM constraints)
- Dockerfile: multi-stage build, pre-install `@anthropic-ai/claude-code`

## Architecture

```
Control Plane (Backend)                 Fly.io VM (Executor)
        │                                       │
        │  POST /execute                        │
        │  { agentId, prompt, apiKey, jwt }     │
        ├──────────────────────────────────────►│
        │                                       │
        │                               AdapterRegistry
        │                               → ClaudeAdapter
        │                               → spawn `claude` CLI
        │                                       │
        │  SSE stream                           │
        │  event: system\ndata: {...}           │
        │◄──────────────────────────────────────┤
        │  event: stdout\ndata: {...}           │
        │◄──────────────────────────────────────┤
        │  event: result\ndata: {...}           │
        │◄──────────────────────────────────────┤
```

## Related Code Files

### packages/adapters/
- `src/adapter-interface.ts` — IAdapter (from Phase 1, flesh out)
- `src/adapter-registry.ts` — map AdapterType → adapter class
- `src/claude/claude-adapter.ts` — Claude CLI spawn + parse
- `src/claude/claude-output-parser.ts` — parse JSON stdout from claude CLI
- `src/claude/claude-session-manager.ts` — manage .claude session files per agent

### packages/adapter-utils/
- `src/session-codec.ts` — serialize/deserialize session state
- `src/env-cleaner.ts` — sanitize env before child process
- `src/process-helpers.ts` — spawn with timeout, kill tree, pipe stdout
- `src/sse-formatter.ts` — format events as SSE text

### apps/executor/
- `src/main.ts` — Fastify server, register routes, graceful shutdown
- `src/routes/execute-route.ts` — POST /execute handler
- `src/routes/cancel-route.ts` — POST /cancel handler
- `src/routes/health-route.ts` — GET /health
- `src/services/execution-manager.ts` — track active runs, enforce concurrency
- `src/services/auth-validator.ts` — verify agent JWT from request
- `Dockerfile` — multi-stage build for Fly.io

### config/
- `config/skills/` — agent instruction/skill files symlinked into VM

## Implementation Steps

1. **Flesh out IAdapter interface**
   ```typescript
   interface IAdapter {
     execute(request: IExecutionRequest): AsyncGenerator<IExecutionEvent>;
     cancel(runId: string): Promise<void>;
     health(): Promise<{ ok: boolean; version?: string }>;
   }
   ```

2. **Claude adapter implementation**
   - Write prompt to temp file: `/tmp/prompt-{runId}.md`
   - Build CLI args: `claude --output-format json --file /tmp/prompt-{runId}.md`
   - If session exists: add `--context-file /sessions/{agentId}/{taskId}/session`
   - Set env: `ANTHROPIC_API_KEY` from request
   - Spawn child process with `child_process.spawn`
   - Stream stdout line-by-line → parse JSON → yield IExecutionEvent
   - On exit: yield result event with exit code + usage stats
   - Cleanup temp files

3. **Claude output parser**
   - Parse newline-delimited JSON from claude CLI stdout
   - Map to IExecutionEvent types: system, assistant, tool_use, result, error
   - Extract usage: inputTokens, outputTokens, model from final result

4. **Claude session manager**
   - Directory structure: `/sessions/{agentId}/{taskId}/`
   - Save session path after successful execution
   - Load session path for resume (--context-file)
   - Cleanup old sessions (> 7 days)

5. **SSE formatter utility**
   - `formatSSE(event: IExecutionEvent): string` → `event: {type}\ndata: {json}\n\n`
   - Used by executor to stream responses

6. **Executor — POST /execute**
   - Validate JWT from Authorization header
   - Parse IExecutionRequest body
   - Check concurrency (reject if agent already running)
   - Resolve adapter from AdapterType
   - Call adapter.execute(), stream events as SSE response
   - Set headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`
   - On error: send error event + close stream

7. **Executor — POST /cancel**
   - Validate JWT
   - Find active run by runId
   - Call adapter.cancel(runId)
   - Respond 200

8. **Executor — GET /health**
   - Return `{ status: "ok", activeRuns: number, adapter: "claude" }`

9. **Execution manager service**
   - Track active runs: Map<runId, { adapter, process, startedAt }>
   - Enforce max concurrent runs per agent
   - Timeout: kill after timeoutSec
   - Cleanup on completion

10. **Auth validator**
    - Verify agent JWT using AGENT_JWT_SECRET env var
    - Extract agentId, companyId, runId
    - Reject expired tokens

11. **Dockerfile**
    - Multi-stage: base → installer → builder → runner
    - Install pnpm, copy workspace files for executor + packages
    - Build executor
    - Install `@anthropic-ai/claude-code` globally in runner stage
    - EXPOSE 3200, CMD ["node", "dist/main.js"]

12. **Env cleaner**
    - Allowlist approach: only pass ANTHROPIC_API_KEY, NODE_ENV, HOME, PATH
    - Strip: DATABASE_URL, AUTH_SECRET, FLY_API_TOKEN, etc.

## Todo List
- [ ] IAdapter interface (finalize)
- [ ] Claude adapter (spawn + parse + stream)
- [ ] Claude output parser
- [ ] Claude session manager
- [ ] Adapter registry
- [ ] SSE formatter utility
- [ ] Executor: POST /execute route
- [ ] Executor: POST /cancel route
- [ ] Executor: GET /health route
- [ ] Execution manager (concurrency + timeout)
- [ ] Auth validator (JWT verify)
- [ ] Env cleaner
- [ ] Process helpers (spawn, kill tree)
- [ ] Dockerfile
- [ ] Test: Claude adapter with mock CLI
- [ ] Test: SSE stream formatting
- [ ] Test: concurrency enforcement

## Success Criteria
- POST /execute spawns claude CLI, streams SSE events, completes with result
- Session resume works: second execution on same task picks up context
- Concurrent execution rejected with 429
- Cancel kills child process within 5s
- Dockerfile builds and runs on Fly.io
- Health endpoint returns accurate active run count
- Env cleaner strips all sensitive vars except API key

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Claude CLI output format changes | Medium | High | Pin @anthropic-ai/claude-code version, add format validation |
| Child process zombie leaks | Medium | High | Kill process tree (not just PID), cleanup on SIGTERM |
| Large stdout overwhelming memory | Medium | Medium | Stream line-by-line, don't buffer full output |
| Session file corruption | Low | Medium | Validate session integrity before resume, fallback to fresh |

## Security Considerations
- ANTHROPIC_API_KEY in memory only, cleaned from env after spawn
- JWT verification on every request (no unauthenticated execution)
- Temp files cleaned after execution
- Executor has no database access (stateless)
- VM network: only control plane can reach executor (Fly.io private networking)

## Next Steps
- Phase 7: Live events from executor stream through Redis pub/sub to WebSocket
- Future: Add codex, gemini adapters (same CLI spawn pattern)
