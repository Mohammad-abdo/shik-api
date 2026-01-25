"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeacherService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TeacherService = class TeacherService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(filters) {
        const where = {};
        if (filters.isApproved !== undefined) {
            where.isApproved = filters.isApproved;
        }
        else {
            where.isApproved = true;
        }
        if (filters.minRating) {
            where.rating = {
                gte: filters.minRating,
            };
        }
        if (filters.search) {
            where.user = {
                OR: [
                    { firstName: { contains: filters.search, mode: 'insensitive' } },
                    { lastName: { contains: filters.search, mode: 'insensitive' } },
                ],
            };
        }
        const teachers = await this.prisma.teacher.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                        phone: true,
                    },
                },
                schedules: {
                    where: { isActive: true },
                },
                _count: {
                    select: {
                        reviews: true,
                        bookings: true,
                    },
                },
            },
            orderBy: {
                rating: 'desc',
            },
        });
        if (filters.specialties && filters.specialties.length > 0) {
            return teachers.filter((teacher) => {
                if (!teacher.specialties)
                    return false;
                const teacherSpecialties = typeof teacher.specialties === 'string'
                    ? JSON.parse(teacher.specialties)
                    : teacher.specialties;
                return filters.specialties.some((spec) => teacherSpecialties.includes(spec));
            });
        }
        return teachers;
    }
    async findOne(id) {
        const teacher = await this.prisma.teacher.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                        phone: true,
                        language: true,
                    },
                },
                schedules: {
                    where: { isActive: true },
                },
                reviews: {
                    include: {
                        student: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                avatar: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 10,
                },
                _count: {
                    select: {
                        reviews: true,
                        bookings: true,
                    },
                },
            },
        });
        if (!teacher) {
            throw new common_1.NotFoundException('Teacher not found');
        }
        if (teacher.specialties && typeof teacher.specialties === 'string') {
            teacher.specialties = JSON.parse(teacher.specialties);
        }
        return teacher;
    }
    async create(userId, dto) {
        const existingTeacher = await this.prisma.teacher.findUnique({
            where: { userId },
        });
        if (existingTeacher) {
            throw new common_1.BadRequestException('Teacher profile already exists');
        }
        const teacher = await this.prisma.teacher.create({
            data: {
                userId,
                bio: dto.bio,
                image: dto.image,
                experience: dto.experience,
                hourlyRate: dto.hourlyRate,
                specialties: dto.specialties ? JSON.stringify(dto.specialties) : null,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                    },
                },
            },
        });
        if (teacher.specialties && typeof teacher.specialties === 'string') {
            teacher.specialties = JSON.parse(teacher.specialties);
        }
        return teacher;
    }
    async update(teacherId, userId, dto) {
        const teacher = await this.prisma.teacher.findUnique({
            where: { id: teacherId },
        });
        if (!teacher) {
            throw new common_1.NotFoundException('Teacher not found');
        }
        if (teacher.userId !== userId) {
            throw new common_1.ForbiddenException('You can only update your own profile');
        }
        const updateData = {
            bio: dto.bio,
            image: dto.image,
            experience: dto.experience,
            hourlyRate: dto.hourlyRate,
        };
        if (dto.specialties !== undefined) {
            updateData.specialties = dto.specialties ? JSON.stringify(dto.specialties) : null;
        }
        const updated = await this.prisma.teacher.update({
            where: { id: teacherId },
            data: updateData,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                    },
                },
            },
        });
        if (updated.specialties && typeof updated.specialties === 'string') {
            updated.specialties = JSON.parse(updated.specialties);
        }
        return updated;
    }
    async createSchedule(teacherId, userId, dto) {
        const teacher = await this.prisma.teacher.findUnique({
            where: { id: teacherId },
        });
        if (!teacher) {
            throw new common_1.NotFoundException('Teacher not found');
        }
        if (teacher.userId !== userId) {
            throw new common_1.ForbiddenException('You can only manage your own schedule');
        }
        const schedule = await this.prisma.schedule.create({
            data: {
                teacherId,
                dayOfWeek: dto.dayOfWeek,
                startTime: dto.startTime,
                endTime: dto.endTime,
            },
        });
        return schedule;
    }
    async updateSchedule(scheduleId, teacherId, userId, dto) {
        const schedule = await this.prisma.schedule.findUnique({
            where: { id: scheduleId },
            include: { teacher: true },
        });
        if (!schedule) {
            throw new common_1.NotFoundException('Schedule not found');
        }
        if (schedule.teacher.userId !== userId || schedule.teacherId !== teacherId) {
            throw new common_1.ForbiddenException('You can only update your own schedule');
        }
        const updated = await this.prisma.schedule.update({
            where: { id: scheduleId },
            data: {
                dayOfWeek: dto.dayOfWeek,
                startTime: dto.startTime,
                endTime: dto.endTime,
                isActive: dto.isActive,
            },
        });
        return updated;
    }
    async deleteSchedule(scheduleId, teacherId, userId) {
        const schedule = await this.prisma.schedule.findUnique({
            where: { id: scheduleId },
            include: { teacher: true },
        });
        if (!schedule) {
            throw new common_1.NotFoundException('Schedule not found');
        }
        if (schedule.teacher.userId !== userId || schedule.teacherId !== teacherId) {
            throw new common_1.ForbiddenException('You can only delete your own schedule');
        }
        await this.prisma.schedule.delete({
            where: { id: scheduleId },
        });
        return { message: 'Schedule deleted successfully' };
    }
    async approveTeacher(teacherId, adminId) {
        const teacher = await this.prisma.teacher.findUnique({
            where: { id: teacherId },
        });
        if (!teacher) {
            throw new common_1.NotFoundException('Teacher not found');
        }
        const updated = await this.prisma.teacher.update({
            where: { id: teacherId },
            data: {
                isApproved: true,
                approvedAt: new Date(),
                approvedBy: adminId,
            },
        });
        return updated;
    }
    async rejectTeacher(teacherId) {
        const teacher = await this.prisma.teacher.findUnique({
            where: { id: teacherId },
        });
        if (!teacher) {
            throw new common_1.NotFoundException('Teacher not found');
        }
        await this.prisma.teacher.delete({
            where: { id: teacherId },
        });
        return { message: 'Teacher profile rejected and deleted' };
    }
};
exports.TeacherService = TeacherService;
exports.TeacherService = TeacherService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TeacherService);
//# sourceMappingURL=teacher.service.js.map