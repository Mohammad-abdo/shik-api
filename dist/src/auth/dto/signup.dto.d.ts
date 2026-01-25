import { UserRoleEnum as UserRole } from '@prisma/client';
export declare class SignUpDto {
    email: string;
    phone?: string;
    firstName: string;
    lastName: string;
    password: string;
    role?: UserRole;
    user_type?: 'student' | 'sheikh' | 'teacher';
    specialties?: string[];
    hourlyRate?: number;
}
