export interface ISessionCodec {
  serialize(sessionData: Record<string, unknown>): Promise<string>;
  deserialize(encoded: string): Promise<Record<string, unknown>>;
}
