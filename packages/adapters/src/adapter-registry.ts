import type { AdapterType } from '@aicompany/shared';
import type { IAdapter } from './adapter-interface.js';

type AdapterConstructor = new (...args: unknown[]) => IAdapter;

/**
 * Registry mapping AdapterType → adapter class constructor.
 * Populated at runtime by each adapter implementation.
 */
const registry = new Map<string, AdapterConstructor>();

export function registerAdapter(type: AdapterType | string, ctor: AdapterConstructor): void {
  registry.set(type, ctor);
}

export function getAdapterClass(type: AdapterType | string): AdapterConstructor | undefined {
  return registry.get(type);
}

export function listRegisteredAdapters(): string[] {
  return Array.from(registry.keys());
}
