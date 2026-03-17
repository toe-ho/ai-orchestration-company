import type { IExecutionEvent } from '@aicompany/shared';

/** Raw JSON shapes emitted by claude CLI --output-format stream-json */
interface ClaudeSystemLine {
  type: 'system';
  subtype: 'init';
  session_id: string;
  model: string;
  cwd: string;
  tools: unknown[];
}

interface ClaudeAssistantLine {
  type: 'assistant';
  message: {
    id: string;
    role: 'assistant';
    content: Array<{ type: string; text?: string; input?: unknown; name?: string }>;
    model: string;
    stop_reason: string;
    usage: { input_tokens: number; output_tokens: number };
  };
}

interface ClaudeResultLine {
  type: 'result';
  subtype: 'success' | 'error';
  result: string;
  session_id: string;
  total_cost_usd?: number;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
}

type ClaudeLine = ClaudeSystemLine | ClaudeAssistantLine | ClaudeResultLine | { type: string };

/**
 * Parse a single newline-delimited JSON line from claude CLI stdout.
 * Returns an IExecutionEvent or null if the line cannot be parsed.
 */
export function parseClaudeOutputLine(
  line: string,
  runId: string,
  seq: number,
): IExecutionEvent | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  let parsed: ClaudeLine;
  try {
    parsed = JSON.parse(trimmed) as ClaudeLine;
  } catch {
    // Non-JSON line — treat as raw stdout text
    return {
      runId,
      seq,
      eventType: 'stdout',
      stream: 'stdout',
      message: trimmed,
      payload: null,
      timestamp: new Date(),
    };
  }

  const base = { runId, seq, timestamp: new Date() };

  switch (parsed.type) {
    case 'system': {
      const sys = parsed as ClaudeSystemLine;
      return {
        ...base,
        eventType: 'system',
        stream: 'system',
        message: `session_id=${sys.session_id} model=${sys.model}`,
        payload: { session_id: sys.session_id, model: sys.model, cwd: sys.cwd },
      };
    }

    case 'assistant': {
      const ast = parsed as ClaudeAssistantLine;
      // Extract text from content blocks
      const textBlocks = ast.message.content
        .filter((c) => c.type === 'text')
        .map((c) => c.text ?? '')
        .join('');
      const toolUseBlocks = ast.message.content.filter((c) => c.type === 'tool_use');

      if (toolUseBlocks.length > 0) {
        return {
          ...base,
          eventType: 'tool_use',
          stream: 'stdout',
          message: textBlocks || null,
          payload: {
            tool_calls: toolUseBlocks,
            usage: ast.message.usage,
            model: ast.message.model,
          },
        };
      }

      return {
        ...base,
        eventType: 'assistant',
        stream: 'stdout',
        message: textBlocks || null,
        payload: { usage: ast.message.usage, model: ast.message.model },
      };
    }

    case 'result': {
      const res = parsed as ClaudeResultLine;
      return {
        ...base,
        eventType: res.subtype === 'success' ? 'result' : 'error',
        stream: 'system',
        message: res.result ?? null,
        payload: {
          session_id: res.session_id,
          total_cost_usd: res.total_cost_usd ?? 0,
          usage: res.usage ?? null,
          subtype: res.subtype,
        },
      };
    }

    default:
      return {
        ...base,
        eventType: parsed.type,
        stream: 'stdout',
        message: null,
        payload: parsed as Record<string, unknown>,
      };
  }
}
