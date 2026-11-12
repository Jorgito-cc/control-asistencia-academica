import type { StaffRole } from '../../../shared/domain/auth-user';

export interface Admin {
  id: number;
  email: string;
  passwordHash: string;
  fullName: string;
  role: StaffRole;
}

export type TeacherAccount = Pick<Admin, 'id' | 'email' | 'fullName'>;
