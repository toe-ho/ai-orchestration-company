/** Fly.io Machines API — minimal types needed for VM lifecycle management */

export interface FlyMachineConfig {
  image: string;
  env?: Record<string, string>;
  size?: string;
  /** Auto-destroy machine when it stops */
  auto_destroy?: boolean;
}

export interface CreateMachineRequest {
  name?: string;
  region?: string;
  config: FlyMachineConfig;
}

export interface MachineResponse {
  id: string;
  state: string;
  region: string;
  instance_id: string;
  private_ip: string;
  config?: FlyMachineConfig;
  created_at: string;
  updated_at: string;
}

export interface MachineStartResponse {
  ok: boolean;
}
