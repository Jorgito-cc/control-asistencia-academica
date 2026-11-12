import { Body, Controller, Get, Post } from '@nestjs/common';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { Roles } from '../../../../shared/infrastructure/security/decorators';
import { TeacherAccountsService } from '../../application/teacher-accounts.service';

class CreateTeacherDto {
  @IsString()
  @MaxLength(150)
  fullName: string;

  @IsEmail({}, { message: 'Ingresa un correo válido' })
  @MaxLength(150)
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}

@Controller('teachers')
@Roles('ADMIN')
export class TeacherAccountsController {
  constructor(private readonly accounts: TeacherAccountsService) {}

  @Get()
  async list() {
    return { teachers: await this.accounts.list() };
  }

  @Post()
  async create(@Body() body: CreateTeacherDto) {
    return { teacher: await this.accounts.create(body) };
  }
}
