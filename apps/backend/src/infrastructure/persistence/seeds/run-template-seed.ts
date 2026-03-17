/**
 * CLI seed runner: pnpm db:seed
 * Upserts the 3 built-in company templates into the database.
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { CompanyTemplateModel } from '../models/company-template-model.js';
import { TEMPLATE_SEEDS } from './template-seed.js';

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env['DATABASE_URL'],
  entities: [CompanyTemplateModel],
  synchronize: false,
});

async function run(): Promise<void> {
  await dataSource.initialize();
  const repo = dataSource.getRepository(CompanyTemplateModel);

  for (const seed of TEMPLATE_SEEDS) {
    const existing = await repo.findOneBy({ id: seed.id });
    if (!existing) {
      await repo.save(repo.create({
        ...seed,
        agentConfigs: seed.agentConfigs as unknown as Record<string, unknown>,
      }));
      console.log(`Seeded template: ${seed.name}`);
    } else {
      console.log(`Template already exists: ${seed.name}`);
    }
  }

  await dataSource.destroy();
  console.log('Seed complete.');
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
