import type { AttendanceRules } from '../../../shared/domain/attendance-rules';
import type { ExtraField } from '../../../shared/domain/extra-fields';
import type { AcademicModule, AcademicModuleSummary, ModuleListItem } from './academic-module';
import type { SessionImport, StudentImport } from './import/import-rows';

export interface ActivateModuleCommand {
  name: string;
  createdBy: number;
  teacherId: number | null;
  students: StudentImport[];
  sessions: SessionImport[];
  extraFields: ExtraField[];
  now: Date;
  /** Si se indica, el módulo queda programado para esa fecha en vez de activarse ahora. */
  scheduledFor: Date | null;
}

export abstract class AcademicModuleRepository {
  abstract findActive(teacherId?: number | null): Promise<AcademicModule | null>;
  abstract findById(id: number): Promise<AcademicModule | null>;
  abstract findDueScheduledIds(now: Date): Promise<number[]>;
  abstract summarize(module: AcademicModule): Promise<AcademicModuleSummary>;
  /** Historial de módulos del docente indicado. */
  abstract list(today: string, timeZone: string, teacherId: number): Promise<ModuleListItem[]>;
  /**
   * RF-13 / RN-01 / RN-08: crea el módulo con sus estudiantes y fechas en una única transacción.
   * Sin fecha programada cierra el activo del mismo docente (o de administración) y activa el nuevo.
   */
  abstract activateNew(
    command: ActivateModuleCommand,
  ): Promise<{ module: AcademicModule; previous: AcademicModule | null }>;
  /** Si se omite el docente, la activación automática solo ocurre cuando vence la programación. */
  abstract activateScheduled(
    moduleId: number,
    now: Date,
    teacherId?: number,
  ): Promise<{ module: AcademicModule; previous: AcademicModule | null } | null>;
  abstract reschedule(moduleId: number, teacherId: number, scheduledFor: Date): Promise<AcademicModule>;
  abstract cancelScheduled(moduleId: number, teacherId: number, now: Date): Promise<AcademicModule>;
  abstract updateRules(moduleId: number, rules: AttendanceRules): Promise<AcademicModule>;
  abstract updateExtraFields(moduleId: number, fields: ExtraField[]): Promise<AcademicModule>;
}
