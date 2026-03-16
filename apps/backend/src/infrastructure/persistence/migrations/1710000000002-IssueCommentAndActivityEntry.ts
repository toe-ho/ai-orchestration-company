import type { MigrationInterface, QueryRunner } from 'typeorm';

export class IssueCommentAndActivityEntry1710000000002 implements MigrationInterface {
  name = 'IssueCommentAndActivityEntry1710000000002';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "issue_comments" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
        "issue_id" UUID NOT NULL REFERENCES "issues"("id") ON DELETE CASCADE,
        "author_type" TEXT NOT NULL,
        "author_id" TEXT,
        "content" TEXT NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_issue_comments_company_issue" ON "issue_comments" ("company_id", "issue_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "activity_entries" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
        "actor_id" TEXT NOT NULL,
        "actor_type" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "entity_type" TEXT NOT NULL,
        "entity_id" TEXT NOT NULL,
        "run_id" UUID,
        "details" JSONB,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_activity_entries_company_entity" ON "activity_entries" ("company_id", "entity_type", "entity_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_activity_entries_company_created" ON "activity_entries" ("company_id", "created_at" DESC)`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "activity_entries"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "issue_comments"`);
  }
}
