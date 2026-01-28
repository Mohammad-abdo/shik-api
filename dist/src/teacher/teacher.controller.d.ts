import { TeacherService } from './teacher.service';
import { CreateTeacherDto, UpdateTeacherDto, CreateScheduleDto, UpdateScheduleDto } from './dto';
export declare class TeacherController {
    private readonly teacherService;
    constructor(teacherService: TeacherService);
    findAll(specialties?: string, minRating?: string, search?: string): Promise<({
        user: {
            id: string;
            email: string;
            phone: string;
            firstName: string;
            lastName: string;
            avatar: string;
        };
        schedules: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            teacherId: string;
            isActive: boolean;
            startTime: string;
            dayOfWeek: number;
            endTime: string;
        }[];
        _count: {
            bookings: number;
            reviews: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        certificates: string | null;
        canIssueCertificates: boolean | null;
        introVideoUrl: string | null;
        specialties: string | null;
        specialtiesAr: string | null;
        userId: string;
        bio: string | null;
        bioAr: string | null;
        image: string | null;
        experience: number | null;
        hourlyRate: number;
        rating: number;
        totalReviews: number;
        isApproved: boolean;
        approvedAt: Date | null;
        approvedBy: string | null;
        readingType: string | null;
        readingTypeAr: string | null;
    })[]>;
    findOne(id: string): Promise<{
        user: {
            id: string;
            email: string;
            phone: string;
            firstName: string;
            lastName: string;
            avatar: string;
            language: string;
        };
        reviews: ({
            student: {
                id: string;
                firstName: string;
                lastName: string;
                avatar: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            rating: number;
            teacherId: string;
            studentId: string;
            bookingId: string;
            comment: string | null;
        })[];
        schedules: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            teacherId: string;
            isActive: boolean;
            startTime: string;
            dayOfWeek: number;
            endTime: string;
        }[];
        _count: {
            bookings: number;
            reviews: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        certificates: string | null;
        canIssueCertificates: boolean | null;
        introVideoUrl: string | null;
        specialties: string | null;
        specialtiesAr: string | null;
        userId: string;
        bio: string | null;
        bioAr: string | null;
        image: string | null;
        experience: number | null;
        hourlyRate: number;
        rating: number;
        totalReviews: number;
        isApproved: boolean;
        approvedAt: Date | null;
        approvedBy: string | null;
        readingType: string | null;
        readingTypeAr: string | null;
    }>;
    create(user: any, dto: CreateTeacherDto): Promise<{
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            avatar: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        certificates: string | null;
        canIssueCertificates: boolean | null;
        introVideoUrl: string | null;
        specialties: string | null;
        specialtiesAr: string | null;
        userId: string;
        bio: string | null;
        bioAr: string | null;
        image: string | null;
        experience: number | null;
        hourlyRate: number;
        rating: number;
        totalReviews: number;
        isApproved: boolean;
        approvedAt: Date | null;
        approvedBy: string | null;
        readingType: string | null;
        readingTypeAr: string | null;
    }>;
    update(id: string, user: any, dto: UpdateTeacherDto): Promise<{
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            avatar: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        certificates: string | null;
        canIssueCertificates: boolean | null;
        introVideoUrl: string | null;
        specialties: string | null;
        specialtiesAr: string | null;
        userId: string;
        bio: string | null;
        bioAr: string | null;
        image: string | null;
        experience: number | null;
        hourlyRate: number;
        rating: number;
        totalReviews: number;
        isApproved: boolean;
        approvedAt: Date | null;
        approvedBy: string | null;
        readingType: string | null;
        readingTypeAr: string | null;
    }>;
    createSchedule(id: string, user: any, dto: CreateScheduleDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
        isActive: boolean;
        startTime: string;
        dayOfWeek: number;
        endTime: string;
    }>;
    updateSchedule(teacherId: string, scheduleId: string, user: any, dto: UpdateScheduleDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
        isActive: boolean;
        startTime: string;
        dayOfWeek: number;
        endTime: string;
    }>;
    deleteSchedule(teacherId: string, scheduleId: string, user: any): Promise<{
        message: string;
    }>;
    approveTeacher(id: string, user: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        certificates: string | null;
        canIssueCertificates: boolean | null;
        introVideoUrl: string | null;
        specialties: string | null;
        specialtiesAr: string | null;
        userId: string;
        bio: string | null;
        bioAr: string | null;
        image: string | null;
        experience: number | null;
        hourlyRate: number;
        rating: number;
        totalReviews: number;
        isApproved: boolean;
        approvedAt: Date | null;
        approvedBy: string | null;
        readingType: string | null;
        readingTypeAr: string | null;
    }>;
    rejectTeacher(id: string): Promise<{
        message: string;
    }>;
}
