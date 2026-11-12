import type { AuthUser, LoginResult } from './auth-user'

export interface AuthRepository {
  loginAdmin(email: string, password: string): Promise<LoginResult>
  loginStudent(identifier: string, moduleId?: number): Promise<LoginResult>
  me(): Promise<AuthUser>
  logout(): Promise<void>
}
