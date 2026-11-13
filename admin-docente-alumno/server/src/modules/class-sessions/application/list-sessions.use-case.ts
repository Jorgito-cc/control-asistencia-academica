import { Injectable } from '@nestjs/common';
import { ActiveModuleService } from '../../academic-modules/application/active-module.service';
import { ClassSessionRepository } from '../domain/class-session.repository';

@Injectable()
export class ListSessionsUseCase {
  constructor(
    private readonly sessions: ClassSessionRepository,
    private readonly activeModule: ActiveModuleService,
  ) {}

  async execute(teacherId: number, moduleId?: number) {
    const module = moduleId === undefined
      ? await this.activeModule.getActive(teacherId)
      : await this.activeModule.resolve(moduleId, teacherId);
    return module ? this.sessions.findByModule(module.id) : [];
  }
}
