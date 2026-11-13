import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../../shared/domain/auth-user';
import { UnauthorizedError } from '../../../shared/domain/errors';
import { ActiveModuleService } from '../../academic-modules/application/active-module.service';
import { StudentRepository } from '../../students/domain/student.repository';

/** Verifica que el estudiante autenticado siga perteneciendo al módulo activo (RF-01). */
@Injectable()
export class StudentContextService {
  constructor(
    private readonly activeModule: ActiveModuleService,
    private readonly students: StudentRepository,
  ) {}

  async resolve(user: AuthUser) {
    const module =
      user.role === 'STUDENT' && user.moduleId !== null
        ? await this.activeModule.getActiveById(user.moduleId)
        : null;
    const student = module ? await this.students.findById(user.id) : null;
    if (!module || !student || student.moduleId !== module.id) {
      throw new UnauthorizedError('Tu sesión ya no corresponde al módulo activo. Vuelve a ingresar.');
    }
    if (!student.active) {
      throw new UnauthorizedError('Fuiste dado de baja del módulo. Consulta con tu docente.');
    }
    return { module, student };
  }
}
