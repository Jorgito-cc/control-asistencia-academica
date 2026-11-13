import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('admin_invitations')
export class AdminInvitationOrmEntity {
  @PrimaryColumn({ type: 'smallint' })
  id: number;

  @Column({ name: 'tenant_slug', type: 'varchar', length: 63 })
  tenantSlug: string;

  @Column({ type: 'varchar', length: 150 })
  email: string;

  @Column({ name: 'full_name', type: 'varchar', length: 150 })
  fullName: string;

  @Column({ name: 'token_hash', type: 'bytea' })
  tokenHash: Buffer;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'used_at', type: 'timestamptz', nullable: true })
  usedAt: Date | null;

  @Column({ name: 'admin_id', type: 'integer', nullable: true })
  adminId: number | null;
}
