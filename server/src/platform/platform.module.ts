import { Injectable, Module, type OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';
import { openPlatform, type PlatformRuntime } from './runtime/server';

const platformRoutes = /^\/api\/(?:plans\/?$|requests(?:\/|$)|platform(?:\/|$))/i;
const healthRoute = /^\/api\/health\/?$/i;

@Injectable()
export class PlatformService implements OnApplicationShutdown {
  private runtime?: PlatformRuntime;

  constructor(private readonly config: ConfigService) {}

  async mount(app: NestExpressApplication, platformOnly: boolean): Promise<void> {
    const connectionString = this.config.get<string>('PLATFORM_DATABASE_URL');
    if (!connectionString) {
      throw new Error('Configura PLATFORM_DATABASE_URL con la base de datos de la plataforma.');
    }
    const runtime = await openPlatform(connectionString, platformOnly);
    this.runtime = runtime;
    app.use((request: Request, response: Response, next: NextFunction) => {
      if (platformRoutes.test(request.path) || (platformOnly && healthRoute.test(request.path))) {
        runtime.handle(request, response, next);
        return;
      }
      next();
    });
  }

  async onApplicationShutdown(): Promise<void> {
    await this.runtime?.close();
  }
}

@Module({ providers: [PlatformService] })
export class PlatformModule {}
