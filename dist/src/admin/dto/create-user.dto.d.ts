import { UserRoleEnum as UserRole, UserStatus } from '@prisma/client';
export declare class CreateUserDto {
    email: string;
    firstName: string;
    firstNameAr?: string;
    lastName: string;
    lastNameAr?: string;
    password: string;
    phone?: string;
    role: UserRole;
    status?: UserStatus;
    roleIds?: string[];
}
