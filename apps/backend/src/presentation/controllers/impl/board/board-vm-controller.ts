import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CompanyAccessGuard } from '../../../../guard/company-access-guard.js';
import { WakeupAgentCommand } from '../../../../application/commands/heartbeat/wakeup-agent-command.js';
import { HibernateVmCommand } from '../../../../application/commands/provisioner/hibernate-vm-command.js';
import { DestroyVmCommand } from '../../../../application/commands/provisioner/destroy-vm-command.js';
import { EnsureVmCommand } from '../../../../application/commands/provisioner/ensure-vm-command.js';

@Controller('companies/:cid/vm')
@UseGuards(CompanyAccessGuard)
export class BoardVmController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /** Ensure VM is running (boots if needed) */
  @Post('wake')
  wake(@Param('cid') cid: string) {
    return this.commandBus.execute(new EnsureVmCommand(cid));
  }

  /** Hibernate (stop) the VM */
  @Post('hibernate')
  hibernate(@Param('cid') cid: string) {
    return this.commandBus.execute(new HibernateVmCommand(cid));
  }

  /** Destroy VM permanently */
  @Post('destroy')
  destroy(@Param('cid') cid: string) {
    return this.commandBus.execute(new DestroyVmCommand(cid));
  }

  /** Manually trigger a heartbeat for an agent */
  @Post('agents/:aid/wakeup')
  wakeup(@Param('cid') cid: string, @Param('aid') aid: string) {
    return this.commandBus.execute(new WakeupAgentCommand(aid, cid, 'on_demand'));
  }
}
