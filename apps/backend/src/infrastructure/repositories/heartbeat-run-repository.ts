import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import type { IHeartbeatRun } from '@aicompany/shared';
import { HeartbeatRunModel } from '../persistence/models/heartbeat-run-model.js';
import type { IHeartbeatRunRepository } from '../../domain/repositories/i-heartbeat-run-repository.js';

@Injectable()
export class HeartbeatRunRepository implements IHeartbeatRunRepository {
  constructor(
    @InjectRepository(HeartbeatRunModel)
    private readonly repo: Repository<HeartbeatRunModel>,
  ) {}

  findById(id: string): Promise<IHeartbeatRun | null> {
    return this.repo.findOneBy({ id });
  }

  findByIdAndCompany(id: string, companyId: string): Promise<IHeartbeatRun | null> {
    return this.repo.findOneBy({ id, companyId });
  }

  findActiveByAgent(agentId: string): Promise<IHeartbeatRun[]> {
    return this.repo.findBy({ agentId, status: 'running' });
  }

  findOrphanedRuns(cutoff: Date): Promise<IHeartbeatRun[]> {
    return this.repo.findBy({ status: 'running', startedAt: LessThan(cutoff) });
  }

  async create(data: Partial<IHeartbeatRun>): Promise<IHeartbeatRun> {
    const entity = this.repo.create(data as HeartbeatRunModel);
    return this.repo.save(entity);
  }

  async update(id: string, partial: Partial<IHeartbeatRun>): Promise<IHeartbeatRun | null> {
    await this.repo.update(id, partial as never);
    return this.findById(id);
  }

  listByCompany(companyId: string, limit = 50): Promise<IHeartbeatRun[]> {
    return this.repo.find({
      where: { companyId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  listByAgent(companyId: string, agentId: string, limit = 50): Promise<IHeartbeatRun[]> {
    return this.repo.find({
      where: { companyId, agentId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
