import type { AttendanceRules } from '../../../shared/domain/attendance-rules';
import type { ExtraField } from '../../../shared/domain/extra-fields';

/** ACTIVE: en uso (solo uno por docente o para administración). SCHEDULED: se activará en `scheduledFor`. */
export type ModuleStatus = 'ACTIVE' | 'SCHEDULED' | 'CLOSED' | 'CANCELLED';

export interface AcademicModule {
  id: number;
  name: string;
  status: ModuleStatus;
  isActive: boolean;
  /** null mientras está programado. */
  activatedAt: Date | null;
  closedAt: Date | null;
  scheduledFor: Date | null;
  /** Cuenta que activó el módulo. */
  createdBy: number | null;
  /** null para los módulos administrados en el flujo histórico. */
  teacherId: number | null;
  rules: AttendanceRules;
  /** Campos adicionales de los estudiantes de este módulo. */
  extraFields: ExtraField[];
}

export interface AcademicModuleSummary extends AcademicModule {
  studentCount: number;
  sessionCount: number;
  firstDate: string | null;
  lastDate: string | null;
}

/** Fila del historial de módulos. */
export interface ModuleListItem extends AcademicModuleSummary {
  teacherName: string | null;
  /** Asistencia global sobre las clases ya realizadas; null si aún no hubo ninguna. */
  attendancePercentage: number | null;
}
