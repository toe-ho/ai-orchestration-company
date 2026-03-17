import jwt from 'jsonwebtoken';

export interface AgentJwtPayload {
  agentId: string;
  companyId: string;
  runId: string;
}

/**
 * Verify and decode an agent JWT from the Authorization header.
 * Throws on invalid or expired token.
 */
export function validateAgentJwt(token: string): AgentJwtPayload {
  const secret = process.env.AGENT_JWT_SECRET;
  if (!secret) {
    throw new Error('AGENT_JWT_SECRET is not configured');
  }

  try {
    const payload = jwt.verify(token, secret) as Record<string, unknown>;

    const agentId = payload['agentId'] as string | undefined;
    const companyId = payload['companyId'] as string | undefined;
    const runId = payload['runId'] as string | undefined;

    if (!agentId || !companyId || !runId) {
      throw new Error('JWT missing required fields: agentId, companyId, runId');
    }

    return { agentId, companyId, runId };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new Error('JWT has expired');
    }
    if (err instanceof jwt.JsonWebTokenError) {
      throw new Error(`Invalid JWT: ${err.message}`);
    }
    throw err;
  }
}

/** Extract Bearer token from Authorization header value. */
export function extractBearerToken(authHeader: string | undefined): string {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or malformed Authorization header');
  }
  return authHeader.slice(7);
}
