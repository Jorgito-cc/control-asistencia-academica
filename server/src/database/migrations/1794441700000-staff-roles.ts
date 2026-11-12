import type { MigrationInterface, QueryRunner } from 'typeorm';

export class StaffRoles1794441700000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE admins
        ADD COLUMN role VARCHAR(10) NOT NULL DEFAULT 'ADMIN',
        ADD CONSTRAINT ck_admins_role CHECK (role IN ('ADMIN', 'TEACHER'))
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM admins WHERE role = 'TEACHER') THEN
          RAISE EXCEPTION 'No se puede revertir la migración con cuentas de docentes existentes';
        END IF;
      END; $$
    `);
    await queryRunner.query('ALTER TABLE admins DROP COLUMN role');
  }
}
