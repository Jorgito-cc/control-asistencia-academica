import { Controller, Get, ParseIntPipe, Query, StreamableFile } from '@nestjs/common';
import type { AuthUser } from '../../../../shared/domain/auth-user';
import { ForbiddenError, NotFoundError } from '../../../../shared/domain/errors';
import { CurrentUser, Roles } from '../../../../shared/infrastructure/security/decorators';
import { ActiveModuleService } from '../../../academic-modules/application/active-module.service';
import { AdminProfileService } from '../../application/admin-profile.use-cases';

/** Perfil del docente asignado al módulo que el usuario puede consultar. */
@Controller('teacher')
@Roles('ADMIN', 'TEACHER', 'STUDENT')
export class TeacherController {
  constructor(
    private readonly activeModule: ActiveModuleService,
    private readonly profiles: AdminProfileService,
  ) {}

  @Get()
  async get(@CurrentUser() user: AuthUser, @Query('moduleId', new ParseIntPipe({ optional: true })) moduleId?: number) {
    return { teacher: await this.findTeacher(user, moduleId) };
  }

  @Get('photo')
  async photo(@CurrentUser() user: AuthUser, @Query('moduleId', new ParseIntPipe({ optional: true })) moduleId?: number) {
    const teacher = await this.findTeacher(user, moduleId);
    if (!teacher) throw new NotFoundError('El módulo no tiene docente');
    const photo = await this.profiles.getPhoto(teacher.id);
    return new StreamableFile(photo.data, { type: photo.mimeType });
  }

  private async findTeacher(user: AuthUser, moduleId?: number) {
    let module;
    if (user.role === 'STUDENT') {
      if (moduleId !== undefined && moduleId !== user.moduleId) {
        throw new ForbiddenError('Sin acceso a otros módulos');
      }
      if (user.moduleId === null) throw new NotFoundError('No hay un módulo activo');
      module = await this.activeModule.getActiveById(user.moduleId);
    } else {
      module = await this.activeModule.resolve(moduleId, user.role === 'TEACHER' ? user.id : undefined);
    }
    if (!module) throw new NotFoundError('No hay un módulo activo');
    if (!module.createdBy) return null;
    return this.profiles.get(module.createdBy).catch(() => null);
  }
}
