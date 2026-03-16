import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoalModel } from '../persistence/models/goal-model.js';
import type { IGoalRepository } from '../../domain/repositories/i-goal-repository.js';
import { BaseRepository } from './base-repository.js';

@Injectable()
export class GoalRepository
  extends BaseRepository<GoalModel>
  implements IGoalRepository
{
  constructor(
    @InjectRepository(GoalModel)
    repo: Repository<GoalModel>,
  ) {
    super(repo);
  }

  findAllByCompany(companyId: string) {
    return this.repo.findBy({ companyId });
  }
}
