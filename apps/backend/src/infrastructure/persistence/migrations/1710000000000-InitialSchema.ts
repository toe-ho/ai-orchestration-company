import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1710000000000 implements MigrationInterface {
  name = 'InitialSchema1710000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // users (Better Auth managed)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL UNIQUE,
        "email_verified" BOOLEAN NOT NULL DEFAULT false,
        "plan" TEXT NOT NULL DEFAULT 'free',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // sessions (Better Auth managed)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sessions" (
        "id" TEXT PRIMARY KEY,
        "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "token" TEXT NOT NULL,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "ip_address" TEXT,
        "user_agent" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // companies
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "companies" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "owner_id" TEXT NOT NULL REFERENCES "users"("id"),
        "name" TEXT NOT NULL,
        "description" TEXT,
        "status" TEXT NOT NULL DEFAULT 'active',
        "issue_prefix" TEXT NOT NULL UNIQUE,
        "issue_counter" INTEGER NOT NULL DEFAULT 0,
        "budget_monthly_cents" INTEGER NOT NULL DEFAULT 0,
        "spent_monthly_cents" INTEGER NOT NULL DEFAULT 0,
        "runner_config" JSONB,
        "template_id" TEXT,
        "brand_color" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // user_companies
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_companies" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "company_id" UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
        "role" TEXT NOT NULL DEFAULT 'member',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE("user_id", "company_id")
      )
    `);

    // agents
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "agents" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
        "name" TEXT NOT NULL,
        "role" TEXT NOT NULL,
        "title" TEXT,
        "icon" TEXT,
        "status" TEXT NOT NULL DEFAULT 'idle',
        "reports_to" UUID REFERENCES "agents"("id"),
        "adapter_type" TEXT NOT NULL,
        "adapter_config" JSONB NOT NULL DEFAULT '{}',
        "runtime_config" JSONB NOT NULL DEFAULT '{}',
        "budget_monthly_cents" INTEGER NOT NULL DEFAULT 0,
        "spent_monthly_cents" INTEGER NOT NULL DEFAULT 0,
        "permissions" JSONB NOT NULL DEFAULT '{}',
        "last_heartbeat_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_agents_company_status" ON "agents" ("company_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_agents_company_reports_to" ON "agents" ("company_id", "reports_to")`);

    // goals
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "goals" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
        "parent_id" UUID REFERENCES "goals"("id"),
        "title" TEXT NOT NULL,
        "description" TEXT,
        "level" TEXT NOT NULL DEFAULT 'company',
        "status" TEXT NOT NULL DEFAULT 'active',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_goals_company_level" ON "goals" ("company_id", "level")`);

    // projects
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "projects" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
        "goal_id" UUID REFERENCES "goals"("id"),
        "name" TEXT NOT NULL,
        "description" TEXT,
        "status" TEXT NOT NULL DEFAULT 'active',
        "archived_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_projects_company_status" ON "projects" ("company_id", "status")`);

    // issues
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "issues" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
        "project_id" UUID REFERENCES "projects"("id"),
        "goal_id" UUID REFERENCES "goals"("id"),
        "parent_id" UUID REFERENCES "issues"("id"),
        "title" TEXT NOT NULL,
        "description" TEXT,
        "status" TEXT NOT NULL DEFAULT 'backlog',
        "priority" TEXT NOT NULL DEFAULT 'medium',
        "assignee_agent_id" UUID REFERENCES "agents"("id"),
        "checkout_run_id" UUID,
        "identifier" TEXT NOT NULL UNIQUE,
        "issue_number" INTEGER NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_issues_company_status" ON "issues" ("company_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_issues_company_assignee_status" ON "issues" ("company_id", "assignee_agent_id", "status")`);

    // heartbeat_runs
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "heartbeat_runs" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
        "agent_id" UUID NOT NULL REFERENCES "agents"("id"),
        "vm_machine_id" TEXT,
        "invocation_source" TEXT NOT NULL DEFAULT 'on_demand',
        "status" TEXT NOT NULL DEFAULT 'queued',
        "started_at" TIMESTAMPTZ,
        "finished_at" TIMESTAMPTZ,
        "exit_code" INTEGER,
        "input_tokens" INTEGER NOT NULL DEFAULT 0,
        "output_tokens" INTEGER NOT NULL DEFAULT 0,
        "total_cost_cents" INTEGER NOT NULL DEFAULT 0,
        "model" TEXT,
        "duration_ms" INTEGER,
        "usage_json" JSONB,
        "result_json" JSONB,
        "compute_cost_cents" INTEGER NOT NULL DEFAULT 0,
        "stdout_excerpt" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_heartbeat_runs_company_agent_started" ON "heartbeat_runs" ("company_id", "agent_id", "started_at")`);

    // company_api_keys
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "company_api_keys" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
        "provider" TEXT NOT NULL,
        "encrypted_key" TEXT NOT NULL,
        "key_hash" TEXT NOT NULL,
        "label" TEXT,
        "is_valid" BOOLEAN NOT NULL DEFAULT false,
        "last_validated_at" TIMESTAMPTZ,
        "last_used_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_company_api_keys_company_provider" ON "company_api_keys" ("company_id", "provider")`);

    // company_vms
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "company_vms" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE UNIQUE,
        "machine_id" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'stopped',
        "region" TEXT,
        "size" TEXT,
        "volume_id" TEXT,
        "last_active_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // company_templates
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "company_templates" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "category" TEXT,
        "agent_configs" JSONB NOT NULL DEFAULT '{}',
        "goal_template" TEXT,
        "is_public" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "company_templates"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "company_vms"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "company_api_keys"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "heartbeat_runs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "issues"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "projects"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "goals"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "agents"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_companies"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "companies"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sessions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
