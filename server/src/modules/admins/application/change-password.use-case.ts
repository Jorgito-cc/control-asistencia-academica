import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../../shared/domain/auth-user';
import { BusinessRuleError, NotFoundError, UnauthorizedError } from '../../../shared/domain/errors';
import { ActiveModuleService } from '../../academic-modules/application/active-module.service';
import { ActivityRecorder } from '../../activity/application/activity-recorder.service';
import { AdminRepository } from '../domain/admin.repository';
import { PasswordHasher } from './password-hasher.port';

/** Reglas mínimas de una contraseña para una cuenta del personal. */
export function ensureStrongPassword(password: string): void {
  if (password.length < 8) throw new BusinessRuleError('La nueva contraseña debe tener al menos 8 caracteres');
  if (Buffer.byteLength(password, 'utf8') > 72) {
    throw new BusinessRuleError('La nueva contraseña puede tener hasta 72 bytes');
  }
  if (!/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(password) || !/\d/.test(password)) {
    throw new BusinessRuleError('La nueva contraseña debe combinar letras y números');
  }
}

/** Cada miembro del personal cambia su propia contraseña confirmando la actual. */
@Injectable()
export class ChangePasswordUseCase {
  constructor(
    private readonly admins: AdminRepository,
    private readonly hasher: PasswordHasher,
    private readonly activeModule: ActiveModuleService,
    private readonly activity: ActivityRecorder,
  ) {}

  async execute(user: AuthUser, currentPassword: string, newPassword: string): Promise<void> {
    const admin = await this.admins.findById(user.id);
    if (!admin || admin.role !== user.role) throw new NotFoundError('La cuenta ya no existe');
    if (!(await this.hasher.compare(currentPassword, admin.passwordHash))) {
      throw new UnauthorizedError('La contraseña actual no es correcta');
    }
    ensureStrongPassword(newPassword);
    if (await this.hasher.compare(newPassword, admin.passwordHash)) {
      throw new BusinessRuleError('La nueva contraseña debe ser distinta de la actual');
    }
    await this.admins.updatePasswordHash(admin.id, await this.hasher.hash(newPassword));

    const module = await this.activeModule.getActive(user.role === 'TEACHER' ? user.id : null);
    await this.activity.record({
      actor: user,
      action: 'CHANGE_PASSWORD',
      moduleId: module?.id ?? null,
      description: `${admin.fullName} cambió su contraseña`,
    });
  }
}
