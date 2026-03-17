import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CostTrackingAndApprovals1710000000004 implements MigrationInterface {
  name = 'CostTrackingAndApprovals1710000000004';

  async up(queryRunner: QueryRunner): Promise<void> {
    // cost_events — per-run cost recording
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cost_events" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
        "agent_id" UUID NOT NULL REFERENCES "agents"("id") ON DELETE CASCADE,
        "run_id" UUID,
        "provider" TEXT NOT NULL,
        "model" TEXT NOT NULL,
        "input_tokens" INTEGER NOT NULL DEFAULT 0,
        "output_tokens" INTEGER NOT NULL DEFAULT 0,
        "cost_cents" INTEGER NOT NULL DEFAULT 0,
        "compute_cost_cents" INTEGER NOT NULL DEFAULT 0,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_cost_events_company_created" ON "cost_events" ("company_id", "created_at")`,
    );

    // approvals — board approval workflow
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "approvals" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
        "type" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "title" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "details" JSONB,
        "requested_by_agent_id" UUID REFERENCES "agents"("id") ON DELETE SET NULL,
        "requested_by_user_id" TEXT REFERENCES "users"("id") ON DELETE SET NULL,
        "resolved_by_user_id" TEXT REFERENCES "users"("id") ON DELETE SET NULL,
        "resolved_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_approvals_company_status" ON "approvals" ("company_id", "status")`,
    );

    // approval_comments — threaded discussion
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "approval_comments" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "approval_id" UUID NOT NULL REFERENCES "approvals"("id") ON DELETE CASCADE,
        "author_id" TEXT NOT NULL,
        "body" TEXT NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Add masked_key column to company_api_keys
    await queryRunner.query(
      `ALTER TABLE "company_api_keys" ADD COLUMN IF NOT EXISTS "masked_key" TEXT`,
    );

    // agent_api_keys — persistent internal auth tokens (if not exists)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "agent_api_keys" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
        "agent_id" UUID NOT NULL REFERENCES "agents"("id") ON DELETE CASCADE,
        "key_hash" TEXT NOT NULL UNIQUE,
        "label" TEXT,
        "revoked_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_agent_api_keys_company_agent" ON "agent_api_keys" ("company_id", "agent_id")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "approval_comments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "approvals"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cost_events"`);
    await queryRunner.query(
      `ALTER TABLE "company_api_keys" DROP COLUMN IF EXISTS "masked_key"`,
    );
  }
}
