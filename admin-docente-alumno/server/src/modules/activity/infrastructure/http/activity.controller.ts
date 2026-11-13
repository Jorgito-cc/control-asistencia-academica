import { Controller, Get, Query } from '@nestjs/common';
import type { AuthUser } from '../../../../shared/domain/auth-user';
import { CurrentUser, Roles } from '../../../../shared/infrastructure/security/decorators';
import { ListActivitiesUseCase } from '../../application/list-activities.use-case';
import { ListActivitiesQueryDto } from './list-activities.query';

@Controller('activity')
@Roles('TEACHER')
export class ActivityController {
  constructor(private readonly listActivities: ListActivitiesUseCase) {}

  @Get()
  list(@CurrentUser() teacher: AuthUser, @Query() query: ListActivitiesQueryDto) {
    return this.listActivities.execute(query, teacher.id);
  }
}
