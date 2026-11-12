import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  StreamableFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { AuthUser } from '../../../../shared/domain/auth-user';
import { CurrentUser, Roles } from '../../../../shared/infrastructure/security/decorators';
import { JustificationsService } from '../../application/justifications.service';
import type { UploadedImage } from '../../domain/justification';
import { MAX_JUSTIFICATION_FILE_BYTES, MAX_JUSTIFICATION_FILES } from '../../domain/justification-policy';
import {
  ApproveJustificationDto,
  ListJustificationsQueryDto,
  RejectJustificationDto,
  SubmitJustificationDto,
  TeacherJustificationDto,
} from './justification.dto';

// Se deja pasar un poco más del límite para responder con un mensaje claro desde el dominio.
const images = () =>
  FilesInterceptor('files', MAX_JUSTIFICATION_FILES + 1, { limits: { fileSize: MAX_JUSTIFICATION_FILE_BYTES + 1 } });

@Controller('justifications')
export class JustificationsController {
  constructor(private readonly justifications: JustificationsService) {}

  @Post('mine')
  @Roles('STUDENT')
  @UseInterceptors(images())
  submit(
    @CurrentUser() user: AuthUser,
    @Body() body: SubmitJustificationDto,
    @UploadedFiles() files: UploadedImage[] = [],
  ) {
    return this.justifications.submit(user, { sessionId: body.sessionId, reason: body.reason, files });
  }

  @Get('mine')
  @Roles('STUDENT')
  mine(@CurrentUser() user: AuthUser) {
    return this.justifications.listMine(user);
  }

  @Get()
  @Roles('TEACHER')
  list(@CurrentUser() teacher: AuthUser, @Query() query: ListJustificationsQueryDto) {
    return this.justifications.list(teacher, query);
  }

  @Post()
  @Roles('TEACHER')
  @UseInterceptors(images())
  createByTeacher(
    @CurrentUser() teacher: AuthUser,
    @Body() body: TeacherJustificationDto,
    @UploadedFiles() files: UploadedImage[] = [],
  ) {
    return this.justifications.createByTeacher(teacher, {
      studentId: body.studentId,
      sessionId: body.sessionId,
      status: body.status,
      reason: body.reason,
      files,
    });
  }

  @Post(':id/approve')
  @Roles('TEACHER')
  approve(@CurrentUser() teacher: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() body: ApproveJustificationDto) {
    return this.justifications.approve(teacher, id, body);
  }

  @Post(':id/reject')
  @Roles('TEACHER')
  reject(@CurrentUser() teacher: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() body: RejectJustificationDto) {
    return this.justifications.reject(teacher, id, body.comment);
  }

  @Get(':id/files/:fileId')
  @Roles('TEACHER', 'STUDENT')
  async file(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('fileId', ParseIntPipe) fileId: number,
  ) {
    const file = await this.justifications.getFile(user, id, fileId);
    return new StreamableFile(file.data, { type: file.mimeType });
  }
}
