import { ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { ServerOptions } from 'socket.io';
import { AppModule, PlatformAppModule } from './app.module';
import { PlatformService } from './platform/platform.module';
import { DomainExceptionFilter } from './shared/infrastructure/http/domain-exception.filter';

async function bootstrap() {
  await ConfigModule.envVariablesLoaded;
  const mode = process.env.APP_MODE ?? (process.env.PLATFORM_DATABASE_URL ? 'combined' : 'tenant');
  if (mode !== 'tenant' && mode !== 'platform' && mode !== 'combined') {
    throw new Error('APP_MODE debe ser tenant, platform o combined.');
  }
  const app = await NestFactory.create<NestExpressApplication>(mode === 'platform' ? PlatformAppModule : AppModule);
  const config = app.get(ConfigService);

  const origins = config.get<string>('CORS_ORIGIN', 'http://localhost:5173').split(',');
  app.setGlobalPrefix('api');
  app.enableCors({ origin: origins, exposedHeaders: ['Content-Disposition'] });
  // La API de plataforma mantiene su propio límite de JSON y sus cookies de operador.
  try {
    if (mode !== 'tenant') {
      await app.get(PlatformService).mount(app, mode === 'platform');
    }
    // La activación académica puede enviar listas completas de estudiantes y fechas.
    app.useBodyParser('json', { limit: '10mb' });
    // El WebSocket (tiempo real) corre en el mismo puerto, con los mismos orígenes permitidos.
    app.useWebSocketAdapter(new CorsIoAdapter(app, origins));
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidUnknownValues: false,
      }),
    );
    app.useGlobalFilters(new DomainExceptionFilter());

    app.enableShutdownHooks();
    const port = config.get<number>('PORT', 3000);
    const host = config.get<string>('HOST');
    if (host) {
      await app.listen(port, host);
    } else {
      await app.listen(port);
    }
  } catch (error) {
    await app.close();
    throw error;
  }
}
class CorsIoAdapter extends IoAdapter {
  constructor(
    app: NestExpressApplication,
    private readonly origins: string[],
  ) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions) {
    return super.createIOServer(port, { ...options, cors: { origin: this.origins } } as ServerOptions);
  }
}

void bootstrap();
