import { Repository, ObjectLiteral } from 'typeorm';

/** Generic TypeORM base with common CRUD operations scoped by companyId */
export abstract class BaseRepository<T extends ObjectLiteral & { id: string }> {
  constructor(protected readonly repo: Repository<T>) {}

  findById(id: string): Promise<T | null> {
    return this.repo.findOneBy({ id } as never);
  }

  findByIdAndCompany(id: string, companyId: string): Promise<T | null> {
    return this.repo.findOneBy({ id, companyId } as never);
  }

  findAll(companyId: string): Promise<T[]> {
    return this.repo.findBy({ companyId } as never);
  }

  async create(data: Partial<T>): Promise<T> {
    const entity = this.repo.create(data as T);
    return this.repo.save(entity);
  }

  async update(id: string, partial: Partial<T>): Promise<T | null> {
    await this.repo.update(id, partial as never);
    return this.findById(id);
  }

  /** Only call on models that have a `status` column */
  async softDelete(id: string, statusValue = 'archived'): Promise<void> {
    await this.repo.update(id, { status: statusValue } as never);
  }
}
