import { UserRoleEnum as UserRole, UserStatus } from '@prisma/client';
export declare class UpdateUserDto {
    email?: string;
    firstName?: string;
    firstNameAr?: string;
    lastName?: string;
    lastNameAr?: string;
    phone?: string;
    role?: UserRole;
    status?: UserStatus;
    roleIds?: string[];
}
