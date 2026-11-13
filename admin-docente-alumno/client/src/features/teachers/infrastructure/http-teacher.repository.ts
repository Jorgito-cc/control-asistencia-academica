import { http } from '../../../core/http/http-client'
import type { CreateTeacherInput, Teacher, TeacherRepository } from '../domain/teacher.repository'

export class HttpTeacherRepository implements TeacherRepository {
  async list() {
    const { data } = await http.get<{ teachers: Teacher[] }>('/teachers')
    return data.teachers
  }

  async create(input: CreateTeacherInput) {
    const { data } = await http.post<{ teacher: Teacher }>('/teachers', input)
    return data.teacher
  }
}
