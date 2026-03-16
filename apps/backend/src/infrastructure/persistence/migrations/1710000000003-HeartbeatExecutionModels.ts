import type { MigrationInterface, QueryRunner } from 'typeorm';

export class HeartbeatExecutionModels1710000000003 implements MigrationInterface {
  name = 'HeartbeatExecutionModels1710000000003';

  async up(queryRunner: QueryRunner): Promise<void> {
    // heartbeat_run_events — SSE events streamed from executor VM
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "heartbeat_run_events" (
        "id" BIGSERIAL PRIMARY KEY,
        "run_id" UUID NOT NULL REFERENCES "heartbeat_runs"("id") ON DELETE CASCADE,
        "seq" INTEGER NOT NULL,
        "event_type" TEXT NOT NULL,
        "stream" TEXT,
        "message" TEXT,
        "payload" JSONB,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_heartbeat_run_events_run_seq" ON "heartbeat_run_events" ("run_id", "seq")`,
    );

    // agent_runtime_states — running totals and current run tracking per agent
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "agent_runtime_states" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
        "agent_id" UUID NOT NULL REFERENCES "agents"("id") ON DELETE CASCADE,
        "current_run_id" UUID,
        "cumulative_input_tokens" INTEGER NOT NULL DEFAULT 0,
        "cumulative_output_tokens" INTEGER NOT NULL DEFAULT 0,
        "cumulative_cost_cents" INTEGER NOT NULL DEFAULT 0,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE ("company_id", "agent_id")
      )
    `);

    // agent_task_sessions — persistent session data per agent+issue pair
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "agent_task_sessions" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
        "agent_id" UUID NOT NULL REFERENCES "agents"("id") ON DELETE CASCADE,
        "issue_id" UUID NOT NULL REFERENCES "issues"("id") ON DELETE CASCADE,
        "session_data" JSONB NOT NULL DEFAULT '{}',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE ("company_id", "agent_id", "issue_id")
      )
    `);

    // agent_wakeup_requests — coalescing queue for heartbeat invocations
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "agent_wakeup_requests" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
        "agent_id" UUID NOT NULL REFERENCES "agents"("id") ON DELETE CASCADE,
        "source" TEXT NOT NULL,
        "payload" JSONB,
        "processed_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_agent_wakeup_requests_company_agent_processed" ON "agent_wakeup_requests" ("company_id", "agent_id", "processed_at")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "agent_wakeup_requests"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "agent_task_sessions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "agent_runtime_states"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "heartbeat_run_events"`);
  }
}
