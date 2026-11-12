import { MigrationInterface, QueryRunner } from 'typeorm';

export class TeacherModules1794441800000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE modules ADD COLUMN teacher_id INTEGER REFERENCES admins(id)');
    await queryRunner.query('DROP INDEX ux_modules_single_active');
    await queryRunner.query('DROP INDEX ux_modules_single_scheduled');
    await queryRunner.query(`
      CREATE UNIQUE INDEX ux_modules_single_active ON modules (is_active)
        WHERE is_active AND teacher_id IS NULL;
      CREATE UNIQUE INDEX ux_modules_single_scheduled ON modules (status)
        WHERE status = 'SCHEDULED' AND teacher_id IS NULL;
      CREATE UNIQUE INDEX ux_modules_teacher_active ON modules (teacher_id)
        WHERE is_active AND teacher_id IS NOT NULL;
      CREATE UNIQUE INDEX ux_modules_teacher_scheduled ON modules (teacher_id)
        WHERE status = 'SCHEDULED' AND teacher_id IS NOT NULL;
      CREATE INDEX ix_modules_teacher ON modules (teacher_id) WHERE teacher_id IS NOT NULL;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const [{ hasTeacherModules }] = await queryRunner.query(
      'SELECT EXISTS (SELECT 1 FROM modules WHERE teacher_id IS NOT NULL) AS "hasTeacherModules"',
    );
    if (hasTeacherModules) {
      throw new Error('No se puede eliminar el alcance por docente mientras existan módulos de docentes.');
    }
    await queryRunner.query(`
      DROP INDEX ix_modules_teacher;
      DROP INDEX ux_modules_teacher_scheduled;
      DROP INDEX ux_modules_teacher_active;
      DROP INDEX ux_modules_single_scheduled;
      DROP INDEX ux_modules_single_active;
      ALTER TABLE modules DROP COLUMN teacher_id;
      CREATE UNIQUE INDEX ux_modules_single_active ON modules (is_active) WHERE is_active;
      CREATE UNIQUE INDEX ux_modules_single_scheduled ON modules (status) WHERE status = 'SCHEDULED';
    `);
  }
}
