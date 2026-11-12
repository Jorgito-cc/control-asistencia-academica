import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdminInvitation1794441600000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE admin_invitations (
        id SMALLINT PRIMARY KEY CHECK (id = 1),
        tenant_slug VARCHAR(63) NOT NULL,
        email VARCHAR(150) NOT NULL,
        full_name VARCHAR(150) NOT NULL,
        token_hash BYTEA NOT NULL CHECK (octet_length(token_hash) = 32),
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ,
        admin_id INTEGER UNIQUE REFERENCES admins(id),
        CHECK ((used_at IS NULL) = (admin_id IS NULL))
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE admin_invitations');
  }
}
