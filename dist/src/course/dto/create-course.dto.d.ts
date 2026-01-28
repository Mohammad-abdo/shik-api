import { CourseStatus } from '@prisma/client';
export declare class CreateCourseDto {
    title: string;
    titleAr?: string;
    description?: string;
    descriptionAr?: string;
    teacherId?: string;
    teacherIds?: string[];
    price: number;
    duration?: number;
    image?: string;
    introVideoUrl?: string;
    introVideoThumbnail?: string;
    status?: CourseStatus;
}
