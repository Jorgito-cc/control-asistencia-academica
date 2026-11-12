import { Injectable, Logger } from '@nestjs/common';
import { Clock } from '../../../shared/application/clock.port';
import { RealtimeEvents } from '../../../shared/application/realtime.port';
import type { AuthUser } from '../../../shared/domain/auth-user';
import { AcademicModuleRepository } from '../../academic-modules/domain/academic-module.repository';
import type { ActivityAction } from '../domain/activity-log';
import { ActivityLogRepository } from '../domain/activity-log.repository';

export interface RecordActivityInput {
  actor: AuthUser;
  action: ActivityAction;
  description: string;
  moduleId: number | null;
  previousModuleId?: number;
  studentId?: number | null;
  entity?: string;
  entityId?: number;
  details?: Record<string, unknown>;
}

/** Acciones que no cambian lo que ve un estudiante. */
const STAFF_ONLY: ReadonlySet<ActivityAction> = new Set([
  'LOGIN',
  'LOGOUT',
  'EXPORT_ATTENDANCE',
  'CHANGE_PASSWORD',
  'SCHEDULE_MODULE',
  'CANCEL_SCHEDULE',
]);

/**
 * Registra las acciones importantes (RF-09). Un fallo aquí no rompe la operación principal.
 * Como toda acción que cambia datos pasa por aquí, también avisa en tiempo real a quienes la ven.
 */
@Injectable()
export class ActivityRecorder {
  private readonly logger = new Logger(ActivityRecorder.name);

  constructor(
    private readonly repository: ActivityLogRepository,
    private readonly clock: Clock,
    private readonly realtime: RealtimeEvents,
    private readonly modules: AcademicModuleRepository,
  ) {}

  async record(input: RecordActivityInput): Promise<void> {
    try {
      await this.repository.save({
        moduleId: input.moduleId,
        actorType: input.actor.role,
        actorId: input.actor.id,
        actorName: input.actor.name,
        action: input.action,
        studentId: input.studentId ?? null,
        entity: input.entity ?? null,
        entityId: input.entityId ?? null,
        description: input.description,
        details: input.details ?? null,
        createdAt: this.clock.now(),
      });
    } catch (error) {
      this.logger.error(`No se pudo registrar la actividad ${input.action}`, error);
    }
    try {
      await this.broadcast(input);
    } catch (error) {
      this.logger.error(`No se pudo enviar la actividad ${input.action}`, error);
    }
  }

  private async broadcast({ action, actor, moduleId, previousModuleId, studentId }: RecordActivityInput): Promise<void> {
    const event = { action };
    const teacherId = actor.role === 'TEACHER' ? actor.id
      : moduleId === null ? null : (await this.modules.findById(moduleId))?.teacherId;
    if (typeof teacherId === 'number') this.realtime.toTeacher(teacherId, event);
    if (action === 'ACTIVATE_MODULE' && previousModuleId !== undefined) {
      // El cambio invalida las sesiones del módulo que se acaba de cerrar.
      this.realtime.toModuleStudents(previousModuleId, event);
    }
    if (actor.role === 'STUDENT') {
      // Sus otras pestañas o dispositivos.
      this.realtime.toStudent(actor.id, event);
    } else if (moduleId !== null && !STAFF_ONLY.has(action)) {
      // Si la acción es sobre un estudiante, solo a él; si no (clases, reglas…), a todo el módulo.
      if (studentId) this.realtime.toStudent(studentId, event);
      else this.realtime.toModuleStudents(moduleId, event);
    }
  }
}
