import { Injectable } from '@nestjs/common';
import { Clock } from '../../../shared/application/clock.port';
import type { AuthUser } from '../../../shared/domain/auth-user';
import { BusinessRuleError, NotFoundError } from '../../../shared/domain/errors';
import { ActivityRecorder } from '../../activity/application/activity-recorder.service';
import { AcademicModuleRepository } from '../domain/academic-module.repository';
import { ScheduledActivationService } from './scheduled-activation.service';

/** Historial de módulos (solo lectura) y gestión del módulo programado. */
@Injectable()
export class ModuleHistoryService {
  constructor(
    private readonly repository: AcademicModuleRepository,
    private readonly activation: ScheduledActivationService,
    private readonly activity: ActivityRecorder,
    private readonly clock: Clock,
  ) {}

  list(teacherId: number) {
    return this.repository.list(this.clock.today(), this.clock.timeZone, teacherId);
  }

  async get(moduleId: number, teacherId: number) {
    const module = await this.findOwned(moduleId, teacherId);
    return this.repository.summarize(module);
  }

  async reschedule(teacher: AuthUser, moduleId: number, scheduledFor: Date) {
    if (scheduledFor.getTime() <= this.clock.now().getTime() + 60_000) {
      throw new BusinessRuleError('La fecha programada debe ser al menos un minuto en el futuro');
    }
    await this.findOwned(moduleId, teacher.id);
    const module = await this.repository.reschedule(moduleId, teacher.id, scheduledFor);
    await this.record(teacher, 'SCHEDULE_MODULE', module.id, `Reprogramó el módulo "${module.name}"`, {
      scheduledFor: scheduledFor.toISOString(),
    });
    return this.repository.summarize(module);
  }

  async activateNow(teacher: AuthUser, moduleId: number) {
    await this.findOwned(moduleId, teacher.id);
    const module = await this.activation.activate(moduleId, teacher);
    if (!module) throw new BusinessRuleError('El módulo ya no está programado');
    return this.repository.summarize(module);
  }

  async cancel(teacher: AuthUser, moduleId: number) {
    await this.findOwned(moduleId, teacher.id);
    const module = await this.repository.cancelScheduled(moduleId, teacher.id, this.clock.now());
    await this.record(teacher, 'CANCEL_SCHEDULE', module.id, `Canceló la activación programada del módulo "${module.name}"`);
    return this.repository.summarize(module);
  }

  private async findOwned(moduleId: number, teacherId: number) {
    const module = await this.repository.findById(moduleId);
    if (!module || module.teacherId !== teacherId) throw new NotFoundError('El módulo no existe');
    return module;
  }

  private async record(
    teacher: AuthUser,
    action: 'SCHEDULE_MODULE' | 'CANCEL_SCHEDULE',
    moduleId: number,
    description: string,
    details?: Record<string, unknown>,
  ) {
    const active = await this.repository.findActive(teacher.id);
    await this.activity.record({
      actor: teacher,
      action,
      moduleId: active?.id ?? moduleId,
      entity: 'module',
      entityId: moduleId,
      description,
      details,
    });
  }
}
