import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Phase 2: adds Better Auth OAuth tables + agent_api_keys */
export class BetterAuthTables1710000000001 implements MigrationInterface {
  name = 'BetterAuthTables1710000000001';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Add image column to users (required by Better Auth)
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "image" TEXT`,
    );

    // accounts — Better Auth OAuth/credential storage (snake_case to match project convention)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "accounts" (
        "id"                       TEXT PRIMARY KEY,
        "account_id"               TEXT NOT NULL,
        "provider_id"              TEXT NOT NULL,
        "user_id"                  TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "access_token"             TEXT,
        "refresh_token"            TEXT,
        "id_token"                 TEXT,
        "access_token_expires_at"  TIMESTAMPTZ,
        "refresh_token_expires_at" TIMESTAMPTZ,
        "scope"                    TEXT,
        "password"                 TEXT,
        "created_at"               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at"               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE("provider_id", "account_id")
      )
    `);

    // verification — Better Auth email/token verification
    // NOTE: uses camelCase columns because BA does not support field mapping for this table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "verification" (
        "id"         TEXT PRIMARY KEY,
        "identifier" TEXT NOT NULL,
        "value"      TEXT NOT NULL,
        "expiresAt"  TIMESTAMPTZ NOT NULL,
        "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // agent_api_keys — persistent pcp_-prefixed keys for agent authentication
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "agent_api_keys" (
        "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
        "agent_id"   UUID NOT NULL REFERENCES "agents"("id") ON DELETE CASCADE,
        "key_hash"   TEXT NOT NULL UNIQUE,
        "label"      TEXT,
        "revoked_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_agent_api_keys_company_agent" ON "agent_api_keys" ("company_id", "agent_id")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "agent_api_keys"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "verification"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "accounts"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "image"`,
    );
  }
}
