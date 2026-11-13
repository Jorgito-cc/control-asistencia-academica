export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT'

export interface AuthUser {
  id: number
  role: Role
  name: string
  email: string
  moduleId: number | null
}

export interface LoginResult {
  accessToken: string
  user: AuthUser
}

/** Ruta de inicio según el rol. */
const homePaths: Record<Role, string> = {
  ADMIN: '/admin/docentes',
  TEACHER: '/docente',
  STUDENT: '/estudiante',
}

export const homePathFor = (role: Role) => homePaths[role]
