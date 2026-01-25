import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateTeacherDto,
  UpdateTeacherDto,
  CreateScheduleDto,
  UpdateScheduleDto,
} from './dto';

@Injectable()
export class TeacherService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: {
    specialties?: string[];
    minRating?: number;
    isApproved?: boolean;
    search?: string;
  }) {
    const where: any = {};

    if (filters.isApproved !== undefined) {
      where.isApproved = filters.isApproved;
    } else {
      where.isApproved = true; // Only show approved teachers by default
    }

    // Note: MySQL JSON filtering will be handled in application layer after fetching

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

    // Filter by specialties in application layer (MySQL doesn't support array operations well)
    if (filters.specialties && filters.specialties.length > 0) {
      return teachers.filter((teacher) => {
        if (!teacher.specialties) return false;
        const teacherSpecialties = typeof teacher.specialties === 'string' 
          ? JSON.parse(teacher.specialties) 
          : teacher.specialties;
        return filters.specialties.some((spec) => teacherSpecialties.includes(spec));
      });
    }

    return teachers;
  }

  async findOne(id: string) {
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
      throw new NotFoundException('Teacher not found');
    }

    // Parse specialties if it's a JSON string
    if (teacher.specialties && typeof teacher.specialties === 'string') {
      teacher.specialties = JSON.parse(teacher.specialties);
    }

    return teacher;
  }

  async create(userId: string, dto: CreateTeacherDto) {
    // Check if user already has a teacher profile
    const existingTeacher = await this.prisma.teacher.findUnique({
      where: { userId },
    });

    if (existingTeacher) {
      throw new BadRequestException('Teacher profile already exists');
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

    // Parse specialties for response
    if (teacher.specialties && typeof teacher.specialties === 'string') {
      teacher.specialties = JSON.parse(teacher.specialties);
    }

    return teacher;
  }

  async update(teacherId: string, userId: string, dto: UpdateTeacherDto) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    if (teacher.userId !== userId) {
      throw new ForbiddenException('You can only update your own profile');
    }

    const updateData: any = {
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

    // Parse specialties for response
    if (updated.specialties && typeof updated.specialties === 'string') {
      updated.specialties = JSON.parse(updated.specialties);
    }

    return updated;
  }

  async createSchedule(teacherId: string, userId: string, dto: CreateScheduleDto) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    if (teacher.userId !== userId) {
      throw new ForbiddenException('You can only manage your own schedule');
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

  async updateSchedule(scheduleId: string, teacherId: string, userId: string, dto: UpdateScheduleDto) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: { teacher: true },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    if (schedule.teacher.userId !== userId || schedule.teacherId !== teacherId) {
      throw new ForbiddenException('You can only update your own schedule');
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

  async deleteSchedule(scheduleId: string, teacherId: string, userId: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: { teacher: true },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    if (schedule.teacher.userId !== userId || schedule.teacherId !== teacherId) {
      throw new ForbiddenException('You can only delete your own schedule');
    }

    await this.prisma.schedule.delete({
      where: { id: scheduleId },
    });

    return { message: 'Schedule deleted successfully' };
  }

  async approveTeacher(teacherId: string, adminId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
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

  async rejectTeacher(teacherId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    await this.prisma.teacher.delete({
      where: { id: teacherId },
    });

    return { message: 'Teacher profile rejected and deleted' };
  }
}



