import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ICompanyTemplate } from '@aicompany/shared';
import { CompanyTemplateModel } from '../persistence/models/company-template-model.js';
import type { ITemplateRepository } from '../../domain/repositories/i-template-repository.js';

@Injectable()
export class TemplateRepository implements ITemplateRepository {
  constructor(
    @InjectRepository(CompanyTemplateModel)
    private readonly repo: Repository<CompanyTemplateModel>,
  ) {}

  findAll(): Promise<ICompanyTemplate[]> {
    return this.repo.find({ order: { createdAt: 'ASC' } });
  }

  findPublic(): Promise<ICompanyTemplate[]> {
    return this.repo.findBy({ isPublic: true });
  }

  findById(id: string): Promise<ICompanyTemplate | null> {
    return this.repo.findOneBy({ id });
  }

  /** Templates use name as slug (lowercased, hyphenated) stored in id field */
  findBySlug(slug: string): Promise<ICompanyTemplate | null> {
    return this.repo.findOneBy({ id: slug });
  }

  async create(data: Partial<ICompanyTemplate>): Promise<ICompanyTemplate> {
    const entity = this.repo.create(data as CompanyTemplateModel);
    return this.repo.save(entity);
  }
}
