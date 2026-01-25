import { ContentType } from '@prisma/client';
export declare class CreateContentDto {
    title: string;
    description?: string;
    contentType: ContentType;
}
