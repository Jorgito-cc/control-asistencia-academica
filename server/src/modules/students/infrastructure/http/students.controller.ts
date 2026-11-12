import { Body, Controller, Get, Param, ParseBoolPipe, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import type { AuthUser } from '../../../../shared/domain/auth-user';
import { CurrentUser, Roles } from '../../../../shared/infrastructure/security/decorators';
import { ListStudentsUseCase } from '../../application/list-students.use-case';
import { ManageStudentsService } from '../../application/manage-students.service';
import { StudentDto, StudentStatusDto } from './student.dto';

@Controller('students')
@Roles('TEACHER')
export class StudentsController {
  constructor(
    private readonly listStudents: ListStudentsUseCase,
    private readonly manage: ManageStudentsService,
  ) {}

  @Get()
  list(
    @CurrentUser() teacher: AuthUser,
    @Query('search') search?: string,
    @Query('moduleId', new ParseIntPipe({ optional: true })) moduleId?: number,
    @Query('includeInactive', new ParseBoolPipe({ optional: true })) includeInactive?: boolean,
  ) {
    return this.listStudents.execute(teacher.id, search, moduleId, includeInactive ?? false);
  }

  @Post()
  create(@CurrentUser() teacher: AuthUser, @Body() body: StudentDto) {
    return this.manage.create(teacher, body);
  }

  @Patch(':id')
  update(@CurrentUser() teacher: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() body: StudentDto) {
    return this.manage.update(teacher, id, body);
  }

  @Patch(':id/status')
  setStatus(@CurrentUser() teacher: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() body: StudentStatusDto) {
    return this.manage.setActive(teacher, id, body.active);
  }
}
