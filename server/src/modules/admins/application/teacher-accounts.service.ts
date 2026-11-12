import { Injectable } from '@nestjs/common';
import { ConflictError, ValidationError } from '../../../shared/domain/errors';
import { isUniqueViolation } from '../../../shared/infrastructure/persistence-errors';
import type { TeacherAccount } from '../domain/admin';
import { AdminRepository } from '../domain/admin.repository';
import { ensureStrongPassword } from './change-password.use-case';
import { PasswordHasher } from './password-hasher.port';

@Injectable()
export class TeacherAccountsService {
  constructor(
    private readonly admins: AdminRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  list(): Promise<TeacherAccount[]> {
    return this.admins.listTeachers();
  }

  async create(input: { fullName: string; email: string; password: string }): Promise<TeacherAccount> {
    const fullName = input.fullName.trim();
    const email = input.email.trim().toLowerCase();
    const duplicate = 'Ya existe una cuenta con ese correo';
    if (!fullName || fullName.includes('\u0000')) throw new ValidationError('Ingresa un nombre completo válido');
    ensureStrongPassword(input.password);
    if (await this.admins.findByEmail(email)) throw new ConflictError(duplicate);

    const passwordHash = await this.hasher.hash(input.password);
    try {
      const { id } = await this.admins.create({
        fullName,
        email,
        passwordHash,
        role: 'TEACHER',
      });
      return { id, fullName, email };
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictError(duplicate);
      throw error;
    }
  }
}
