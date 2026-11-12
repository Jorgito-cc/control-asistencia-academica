export interface Teacher {
  id: number
  fullName: string
  email: string
}

export type CreateTeacherInput = Omit<Teacher, 'id'> & { password: string }

export interface TeacherRepository {
  list(): Promise<Teacher[]>
  create(input: CreateTeacherInput): Promise<Teacher>
}
