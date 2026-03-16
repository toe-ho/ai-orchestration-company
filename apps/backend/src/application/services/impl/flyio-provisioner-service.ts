import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ICompanyVm } from '@aicompany/shared';
import { VmStatus } from '@aicompany/shared';
import type { IProvisionerService } from '../interface/i-provisioner-service.js';
import { FlyioClient } from '../../../infrastructure/external/flyio/flyio-client.js';
import type { ICompanyVmRepository } from '../../../domain/repositories/i-company-vm-repository.js';
import { COMPANY_VM_REPOSITORY } from '../../../domain/repositories/i-company-vm-repository.js';
import type { FlyioConfig } from '../../../config/flyio-config.js';

@Injectable()
export class FlyioProvisionerService implements IProvisionerService {
  private readonly logger = new Logger(FlyioProvisionerService.name);
  private readonly flyio: FlyioConfig;

  constructor(
    private readonly client: FlyioClient,
    @Inject(COMPANY_VM_REPOSITORY) private readonly vmRepo: ICompanyVmRepository,
    config: ConfigService,
  ) {
    this.flyio = config.get<FlyioConfig>('flyio')!;
  }

  async ensureVm(companyId: string): Promise<ICompanyVm> {
    const existing = await this.vmRepo.findByCompanyId(companyId);
    if (existing?.status === VmStatus.Running) return existing;

    if (existing?.machineId) {
      // Wake a hibernated / stopped machine
      this.logger.log(`Starting machine ${existing.machineId} for company ${companyId}`);
      await this.vmRepo.updateStatus(companyId, VmStatus.Starting);
      await this.client.startMachine(existing.machineId);
      return this.vmRepo.upsert(companyId, { status: VmStatus.Running, lastActiveAt: new Date() });
    }

    // Create a new machine
    this.logger.log(`Creating new Fly.io machine for company ${companyId}`);
    const machine = await this.client.createMachine({
      region: this.flyio.region,
      config: {
        image: `registry.fly.io/${this.flyio.appName}:latest`,
        size: this.flyio.vmSize,
        auto_destroy: false,
        env: { COMPANY_ID: companyId },
      },
    });
    return this.vmRepo.upsert(companyId, {
      machineId: machine.id,
      status: VmStatus.Running,
      region: machine.region,
      size: this.flyio.vmSize,
      lastActiveAt: new Date(),
    });
  }

  async hibernateVm(companyId: string): Promise<void> {
    const vm = await this.vmRepo.findByCompanyId(companyId);
    if (!vm) return;
    this.logger.log(`Hibernating machine ${vm.machineId} for company ${companyId}`);
    await this.vmRepo.updateStatus(companyId, VmStatus.Hibernating);
    await this.client.stopMachine(vm.machineId);
    await this.vmRepo.updateStatus(companyId, VmStatus.Stopped);
  }

  async destroyVm(companyId: string): Promise<void> {
    const vm = await this.vmRepo.findByCompanyId(companyId);
    if (!vm) return;
    this.logger.log(`Destroying machine ${vm.machineId} for company ${companyId}`);
    await this.client.destroyMachine(vm.machineId);
    await this.vmRepo.delete(companyId);
  }
}
