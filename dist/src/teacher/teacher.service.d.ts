import { PrismaService } from '../prisma/prisma.service';
import { CreateTeacherDto, UpdateTeacherDto, CreateScheduleDto, UpdateScheduleDto } from './dto';
export declare class TeacherService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(filters: {
        specialties?: string[];
        minRating?: number;
        isApproved?: boolean;
        search?: string;
    }): Promise<({
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
        introVideoUrl: string | null;
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
        introVideoUrl: string | null;
        readingType: string | null;
        readingTypeAr: string | null;
    }>;
    create(userId: string, dto: CreateTeacherDto): Promise<{
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
        introVideoUrl: string | null;
        readingType: string | null;
        readingTypeAr: string | null;
    }>;
    update(teacherId: string, userId: string, dto: UpdateTeacherDto): Promise<{
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
        introVideoUrl: string | null;
        readingType: string | null;
        readingTypeAr: string | null;
    }>;
    createSchedule(teacherId: string, userId: string, dto: CreateScheduleDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
        isActive: boolean;
        startTime: string;
        dayOfWeek: number;
        endTime: string;
    }>;
    updateSchedule(scheduleId: string, teacherId: string, userId: string, dto: UpdateScheduleDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
        isActive: boolean;
        startTime: string;
        dayOfWeek: number;
        endTime: string;
    }>;
    deleteSchedule(scheduleId: string, teacherId: string, userId: string): Promise<{
        message: string;
    }>;
    approveTeacher(teacherId: string, adminId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        certificates: string | null;
        canIssueCertificates: boolean | null;
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
        introVideoUrl: string | null;
        readingType: string | null;
        readingTypeAr: string | null;
    }>;
    rejectTeacher(teacherId: string): Promise<{
        message: string;
    }>;
}
