import { Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../shared/domain/errors';
import type { AcademicModule } from '../domain/academic-module';
import { AcademicModuleRepository } from '../domain/academic-module.repository';

@Injectable()
export class ActiveModuleService {
  constructor(private readonly repository: AcademicModuleRepository) {}

  getActive(teacherId: number | null = null): Promise<AcademicModule | null> {
    return this.repository.findActive(teacherId);
  }

  async getActiveById(moduleId: number): Promise<AcademicModule | null> {
    const module = await this.repository.findById(moduleId);
    return module?.isActive && module.status === 'ACTIVE' ? module : null;
  }

  async getActiveOrFail(teacherId: number | null = null): Promise<AcademicModule> {
    const module = await this.getActive(teacherId);
    if (!module) {
      throw new NotFoundError(
        'No hay un módulo activo. El administrador debe importar estudiantes y fechas.',
      );
    }
    return module;
  }

  /** Módulo pedido por id (historial) o, si no se indica, el activo. */
  async resolve(moduleId?: number, teacherId?: number | null): Promise<AcademicModule> {
    if (moduleId === undefined) return this.getActiveOrFail(teacherId);
    const module = await this.repository.findById(moduleId);
    if (!module || (teacherId !== undefined && module.teacherId !== teacherId)) {
      throw new NotFoundError('El módulo no existe');
    }
    return module;
  }

  async getActiveSummary(teacherId: number | null = null) {
    const module = await this.getActive(teacherId);
    return module ? this.repository.summarize(module) : null;
  }
}
