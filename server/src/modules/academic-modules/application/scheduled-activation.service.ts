import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { Clock } from '../../../shared/application/clock.port';
import type { AuthUser } from '../../../shared/domain/auth-user';
import { ActivityRecorder } from '../../activity/application/activity-recorder.service';
import { Notifier } from '../../notifications/application/notifier.service';
import type { AcademicModule } from '../domain/academic-module';
import { AcademicModuleRepository } from '../domain/academic-module.repository';

const CHECK_EVERY_MS = 30_000;

/**
 * Activa el módulo programado cuando llega su fecha. Revisa cada 30 s y al arrancar,
 * así un servidor apagado en ese momento lo activa en cuanto vuelve.
 */
@Injectable()
export class ScheduledActivationService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(ScheduledActivationService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly repository: AcademicModuleRepository,
    private readonly activity: ActivityRecorder,
    private readonly notifier: Notifier,
    private readonly clock: Clock,
  ) {}

  onApplicationBootstrap() {
    void this.activateDue();
    this.timer = setInterval(() => void this.activateDue(), CHECK_EVERY_MS);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async activateDue(): Promise<void> {
    try {
      const due = await this.repository.findDueScheduledIds(this.clock.now());
      for (const moduleId of due) {
        await this.activate(moduleId, null).catch((error: unknown) => {
          this.logger.error(`No se pudo activar el módulo programado ${moduleId}`, error);
        });
      }
    } catch (error) {
      this.logger.error('No se pudo activar el módulo programado', error);
    }
  }

  /** Un actor nulo indica activación automática al llegar la fecha. */
  async activate(moduleId: number, teacher: AuthUser | null): Promise<AcademicModule | null> {
    const result = await this.repository.activateScheduled(moduleId, this.clock.now(), teacher?.id);
    if (!result) return null;
    const { module, previous } = result;
    this.logger.log(`Módulo programado activado: ${module.name}`);
    await this.activity.record({
      actor: teacher ?? {
        id: module.createdBy ?? 0,
        role: module.teacherId === null ? 'ADMIN' : 'TEACHER',
        name: 'Sistema (activación programada)',
        email: '',
        moduleId: null,
      },
      action: 'ACTIVATE_MODULE',
      moduleId: module.id,
      previousModuleId: previous?.id,
      entity: 'module',
      entityId: module.id,
      description: teacher
        ? `Activó antes de tiempo el módulo programado "${module.name}"`
        : `Se activó automáticamente el módulo programado "${module.name}"`,
      details: { previousModuleId: previous?.id ?? null, previousModuleName: previous?.name ?? null },
    });
    await this.notifier.toAdmins({
      moduleId: module.id,
      type: 'MODULE_ACTIVATED',
      title: teacher ? `Activaste el módulo "${module.name}"` : `Se activó automáticamente el módulo "${module.name}"`,
      body: previous ? `El módulo "${previous.name}" pasó a Finalizado; sus datos siguen en Módulos.` : null,
      link: module.teacherId === null ? '/admin' : '/docente',
    });
    return module;
  }
}
