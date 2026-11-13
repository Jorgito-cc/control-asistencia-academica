import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminProfileService } from './application/admin-profile.use-cases';
import { ChangePasswordUseCase } from './application/change-password.use-case';
import { ActivityModule } from '../activity/activity.module';
import { EnsureDefaultAdminUseCase } from './application/ensure-default-admin.use-case';
import { PasswordHasher } from './application/password-hasher.port';
import { TeacherAccountsService } from './application/teacher-accounts.service';
import { AdminRepository } from './domain/admin.repository';
import { DefaultAdminSeeder } from './infrastructure/default-admin.seeder';
import { AdminInvitationsController } from './infrastructure/http/admin-invitations.controller';
import { ProfileController } from './infrastructure/http/profile.controller';
import { TeacherAccountsController } from './infrastructure/http/teacher-accounts.controller';
import { TeacherController } from './infrastructure/http/teacher.controller';
import { AcademicModulesModule } from '../academic-modules/academic-modules.module';
import { AdminOrmEntity } from './infrastructure/persistence/admin.orm-entity';
import { AdminInvitationsService } from './infrastructure/persistence/admin-invitations.service';
import { TypeormAdminRepository } from './infrastructure/persistence/typeorm-admin.repository';
import { BcryptPasswordHasher } from './infrastructure/security/bcrypt-password.hasher';

@Module({
  imports: [TypeOrmModule.forFeature([AdminOrmEntity]), AcademicModulesModule, ActivityModule],
  controllers: [ProfileController, TeacherController, TeacherAccountsController, AdminInvitationsController],
  providers: [
    { provide: AdminRepository, useClass: TypeormAdminRepository },
    { provide: PasswordHasher, useClass: BcryptPasswordHasher },
    EnsureDefaultAdminUseCase,
    DefaultAdminSeeder,
    AdminProfileService,
    ChangePasswordUseCase,
    AdminInvitationsService,
    TeacherAccountsService,
  ],
  exports: [AdminRepository, PasswordHasher],
})
export class AdminsModule {}
