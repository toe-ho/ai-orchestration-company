import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FlyioConfig } from '../../../config/flyio-config.js';
import type {
  CreateMachineRequest,
  MachineResponse,
  MachineStartResponse,
} from './flyio-types.js';

/** REST client wrapping the Fly.io Machines API */
@Injectable()
export class FlyioClient {
  private readonly logger = new Logger(FlyioClient.name);
  private readonly baseUrl: string;
  private readonly apiToken: string;

  constructor(config: ConfigService) {
    const flyio = config.get<FlyioConfig>('flyio')!;
    this.apiToken = flyio.apiToken;
    this.baseUrl = `https://api.machines.dev/v1/apps/${flyio.appName}/machines`;
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = path ? `${this.baseUrl}/${path}` : this.baseUrl;
    const res = await fetch(url, {
      method,
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`Fly.io API ${method} ${url} → ${res.status}: ${text}`);
      throw new Error(`Fly.io API error ${res.status}: ${text}`);
    }
    return res.json() as Promise<T>;
  }

  createMachine(req: CreateMachineRequest): Promise<MachineResponse> {
    return this.request<MachineResponse>('POST', '', req);
  }

  getMachine(machineId: string): Promise<MachineResponse> {
    return this.request<MachineResponse>('GET', machineId);
  }

  startMachine(machineId: string): Promise<MachineStartResponse> {
    return this.request<MachineStartResponse>('POST', `${machineId}/start`);
  }

  async stopMachine(machineId: string): Promise<void> {
    await this.request('POST', `${machineId}/stop`);
  }

  async destroyMachine(machineId: string): Promise<void> {
    await this.request('DELETE', machineId);
  }
}
