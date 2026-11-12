import type { RequestHandler } from 'express';

export interface PlatformRuntime {
  handle: RequestHandler;
  close(): Promise<void>;
}

export function openPlatform(connectionString: string, platformOnly: boolean): Promise<PlatformRuntime>;
