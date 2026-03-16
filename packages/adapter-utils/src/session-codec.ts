import type { ISessionCodec } from '@aicompany/shared';

/**
 * Base session codec — encodes/decodes session state as base64 JSON.
 * Adapters can extend this or swap the implementation.
 */
export class BaseSessionCodec implements ISessionCodec {
  async serialize(sessionData: Record<string, unknown>): Promise<string> {
    const json = JSON.stringify(sessionData);
    return Buffer.from(json, 'utf-8').toString('base64');
  }

  async deserialize(encoded: string): Promise<Record<string, unknown>> {
    const json = Buffer.from(encoded, 'base64').toString('utf-8');
    return JSON.parse(json) as Record<string, unknown>;
  }
}
