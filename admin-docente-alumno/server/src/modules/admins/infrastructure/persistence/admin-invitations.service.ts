import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import {
  ConflictError, ForbiddenError, NotFoundError, UnauthorizedError, ValidationError,
} from '../../../../shared/domain/errors';
import { ensureStrongPassword } from '../../application/change-password.use-case';
import { PasswordHasher } from '../../application/password-hasher.port';
import { AdminInvitationOrmEntity } from './admin-invitation.orm-entity';
import { AdminOrmEntity } from './admin.orm-entity';

const invitationId = 1;
const invitationLifetime = 24 * 60 * 60 * 1000;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function digest(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

@Injectable()
export class AdminInvitationsService {
  constructor(
    private readonly database: DataSource,
    private readonly config: ConfigService,
    private readonly hasher: PasswordHasher,
  ) {}

  async status(): Promise<{ activated: boolean }> {
    const { slug } = this.configuration();
    const invite = await this.database.getRepository(AdminInvitationOrmEntity).findOneBy({
      id: invitationId,
      tenantSlug: slug,
    });
    return { activated: Boolean(invite?.usedAt) };
  }

  async bootstrap(
    authorization: string | undefined,
    input: { slug: string; email: string; name: string },
  ): Promise<{ token: string } | { activated: true }> {
    const { slug, key } = this.configuration();
    const suppliedKey = /^Bearer ([^\s]+)$/i.exec(authorization ?? '')?.[1];
    if (!suppliedKey || !timingSafeEqual(digest(suppliedKey), digest(key))) {
      throw new UnauthorizedError('La credencial de inicio no es válida');
    }
    if (input.slug !== slug) {
      throw new ForbiddenError('La solicitud corresponde a otra institución');
    }
    const email = input.email.trim().toLowerCase();
    const name = input.name.trim();
    if (!name || name.includes('\u0000')) throw new ValidationError('Escribe el nombre del administrador');

    return this.database.transaction(async (manager) => {
      // El bloqueo también cubre la primera emisión, cuando todavía no existe una fila.
      await manager.query('SELECT pg_advisory_xact_lock(1794441600)');
      const invites = manager.getRepository(AdminInvitationOrmEntity);
      const invite = await invites.findOneBy({ id: invitationId });
      if (invite && (invite.tenantSlug !== slug || invite.email !== email)) {
        throw new ConflictError('La instalación ya tiene una invitación para otra cuenta');
      }
      if (invite?.usedAt) return { activated: true };
      if (await manager.getRepository(AdminOrmEntity).exists()) {
        throw new ConflictError('La instalación ya tiene un administrador');
      }
      const token = randomBytes(32).toString('base64url');
      await invites.save(invites.create({
        id: invitationId,
        tenantSlug: slug,
        email,
        fullName: name,
        tokenHash: digest(token),
        expiresAt: new Date(Date.now() + invitationLifetime),
        usedAt: null,
        adminId: null,
      }));
      return { token };
    });
  }

  async activate(token: string, password: string): Promise<{ status: 'activated' }> {
    const { slug } = this.configuration();
    await this.database.transaction(async (manager) => {
      await manager.query('SELECT pg_advisory_xact_lock(1794441600)');
      const invites = manager.getRepository(AdminInvitationOrmEntity);
      const invite = await invites.findOneBy({ id: invitationId, tenantSlug: slug });
      if (!invite || !timingSafeEqual(digest(token), invite.tokenHash)) {
        throw new ValidationError('La invitación no es válida');
      }
      if (invite.usedAt) throw new ConflictError('La invitación ya fue utilizada');
      if (invite.expiresAt.getTime() <= Date.now()) {
        throw new ValidationError('La invitación venció. Solicita un enlace nuevo');
      }
      ensureStrongPassword(password);
      const admins = manager.getRepository(AdminOrmEntity);
      if (await admins.exists()) {
        throw new ConflictError('La instalación ya tiene un administrador');
      }
      const admin = await admins.save(admins.create({
        email: invite.email,
        fullName: invite.fullName,
        passwordHash: await this.hasher.hash(password),
        role: 'ADMIN',
      }));
      invite.usedAt = new Date();
      invite.adminId = admin.id;
      await invites.save(invite);
    });
    return { status: 'activated' };
  }

  private configuration(): { slug: string; key: string } {
    const slug = this.config.get<string>('PLATFORM_TENANT_SLUG') ?? '';
    const key = this.config.get<string>('PLATFORM_BOOTSTRAP_KEY') ?? '';
    if (slug.length < 3 || slug.length > 63 || !slugPattern.test(slug) || key.length < 32 || /\s/.test(key)) {
      throw new NotFoundError('La activación por invitación no está disponible');
    }
    return { slug, key };
  }
}
