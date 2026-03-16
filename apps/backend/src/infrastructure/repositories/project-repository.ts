import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { IProject } from '@aicompany/shared';
import { ProjectModel } from '../persistence/models/project-model.js';
import type { IProjectRepository } from '../../domain/repositories/i-project-repository.js';
import { BaseRepository } from './base-repository.js';

@Injectable()
export class ProjectRepository
  extends BaseRepository<ProjectModel>
  implements IProjectRepository
{
  constructor(
    @InjectRepository(ProjectModel)
    repo: Repository<ProjectModel>,
  ) {
    super(repo);
  }

  findByIdAndCompany(id: string, companyId: string): Promise<IProject | null> {
    return this.repo.findOneBy({ id, companyId });
  }

  findAllByCompany(companyId: string): Promise<IProject[]> {
    return this.repo.findBy({ companyId });
  }
}
