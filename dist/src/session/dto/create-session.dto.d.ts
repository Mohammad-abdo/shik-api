import { SessionType } from '@prisma/client';
export declare class CreateSessionDto {
    type?: SessionType;
    userId: string;
}
