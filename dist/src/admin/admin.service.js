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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const notification_service_1 = require("../notification/notification.service");
const wallet_service_1 = require("../finance/wallet.service");
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
let AdminService = class AdminService {
    constructor(prisma, auditService, notificationService, walletService) {
        this.prisma = prisma;
        this.auditService = auditService;
        this.notificationService = notificationService;
        this.walletService = walletService;
    }
    async getDashboardStats() {
        const [totalUsers, totalTeachers, pendingTeachers, totalBookings, completedBookings, totalRevenue, recentBookings, totalCourses, publishedCourses, totalCourseEnrollments, totalTeacherSubscriptions, activeTeacherSubscriptions, totalStudentSubscriptions, activeStudentSubscriptions, totalStudentWallets, studentWalletsBalance, recentCourses, recentSubscriptions,] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.teacher.count({ where: { isApproved: true } }),
            this.prisma.teacher.count({ where: { isApproved: false } }),
            this.prisma.booking.count(),
            this.prisma.booking.count({ where: { status: 'COMPLETED' } }),
            this.prisma.payment.aggregate({
                where: { status: 'COMPLETED' },
                _sum: { amount: true },
            }),
            this.prisma.booking.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    student: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    teacher: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                },
                            },
                        },
                    },
                },
            }),
            this.prisma.course.count(),
            this.prisma.course.count({ where: { status: 'PUBLISHED' } }),
            this.prisma.courseEnrollment.count(),
            this.prisma.teacherSubscription.count(),
            this.prisma.teacherSubscription.count({
                where: {
                    status: 'ACTIVE',
                    endDate: { gte: new Date() },
                },
            }),
            this.prisma.studentSubscription.count(),
            this.prisma.studentSubscription.count({
                where: {
                    status: 'ACTIVE',
                    endDate: { gte: new Date() },
                },
            }),
            this.prisma.studentWallet.count(),
            this.prisma.studentWallet.aggregate({
                _sum: { balance: true },
            }),
            this.prisma.course.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    teacher: {
                        include: {
                            user: {
                                select: {
                                    firstName: true,
                                    firstNameAr: true,
                                    lastName: true,
                                    lastNameAr: true,
                                },
                            },
                        },
                    },
                    _count: {
                        select: {
                            enrollments: true,
                        },
                    },
                },
            }),
            this.prisma.teacherSubscription.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    teacher: {
                        include: {
                            user: {
                                select: {
                                    firstName: true,
                                    firstNameAr: true,
                                    lastName: true,
                                    lastNameAr: true,
                                },
                            },
                        },
                    },
                    package: true,
                },
            }),
        ]);
        return {
            stats: {
                totalUsers,
                totalTeachers,
                pendingTeachers,
                totalBookings,
                completedBookings,
                totalRevenue: totalRevenue._sum.amount || 0,
                totalCourses,
                publishedCourses,
                totalCourseEnrollments,
                totalTeacherSubscriptions,
                activeTeacherSubscriptions,
                totalStudentSubscriptions,
                activeStudentSubscriptions,
                totalStudentWallets,
                studentWalletsBalance: studentWalletsBalance._sum.balance || 0,
            },
            recentBookings,
            recentCourses,
            recentSubscriptions,
        };
    }
    async getAllUsers(page = 1, limit = 20, role, status, search) {
        try {
            const skip = (page - 1) * limit;
            const where = {};
            if (role) {
                where.role = role;
            }
            if (status) {
                where.status = status;
            }
            if (search) {
                where.OR = [
                    { email: { contains: search, mode: 'insensitive' } },
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search, mode: 'insensitive' } },
                ];
            }
            const [users, total] = await Promise.all([
                this.prisma.user.findMany({
                    where,
                    skip,
                    take: limit,
                    select: {
                        id: true,
                        email: true,
                        phone: true,
                        firstName: true,
                        firstNameAr: true,
                        lastName: true,
                        lastNameAr: true,
                        avatar: true,
                        role: true,
                        status: true,
                        createdAt: true,
                        teacherProfile: {
                            select: {
                                id: true,
                                isApproved: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                }),
                this.prisma.user.count({ where }),
            ]);
            return {
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        }
        catch (error) {
            console.error('Error in getAllUsers:', error);
            throw new common_1.BadRequestException(`Failed to fetch users: ${error.message || 'Unknown error'}`);
        }
    }
    async getAllTeachers(page = 1, limit = 20, isApproved) {
        try {
            const skip = (page - 1) * limit;
            const where = {};
            if (isApproved !== undefined) {
                where.isApproved = isApproved;
            }
            const [teachers, total] = await Promise.all([
                this.prisma.teacher.findMany({
                    where,
                    skip,
                    take: limit,
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                phone: true,
                                firstName: true,
                                firstNameAr: true,
                                lastName: true,
                                lastNameAr: true,
                                avatar: true,
                            },
                        },
                        wallet: {
                            select: {
                                id: true,
                                balance: true,
                            },
                        },
                        _count: {
                            select: {
                                bookings: true,
                                reviews: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                }),
                this.prisma.teacher.count({ where }),
            ]);
            return {
                teachers,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        }
        catch (error) {
            console.error('Error in getAllTeachers:', error);
            throw new common_1.BadRequestException(`Failed to fetch teachers: ${error.message || 'Unknown error'}`);
        }
    }
    async getAllBookings(page = 1, limit = 20, status) {
        try {
            const skip = (page - 1) * limit;
            const where = {};
            if (status) {
                where.status = status;
            }
            const [bookings, total] = await Promise.all([
                this.prisma.booking.findMany({
                    where,
                    skip,
                    take: limit,
                    include: {
                        student: {
                            select: {
                                id: true,
                                firstName: true,
                                firstNameAr: true,
                                lastName: true,
                                lastNameAr: true,
                                email: true,
                            },
                        },
                        teacher: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        firstName: true,
                                        firstNameAr: true,
                                        lastName: true,
                                        lastNameAr: true,
                                        email: true,
                                    },
                                },
                            },
                        },
                        payment: true,
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                }),
                this.prisma.booking.count({ where }),
            ]);
            return {
                bookings,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        }
        catch (error) {
            console.error('Error in getAllBookings:', error);
            throw new common_1.BadRequestException(`Failed to fetch bookings: ${error.message || 'Unknown error'}`);
        }
    }
    async getAllPayments(page = 1, limit = 20, status) {
        try {
            const skip = (page - 1) * limit;
            const where = {};
            if (status) {
                where.status = status;
            }
            const [payments, total] = await Promise.all([
                this.prisma.payment.findMany({
                    where,
                    skip,
                    take: limit,
                    include: {
                        booking: {
                            include: {
                                student: {
                                    select: {
                                        id: true,
                                        firstName: true,
                                        firstNameAr: true,
                                        lastName: true,
                                        lastNameAr: true,
                                        email: true,
                                    },
                                },
                                teacher: {
                                    include: {
                                        user: {
                                            select: {
                                                id: true,
                                                firstName: true,
                                                firstNameAr: true,
                                                lastName: true,
                                                lastNameAr: true,
                                                email: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                }),
                this.prisma.payment.count({ where }),
            ]);
            return {
                payments,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        }
        catch (error) {
            console.error('Error in getAllPayments:', error);
            throw new common_1.BadRequestException(`Failed to fetch payments: ${error.message || 'Unknown error'}`);
        }
    }
    async getPaymentStats() {
        try {
            const [totalRevenue, pendingPayments, completedPayments] = await Promise.all([
                this.prisma.payment.aggregate({
                    where: { status: 'COMPLETED' },
                    _sum: { amount: true },
                }),
                this.prisma.payment.count({ where: { status: 'PENDING' } }),
                this.prisma.payment.count({ where: { status: 'COMPLETED' } }),
            ]);
            return {
                totalRevenue: totalRevenue._sum.amount || 0,
                pendingPayments,
                completedPayments,
            };
        }
        catch (error) {
            console.error('Error in getPaymentStats:', error);
            throw new common_1.BadRequestException(`Failed to fetch payment stats: ${error.message || 'Unknown error'}`);
        }
    }
    async updateUserStatus(userId, status) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { status: status },
        });
    }
    async deleteUser(userId) {
        return this.prisma.user.delete({
            where: { id: userId },
        });
    }
    async createUser(dto, adminId) {
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [{ email: dto.email }, ...(dto.phone ? [{ phone: dto.phone }] : [])],
            },
        });
        if (existingUser) {
            throw new common_1.ConflictException('User with this email or phone already exists');
        }
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                phone: dto.phone,
                password: hashedPassword,
                firstName: dto.firstName,
                firstNameAr: dto.firstNameAr,
                lastName: dto.lastName,
                lastNameAr: dto.lastNameAr,
                role: dto.role,
                status: dto.status || 'ACTIVE',
                emailVerified: true,
                phoneVerified: !!dto.phone,
            },
            include: {
                userRoles: {
                    include: {
                        role: true,
                    },
                },
            },
        });
        if (dto.roleIds && dto.roleIds.length > 0) {
            await Promise.all(dto.roleIds.map((roleId) => this.prisma.userRole.create({
                data: {
                    userId: user.id,
                    roleId,
                },
            })));
        }
        await this.auditService.log(adminId, 'CREATE_USER', 'User', user.id, {
            email: user.email,
            role: user.role,
        });
        return user;
    }
    async createTeacher(dto, adminId) {
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [{ email: dto.email }, ...(dto.phone ? [{ phone: dto.phone }] : [])],
            },
        });
        if (existingUser) {
            throw new common_1.ConflictException('User with this email or phone already exists');
        }
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                phone: dto.phone,
                password: hashedPassword,
                firstName: dto.firstName,
                firstNameAr: dto.firstNameAr,
                lastName: dto.lastName,
                lastNameAr: dto.lastNameAr,
                role: 'TEACHER',
                status: 'ACTIVE',
                emailVerified: true,
                phoneVerified: !!dto.phone,
            },
        });
        const teacher = await this.prisma.teacher.create({
            data: {
                userId: user.id,
                bio: dto.bio,
                bioAr: dto.bioAr,
                image: dto.image,
                experience: dto.experience,
                hourlyRate: dto.hourlyRate || 0,
                specialties: dto.specialties ? JSON.stringify(dto.specialties) : null,
                specialtiesAr: dto.specialtiesAr ? JSON.stringify(dto.specialtiesAr) : null,
                readingType: dto.readingType,
                readingTypeAr: dto.readingTypeAr,
                introVideoUrl: dto.introVideoUrl,
                certificates: dto.certificates ? JSON.stringify(dto.certificates) : null,
                canIssueCertificates: dto.canIssueCertificates || false,
                isApproved: dto.isApproved !== undefined ? dto.isApproved : false,
                approvedAt: dto.isApproved ? new Date() : null,
                approvedBy: dto.isApproved ? adminId : null,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        firstNameAr: true,
                        lastName: true,
                        lastNameAr: true,
                        phone: true,
                        avatar: true,
                    },
                },
            },
        });
        await this.prisma.teacherWallet.create({
            data: {
                teacherId: teacher.id,
                balance: 0,
                pendingBalance: 0,
                totalEarned: 0,
            },
        });
        await this.auditService.log(adminId, 'CREATE_TEACHER', 'Teacher', teacher.id, {
            email: user.email,
            isApproved: teacher.isApproved,
        });
        if (teacher.specialties && typeof teacher.specialties === 'string') {
            teacher.specialties = JSON.parse(teacher.specialties);
        }
        if (teacher.specialtiesAr && typeof teacher.specialtiesAr === 'string') {
            teacher.specialtiesAr = JSON.parse(teacher.specialtiesAr);
        }
        return teacher;
    }
    async updateUser(userId, dto, adminId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (dto.email || dto.phone) {
            const existingUser = await this.prisma.user.findFirst({
                where: {
                    AND: [
                        { id: { not: userId } },
                        {
                            OR: [
                                ...(dto.email ? [{ email: dto.email }] : []),
                                ...(dto.phone ? [{ phone: dto.phone }] : []),
                            ],
                        },
                    ],
                },
            });
            if (existingUser) {
                throw new common_1.ConflictException('Email or phone already exists');
            }
        }
        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: {
                ...(dto.email && { email: dto.email }),
                ...(dto.firstName && { firstName: dto.firstName }),
                ...(dto.firstNameAr !== undefined && { firstNameAr: dto.firstNameAr }),
                ...(dto.lastName && { lastName: dto.lastName }),
                ...(dto.lastNameAr !== undefined && { lastNameAr: dto.lastNameAr }),
                ...(dto.phone && { phone: dto.phone }),
                ...(dto.role && { role: dto.role }),
                ...(dto.status && { status: dto.status }),
            },
            include: {
                userRoles: {
                    include: {
                        role: true,
                    },
                },
            },
        });
        if (dto.roleIds) {
            await this.prisma.userRole.deleteMany({
                where: { userId },
            });
            if (dto.roleIds.length > 0) {
                await Promise.all(dto.roleIds.map((roleId) => this.prisma.userRole.create({
                    data: {
                        userId,
                        roleId,
                    },
                })));
            }
        }
        await this.auditService.log(adminId, 'UPDATE_USER', 'User', userId, dto);
        return updatedUser;
    }
    async getUserById(userId) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    teacherProfile: {
                        include: {
                            wallet: {
                                include: {
                                    transactions: {
                                        take: 10,
                                        orderBy: { createdAt: 'desc' },
                                    },
                                },
                            },
                        },
                    },
                    userRoles: {
                        include: {
                            role: {
                                include: {
                                    permissions: {
                                        include: {
                                            permission: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    studentBookings: {
                        take: 5,
                        orderBy: { createdAt: 'desc' },
                    },
                    _count: {
                        select: {
                            studentBookings: true,
                            notifications: true,
                        },
                    },
                },
            });
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            return user;
        }
        catch (error) {
            console.error('Error in getUserById:', error);
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.BadRequestException(`Failed to fetch user: ${error.message || 'Unknown error'}`);
        }
    }
    async updateTeacher(teacherId, dto, adminId) {
        try {
            const teacher = await this.prisma.teacher.findUnique({
                where: { id: teacherId },
            });
            if (!teacher) {
                throw new common_1.NotFoundException('Teacher not found');
            }
            const prepareJsonValue = (value) => {
                if (value === undefined || value === null) {
                    return null;
                }
                if (typeof value === 'string') {
                    if (value.trim() === '') {
                        return null;
                    }
                    try {
                        const parsed = JSON.parse(value);
                        return parsed;
                    }
                    catch {
                        return [value];
                    }
                }
                if (Array.isArray(value) || typeof value === 'object') {
                    return value;
                }
                return [value];
            };
            const updateData = {};
            if (dto.bio !== undefined && dto.bio !== null && dto.bio !== '') {
                updateData.bio = dto.bio;
            }
            if (dto.bioAr !== undefined && dto.bioAr !== null && dto.bioAr !== '') {
                updateData.bioAr = dto.bioAr;
            }
            if (dto.hourlyRate !== undefined && dto.hourlyRate !== null) {
                updateData.hourlyRate =
                    typeof dto.hourlyRate === 'string' ? parseFloat(dto.hourlyRate) : dto.hourlyRate;
            }
            if (dto.experience !== undefined && dto.experience !== null) {
                updateData.experience =
                    typeof dto.experience === 'string' ? parseInt(dto.experience, 10) : dto.experience;
            }
            if (dto.specialties !== undefined && dto.specialties !== null) {
                const prepared = prepareJsonValue(dto.specialties);
                if (prepared !== null) {
                    updateData.specialties = prepared;
                }
            }
            if (dto.specialtiesAr !== undefined && dto.specialtiesAr !== null) {
                const prepared = prepareJsonValue(dto.specialtiesAr);
                if (prepared !== null) {
                    updateData.specialtiesAr = prepared;
                }
            }
            if (dto.readingType !== undefined && dto.readingType !== null) {
                if (typeof dto.readingType === 'string' && dto.readingType.trim().length > 0) {
                    updateData.readingType = dto.readingType;
                }
                else if (typeof dto.readingType !== 'string') {
                    updateData.readingType = dto.readingType;
                }
            }
            if (dto.readingTypeAr !== undefined &&
                dto.readingTypeAr !== null &&
                dto.readingTypeAr !== '') {
                updateData.readingTypeAr = dto.readingTypeAr;
            }
            if (dto.introVideoUrl !== undefined &&
                dto.introVideoUrl !== null &&
                dto.introVideoUrl !== '') {
                updateData.introVideoUrl = dto.introVideoUrl;
            }
            if (dto.certificates !== undefined && dto.certificates !== null) {
                const prepared = prepareJsonValue(dto.certificates);
                if (prepared !== null) {
                    updateData.certificates = prepared;
                }
            }
            if (dto.canIssueCertificates !== undefined) {
                updateData.canIssueCertificates = Boolean(dto.canIssueCertificates);
            }
            if (dto.isApproved !== undefined) {
                updateData.isApproved = Boolean(dto.isApproved);
            }
            if (dto.isSuspended !== undefined) {
                updateData.isSuspended = Boolean(dto.isSuspended);
            }
            const updatedTeacher = await this.prisma.teacher.update({
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
                    wallet: {
                        include: {
                            transactions: {
                                take: 5,
                                orderBy: { createdAt: 'desc' },
                            },
                        },
                    },
                },
            });
            await this.auditService.log(adminId, 'UPDATE_TEACHER', 'Teacher', teacherId, updateData);
            return updatedTeacher;
        }
        catch (error) {
            console.error('Error updating teacher:', error);
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.BadRequestException(`Failed to update teacher: ${error.message || 'Unknown error'}`);
        }
    }
    async getTeacherById(teacherId) {
        try {
            const teacher = await this.prisma.teacher.findUnique({
                where: { id: teacherId },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            firstNameAr: true,
                            lastName: true,
                            lastNameAr: true,
                            email: true,
                            phone: true,
                            avatar: true,
                            status: true,
                            createdAt: true,
                        },
                    },
                    wallet: {
                        include: {
                            transactions: {
                                orderBy: { createdAt: 'desc' },
                            },
                            payoutRequests: {
                                orderBy: { createdAt: 'desc' },
                            },
                        },
                    },
                    bookings: {
                        take: 10,
                        orderBy: { createdAt: 'desc' },
                        include: {
                            student: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                },
                            },
                            payment: true,
                        },
                    },
                    reviews: {
                        take: 10,
                        orderBy: { createdAt: 'desc' },
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
                    },
                    schedules: {
                        where: { isActive: true },
                    },
                    _count: {
                        select: {
                            bookings: true,
                            reviews: true,
                        },
                    },
                },
            });
            if (!teacher) {
                throw new common_1.NotFoundException('Teacher not found');
            }
            try {
                if (teacher.specialties && typeof teacher.specialties === 'string') {
                    teacher.specialties = JSON.parse(teacher.specialties);
                }
            }
            catch (e) {
                console.warn('Error parsing specialties:', e);
                teacher.specialties = null;
            }
            try {
                if (teacher.specialtiesAr && typeof teacher.specialtiesAr === 'string') {
                    teacher.specialtiesAr = JSON.parse(teacher.specialtiesAr);
                }
            }
            catch (e) {
                console.warn('Error parsing specialtiesAr:', e);
                teacher.specialtiesAr = null;
            }
            return teacher;
        }
        catch (error) {
            console.error('Error in getTeacherById:', error);
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.BadRequestException(`Failed to fetch teacher: ${error.message || 'Unknown error'}`);
        }
    }
    async getAllTeacherWallets(page = 1, limit = 20, search) {
        try {
            const skip = (page - 1) * limit;
            const where = {};
            if (search) {
                where.teacher = {
                    user: {
                        OR: [
                            { firstName: { contains: search, mode: 'insensitive' } },
                            { firstNameAr: { contains: search, mode: 'insensitive' } },
                            { lastName: { contains: search, mode: 'insensitive' } },
                            { lastNameAr: { contains: search, mode: 'insensitive' } },
                            { email: { contains: search, mode: 'insensitive' } },
                        ],
                    },
                };
            }
            const [wallets, total] = await Promise.all([
                this.prisma.teacherWallet.findMany({
                    where,
                    skip,
                    take: limit,
                    include: {
                        teacher: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        firstName: true,
                                        firstNameAr: true,
                                        lastName: true,
                                        lastNameAr: true,
                                        email: true,
                                        phone: true,
                                        avatar: true,
                                    },
                                },
                            },
                        },
                        transactions: {
                            take: 5,
                            orderBy: { createdAt: 'desc' },
                        },
                        payoutRequests: {
                            where: { status: 'PENDING' },
                            take: 5,
                        },
                    },
                    orderBy: { balance: 'desc' },
                }),
                this.prisma.teacherWallet.count({ where }),
            ]);
            for (const wallet of wallets) {
                const allTransactions = await this.prisma.walletTransaction.findMany({
                    where: { walletId: wallet.id },
                });
                const totalCredits = allTransactions
                    .filter((t) => t.type === 'CREDIT')
                    .reduce((sum, t) => sum + t.amount, 0);
                const totalDebits = allTransactions
                    .filter((t) => t.type === 'DEBIT')
                    .reduce((sum, t) => sum + t.amount, 0);
                const calculatedBalance = totalCredits - totalDebits;
                const calculatedTotalEarned = totalCredits;
                if (Math.abs(wallet.balance - calculatedBalance) > 0.01 ||
                    Math.abs(wallet.totalEarned - calculatedTotalEarned) > 0.01) {
                    await this.prisma.teacherWallet.update({
                        where: { id: wallet.id },
                        data: {
                            balance: calculatedBalance,
                            totalEarned: calculatedTotalEarned,
                        },
                    });
                    wallet.balance = calculatedBalance;
                    wallet.totalEarned = calculatedTotalEarned;
                }
            }
            return {
                wallets,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        }
        catch (error) {
            console.error('Error fetching wallets:', error);
            throw new common_1.BadRequestException(`Failed to fetch wallets: ${error.message || 'Unknown error'}`);
        }
    }
    async syncPaymentsToWallets() {
        try {
            const completedPayments = await this.prisma.payment.findMany({
                where: {
                    status: 'COMPLETED',
                },
                include: {
                    booking: {
                        include: {
                            teacher: true,
                        },
                    },
                },
            });
            let syncedCount = 0;
            let errorCount = 0;
            for (const payment of completedPayments) {
                try {
                    const existingTransaction = await this.prisma.walletTransaction.findFirst({
                        where: {
                            paymentId: payment.id,
                        },
                    });
                    if (existingTransaction) {
                        continue;
                    }
                    if (!payment.booking?.teacher) {
                        continue;
                    }
                    await this.walletService.creditWallet(payment.booking.teacherId, payment.amount, payment.bookingId, payment.id);
                    syncedCount++;
                }
                catch (error) {
                    console.error(`Error syncing payment ${payment.id}:`, error);
                    errorCount++;
                }
            }
            return {
                synced: syncedCount,
                errors: errorCount,
                total: completedPayments.length,
            };
        }
        catch (error) {
            console.error('Error syncing payments:', error);
            throw new common_1.BadRequestException(`Failed to sync payments: ${error.message || 'Unknown error'}`);
        }
    }
    async getTeacherWallet(teacherId) {
        const wallet = await this.prisma.teacherWallet.findUnique({
            where: { teacherId },
            include: {
                teacher: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                firstNameAr: true,
                                lastName: true,
                                lastNameAr: true,
                                email: true,
                                phone: true,
                                avatar: true,
                            },
                        },
                    },
                },
                transactions: {
                    orderBy: { createdAt: 'desc' },
                },
                payoutRequests: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!wallet) {
            throw new common_1.NotFoundException('Wallet not found');
        }
        const allTransactions = await this.prisma.walletTransaction.findMany({
            where: { walletId: wallet.id },
        });
        const totalCredits = allTransactions
            .filter((t) => t.type === 'CREDIT')
            .reduce((sum, t) => sum + t.amount, 0);
        const totalDebits = allTransactions
            .filter((t) => t.type === 'DEBIT')
            .reduce((sum, t) => sum + t.amount, 0);
        const calculatedBalance = totalCredits - totalDebits;
        const calculatedTotalEarned = totalCredits;
        if (Math.abs(wallet.balance - calculatedBalance) > 0.01 ||
            Math.abs(wallet.totalEarned - calculatedTotalEarned) > 0.01) {
            await this.prisma.teacherWallet.update({
                where: { id: wallet.id },
                data: {
                    balance: calculatedBalance,
                    totalEarned: calculatedTotalEarned,
                },
            });
            wallet.balance = calculatedBalance;
            wallet.totalEarned = calculatedTotalEarned;
        }
        return wallet;
    }
    async sendMoneyToTeacher(teacherId, amount, paymentMethod, description, adminId) {
        const teacher = await this.prisma.teacher.findUnique({
            where: { id: teacherId },
            include: { user: true },
        });
        if (!teacher) {
            throw new common_1.NotFoundException('Teacher not found');
        }
        let wallet = await this.prisma.teacherWallet.findUnique({
            where: { teacherId },
        });
        if (!wallet) {
            wallet = await this.prisma.teacherWallet.create({
                data: {
                    teacherId,
                    balance: 0,
                    pendingBalance: 0,
                    totalEarned: 0,
                },
            });
        }
        const updatedWallet = await this.prisma.teacherWallet.update({
            where: { id: wallet.id },
            data: {
                balance: {
                    increment: amount,
                },
                totalEarned: {
                    increment: amount,
                },
            },
        });
        await this.prisma.walletTransaction.create({
            data: {
                walletId: wallet.id,
                type: 'CREDIT',
                amount,
                description: description || `Manual transfer via ${paymentMethod} by admin`,
            },
        });
        return updatedWallet;
    }
    async createWalletForTeacher(teacherId) {
        const teacher = await this.prisma.teacher.findUnique({
            where: { id: teacherId },
            include: { user: true },
        });
        if (!teacher) {
            throw new common_1.NotFoundException('Teacher not found');
        }
        const existingWallet = await this.prisma.teacherWallet.findUnique({
            where: { teacherId },
        });
        if (existingWallet) {
            throw new common_1.BadRequestException('Wallet already exists for this teacher');
        }
        const wallet = await this.prisma.teacherWallet.create({
            data: {
                teacherId,
                balance: 0,
                pendingBalance: 0,
                totalEarned: 0,
            },
            include: {
                teacher: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                firstNameAr: true,
                                lastName: true,
                                lastNameAr: true,
                                email: true,
                                avatar: true,
                            },
                        },
                    },
                },
            },
        });
        return wallet;
    }
    async disableWallet(teacherId) {
        const wallet = await this.prisma.teacherWallet.findUnique({
            where: { teacherId },
        });
        if (!wallet) {
            throw new common_1.NotFoundException('Wallet not found');
        }
        return this.prisma.teacherWallet.update({
            where: { teacherId },
            data: { isActive: false },
            include: {
                teacher: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                firstNameAr: true,
                                lastName: true,
                                lastNameAr: true,
                                email: true,
                                phone: true,
                                avatar: true,
                            },
                        },
                    },
                },
            },
        });
    }
    async enableWallet(teacherId) {
        const wallet = await this.prisma.teacherWallet.findUnique({
            where: { teacherId },
        });
        if (!wallet) {
            throw new common_1.NotFoundException('Wallet not found');
        }
        return this.prisma.teacherWallet.update({
            where: { teacherId },
            data: { isActive: true },
            include: {
                teacher: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                firstNameAr: true,
                                lastName: true,
                                lastNameAr: true,
                                email: true,
                                phone: true,
                                avatar: true,
                            },
                        },
                    },
                },
            },
        });
    }
    async getAllUsersWithFilters(filters) {
        try {
            const where = {};
            if (filters.role) {
                where.role = filters.role;
            }
            if (filters.status) {
                where.status = filters.status;
            }
            if (filters.search) {
                where.OR = [
                    { firstName: { contains: filters.search } },
                    { firstNameAr: { contains: filters.search } },
                    { lastName: { contains: filters.search } },
                    { lastNameAr: { contains: filters.search } },
                    { email: { contains: filters.search } },
                    { phone: { contains: filters.search } },
                ];
            }
            const page = filters.page || 1;
            const limit = filters.limit || 20;
            const skip = (page - 1) * limit;
            const [users, total] = await Promise.all([
                this.prisma.user.findMany({
                    where,
                    skip,
                    take: limit,
                    select: {
                        id: true,
                        email: true,
                        phone: true,
                        firstName: true,
                        firstNameAr: true,
                        lastName: true,
                        lastNameAr: true,
                        role: true,
                        status: true,
                        avatar: true,
                        emailVerified: true,
                        phoneVerified: true,
                        createdAt: true,
                        teacherProfile: {
                            select: {
                                id: true,
                                isApproved: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                }),
                this.prisma.user.count({ where }),
            ]);
            return {
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        }
        catch (error) {
            console.error('Error in getAllUsersWithFilters:', error);
            throw new common_1.BadRequestException(`Failed to fetch users: ${error.message || 'Unknown error'}`);
        }
    }
    async banUser(userId, adminId) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { status: 'SUSPENDED' },
        });
        await this.auditService.log(adminId, 'BAN_USER', 'User', userId, { status: 'SUSPENDED' });
        return user;
    }
    async activateUser(userId, adminId) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { status: 'ACTIVE' },
        });
        await this.auditService.log(adminId, 'ACTIVATE_USER', 'User', userId, { status: 'ACTIVE' });
        return user;
    }
    async getAllBookingsWithFilters(filters) {
        const where = {};
        if (filters.teacherId) {
            where.teacherId = filters.teacherId;
        }
        if (filters.studentId) {
            where.studentId = filters.studentId;
        }
        if (filters.status) {
            where.status = filters.status;
        }
        if (filters.startDate || filters.endDate) {
            where.date = {};
            if (filters.startDate) {
                where.date.gte = filters.startDate;
            }
            if (filters.endDate) {
                where.date.lte = filters.endDate;
            }
        }
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;
        const [bookings, total] = await Promise.all([
            this.prisma.booking.findMany({
                where,
                skip,
                take: limit,
                include: {
                    student: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    teacher: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                },
                            },
                        },
                    },
                    payment: true,
                    session: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            this.prisma.booking.count({ where }),
        ]);
        return {
            bookings,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async forceCancelBooking(bookingId, adminId) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        const updated = await this.prisma.booking.update({
            where: { id: bookingId },
            data: {
                status: client_1.BookingStatus.CANCELLED,
                cancelledAt: new Date(),
                cancelledBy: adminId,
            },
        });
        await this.auditService.log(adminId, 'FORCE_CANCEL_BOOKING', 'Booking', bookingId, null);
        return updated;
    }
    async forceConfirmBooking(bookingId, adminId) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        const updated = await this.prisma.booking.update({
            where: { id: bookingId },
            data: {
                status: client_1.BookingStatus.CONFIRMED,
            },
        });
        await this.auditService.log(adminId, 'FORCE_CONFIRM_BOOKING', 'Booking', bookingId, null);
        return updated;
    }
    async exportBookingsCSV(filters) {
        const bookings = await this.getAllBookingsWithFilters({ ...filters, limit: 10000 });
        const headers = ['ID', 'Student', 'Teacher', 'Date', 'Time', 'Duration', 'Status', 'Price'];
        const rows = bookings.bookings.map((booking) => [
            booking.id,
            `${booking.student.firstName} ${booking.student.lastName}`,
            `${booking.teacher.user.firstName} ${booking.teacher.user.lastName}`,
            booking.date.toISOString(),
            booking.startTime,
            `${booking.duration}h`,
            booking.status,
            booking.totalPrice.toString(),
        ]);
        const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
        return csv;
    }
    async getPrincipalReport(startDate, endDate) {
        const start = startDate || new Date(new Date().setDate(1));
        const end = endDate || new Date();
        const [totalUsers, totalTeachers, totalStudents, activeTeachers, pendingTeachers, totalBookings, completedBookings, cancelledBookings, totalRevenue, platformRevenue, teacherPayouts, newUsers, newTeachers, newStudents, newBookings,] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.teacher.count(),
            this.prisma.user.count({ where: { role: 'STUDENT' } }),
            this.prisma.teacher.count({ where: { isApproved: true } }),
            this.prisma.teacher.count({ where: { isApproved: false } }),
            this.prisma.booking.count({
                where: {
                    createdAt: { gte: start, lte: end },
                },
            }),
            this.prisma.booking.count({
                where: {
                    status: 'COMPLETED',
                    createdAt: { gte: start, lte: end },
                },
            }),
            this.prisma.booking.count({
                where: {
                    status: 'CANCELLED',
                    createdAt: { gte: start, lte: end },
                },
            }),
            this.prisma.payment.aggregate({
                where: {
                    status: 'COMPLETED',
                    createdAt: { gte: start, lte: end },
                },
                _sum: { amount: true },
            }),
            this.prisma.platformRevenue.aggregate({
                where: {
                    createdAt: { gte: start, lte: end },
                },
                _sum: { amount: true },
            }),
            this.prisma.payoutRequest.aggregate({
                where: {
                    status: 'COMPLETED',
                    createdAt: { gte: start, lte: end },
                },
                _sum: { amount: true },
            }),
            this.prisma.user.count({
                where: {
                    createdAt: { gte: start, lte: end },
                },
            }),
            this.prisma.teacher.count({
                where: {
                    createdAt: { gte: start, lte: end },
                },
            }),
            this.prisma.user.count({
                where: {
                    role: 'STUDENT',
                    createdAt: { gte: start, lte: end },
                },
            }),
            this.prisma.booking.count({
                where: {
                    createdAt: { gte: start, lte: end },
                },
            }),
        ]);
        return {
            summary: {
                totalUsers,
                totalTeachers,
                totalStudents,
                activeTeachers,
                pendingTeachers,
                totalBookings,
                completedBookings,
                cancelledBookings,
                totalRevenue: totalRevenue._sum.amount || 0,
                platformRevenue: platformRevenue._sum.amount || 0,
                teacherPayouts: teacherPayouts._sum.amount || 0,
                netProfit: (platformRevenue._sum.amount || 0) - (teacherPayouts._sum.amount || 0),
            },
            period: {
                newUsers,
                newTeachers,
                newStudents,
                newBookings,
            },
            periodRange: {
                startDate: start,
                endDate: end,
            },
        };
    }
    async getTeacherReport(startDate, endDate, teacherId) {
        const start = startDate || new Date(new Date().setDate(1));
        const end = endDate || new Date();
        const where = {
            createdAt: { gte: start, lte: end },
        };
        if (teacherId) {
            where.teacherId = teacherId;
        }
        const [teachers, totalTeachers, activeTeachers, totalBookings, completedBookings, totalEarnings, topTeachers,] = await Promise.all([
            this.prisma.teacher.findMany({
                where: teacherId ? { id: teacherId } : {},
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            firstNameAr: true,
                            lastName: true,
                            lastNameAr: true,
                            email: true,
                            phone: true,
                        },
                    },
                    wallet: true,
                    _count: {
                        select: {
                            bookings: {
                                where: {
                                    createdAt: { gte: start, lte: end },
                                },
                            },
                        },
                    },
                },
                take: 50,
            }),
            this.prisma.teacher.count(),
            this.prisma.teacher.count({ where: { isApproved: true } }),
            this.prisma.booking.count({
                where: {
                    ...where,
                    teacher: teacherId ? { id: teacherId } : undefined,
                },
            }),
            this.prisma.booking.count({
                where: {
                    ...where,
                    status: 'COMPLETED',
                    teacher: teacherId ? { id: teacherId } : undefined,
                },
            }),
            this.prisma.walletTransaction.aggregate({
                where: {
                    type: 'CREDIT',
                    createdAt: { gte: start, lte: end },
                    wallet: teacherId
                        ? {
                            teacherId,
                        }
                        : undefined,
                },
                _sum: { amount: true },
            }),
            this.prisma.teacher.findMany({
                where: { isApproved: true },
                include: {
                    user: {
                        select: {
                            firstName: true,
                            firstNameAr: true,
                            lastName: true,
                            lastNameAr: true,
                        },
                    },
                    wallet: true,
                    _count: {
                        select: {
                            bookings: true,
                        },
                    },
                },
                take: 20,
            }),
        ]);
        const sortedTopTeachers = topTeachers
            .sort((a, b) => (b._count?.bookings || 0) - (a._count?.bookings || 0))
            .slice(0, 10);
        return {
            summary: {
                totalTeachers,
                activeTeachers,
                totalBookings,
                completedBookings,
                totalEarnings: totalEarnings._sum.amount || 0,
            },
            teachers,
            topTeachers: sortedTopTeachers,
            periodRange: {
                startDate: start,
                endDate: end,
            },
        };
    }
    async getStudentReport(startDate, endDate, studentId) {
        const start = startDate || new Date(new Date().setDate(1));
        const end = endDate || new Date();
        const where = {
            role: 'STUDENT',
        };
        const bookingWhere = {
            createdAt: { gte: start, lte: end },
        };
        if (studentId) {
            where.id = studentId;
            bookingWhere.studentId = studentId;
        }
        const [students, totalStudents, activeStudents, totalBookings, completedBookings, totalSpent, topStudents,] = await Promise.all([
            this.prisma.user.findMany({
                where,
                include: {
                    _count: {
                        select: {
                            studentBookings: {
                                where: bookingWhere,
                            },
                        },
                    },
                },
                take: 50,
            }),
            this.prisma.user.count({ where: { role: 'STUDENT' } }),
            this.prisma.user.count({
                where: {
                    role: 'STUDENT',
                    status: 'ACTIVE',
                },
            }),
            this.prisma.booking.count({
                where: bookingWhere,
            }),
            this.prisma.booking.count({
                where: {
                    ...bookingWhere,
                    status: 'COMPLETED',
                },
            }),
            this.prisma.payment.aggregate({
                where: {
                    status: 'COMPLETED',
                    createdAt: { gte: start, lte: end },
                    booking: studentId
                        ? {
                            studentId,
                        }
                        : undefined,
                },
                _sum: { amount: true },
            }),
            this.prisma.user.findMany({
                where: { role: 'STUDENT' },
                include: {
                    _count: {
                        select: {
                            studentBookings: true,
                        },
                    },
                },
                take: 20,
            }),
        ]);
        const sortedTopStudents = topStudents
            .sort((a, b) => (b._count?.studentBookings || 0) - (a._count?.studentBookings || 0))
            .slice(0, 10);
        return {
            summary: {
                totalStudents,
                activeStudents,
                totalBookings,
                completedBookings,
                totalSpent: totalSpent._sum.amount || 0,
            },
            students,
            topStudents: sortedTopStudents,
            periodRange: {
                startDate: start,
                endDate: end,
            },
        };
    }
    async getProfitReport(startDate, endDate) {
        const start = startDate || new Date(new Date().setDate(1));
        const end = endDate || new Date();
        const [totalRevenue, platformRevenue, teacherEarnings, teacherPayouts, pendingPayouts, totalBookings, completedBookings, revenueByDate,] = await Promise.all([
            this.prisma.payment.aggregate({
                where: {
                    status: 'COMPLETED',
                    createdAt: { gte: start, lte: end },
                },
                _sum: { amount: true },
            }),
            this.prisma.platformRevenue.aggregate({
                where: {
                    createdAt: { gte: start, lte: end },
                },
                _sum: { amount: true },
            }),
            this.prisma.walletTransaction.aggregate({
                where: {
                    type: 'CREDIT',
                    createdAt: { gte: start, lte: end },
                },
                _sum: { amount: true },
            }),
            this.prisma.payoutRequest.aggregate({
                where: {
                    status: 'COMPLETED',
                    createdAt: { gte: start, lte: end },
                },
                _sum: { amount: true },
            }),
            this.prisma.payoutRequest.aggregate({
                where: {
                    status: 'PENDING',
                },
                _sum: { amount: true },
            }),
            this.prisma.booking.count({
                where: {
                    createdAt: { gte: start, lte: end },
                },
            }),
            this.prisma.booking.count({
                where: {
                    status: 'COMPLETED',
                    createdAt: { gte: start, lte: end },
                },
            }),
            this.prisma.platformRevenue.groupBy({
                by: ['createdAt'],
                where: {
                    createdAt: { gte: start, lte: end },
                },
                _sum: {
                    amount: true,
                },
                orderBy: {
                    createdAt: 'asc',
                },
            }),
        ]);
        const netProfit = (platformRevenue._sum.amount || 0) - (teacherPayouts._sum.amount || 0);
        const profitMargin = totalRevenue._sum.amount > 0
            ? ((platformRevenue._sum.amount || 0) / totalRevenue._sum.amount) * 100
            : 0;
        return {
            summary: {
                totalRevenue: totalRevenue._sum.amount || 0,
                platformRevenue: platformRevenue._sum.amount || 0,
                teacherEarnings: teacherEarnings._sum.amount || 0,
                teacherPayouts: teacherPayouts._sum.amount || 0,
                pendingPayouts: pendingPayouts._sum.amount || 0,
                netProfit,
                profitMargin: profitMargin.toFixed(2),
                totalBookings,
                completedBookings,
                averageRevenuePerBooking: completedBookings > 0 ? (totalRevenue._sum.amount || 0) / completedBookings : 0,
            },
            revenueByDate,
            periodRange: {
                startDate: start,
                endDate: end,
            },
        };
    }
    async getDailyReport(date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        const [newUsers, newBookings, completedBookings, revenue, newTeachers] = await Promise.all([
            this.prisma.user.count({
                where: {
                    createdAt: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                },
            }),
            this.prisma.booking.count({
                where: {
                    createdAt: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                },
            }),
            this.prisma.booking.count({
                where: {
                    status: 'COMPLETED',
                    updatedAt: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                },
            }),
            this.prisma.payment.aggregate({
                where: {
                    status: 'COMPLETED',
                    createdAt: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                },
                _sum: { amount: true },
            }),
            this.prisma.teacher.count({
                where: {
                    isApproved: true,
                    approvedAt: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                },
            }),
        ]);
        return {
            date: date.toISOString().split('T')[0],
            newUsers,
            newBookings,
            completedBookings,
            revenue: revenue._sum.amount || 0,
            newTeachers,
        };
    }
    async getMonthlyReport(year, month) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);
        const [newUsers, newBookings, completedBookings, revenue, newTeachers] = await Promise.all([
            this.prisma.user.count({
                where: {
                    createdAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
            }),
            this.prisma.booking.count({
                where: {
                    createdAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
            }),
            this.prisma.booking.count({
                where: {
                    status: 'COMPLETED',
                    updatedAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
            }),
            this.prisma.payment.aggregate({
                where: {
                    status: 'COMPLETED',
                    createdAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                _sum: { amount: true },
            }),
            this.prisma.teacher.count({
                where: {
                    isApproved: true,
                    approvedAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
            }),
        ]);
        return {
            year,
            month,
            newUsers,
            newBookings,
            completedBookings,
            revenue: revenue._sum.amount || 0,
            newTeachers,
        };
    }
    async getBookingTrends(startDate, endDate) {
        const bookings = await this.prisma.booking.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            select: {
                createdAt: true,
                status: true,
            },
        });
        const trends = {};
        bookings.forEach((booking) => {
            const date = booking.createdAt.toISOString().split('T')[0];
            if (!trends[date]) {
                trends[date] = { total: 0, completed: 0, cancelled: 0 };
            }
            trends[date].total++;
            if (booking.status === 'COMPLETED') {
                trends[date].completed++;
            }
            if (booking.status === 'CANCELLED' || booking.status === 'REJECTED') {
                trends[date].cancelled++;
            }
        });
        return Object.entries(trends).map(([date, data]) => ({
            date,
            ...data,
        }));
    }
    async sendGlobalNotification(adminId, title, message) {
        const users = await this.prisma.user.findMany({
            select: { id: true },
        });
        const notifications = await Promise.all(users.map((user) => this.notificationService.createNotification(user.id, 'SESSION_REMINDER', title, message, {}, adminId)));
        await this.auditService.log(adminId, 'SEND_GLOBAL_NOTIFICATION', 'Notification', null, {
            title: title,
            recipients: users.length,
        });
        return { sent: notifications.length };
    }
    async sendNotificationToUsers(adminId, userIds, title, message) {
        const notificationPromises = userIds.map((userId) => {
            return this.notificationService.createNotification(userId, 'SESSION_REMINDER', title, message, {}, adminId);
        });
        const notifications = await Promise.all(notificationPromises);
        await this.auditService.log(adminId, 'SEND_NOTIFICATION_TO_USERS', 'Notification', null, {
            title: title,
            recipients: userIds.length,
        });
        return { sent: notifications.length };
    }
    async getStudentWallet(studentId) {
        const student = await this.prisma.user.findUnique({
            where: { id: studentId },
        });
        if (!student || student.role !== 'STUDENT') {
            throw new common_1.NotFoundException('Student not found');
        }
        let wallet = await this.prisma.studentWallet.findUnique({
            where: { studentId },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        firstNameAr: true,
                        lastName: true,
                        lastNameAr: true,
                        email: true,
                        phone: true,
                    },
                },
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 50,
                },
            },
        });
        if (!wallet) {
            wallet = await this.prisma.studentWallet.create({
                data: {
                    studentId,
                    balance: 0,
                    totalDeposited: 0,
                    totalSpent: 0,
                    isActive: true,
                },
                include: {
                    student: {
                        select: {
                            id: true,
                            firstName: true,
                            firstNameAr: true,
                            lastName: true,
                            lastNameAr: true,
                            email: true,
                            phone: true,
                        },
                    },
                    transactions: {
                        orderBy: { createdAt: 'desc' },
                        take: 50,
                    },
                },
            });
        }
        return wallet;
    }
    async getAllStudentWallets(page = 1, limit = 20, search) {
        const skip = (page - 1) * limit;
        const where = {};
        if (search) {
            where.student = {
                OR: [
                    { firstName: { contains: search } },
                    { firstNameAr: { contains: search } },
                    { lastName: { contains: search } },
                    { lastNameAr: { contains: search } },
                    { email: { contains: search } },
                ],
            };
        }
        const [wallets, total] = await Promise.all([
            this.prisma.studentWallet.findMany({
                where,
                skip,
                take: limit,
                include: {
                    student: {
                        select: {
                            id: true,
                            firstName: true,
                            firstNameAr: true,
                            lastName: true,
                            lastNameAr: true,
                            email: true,
                            phone: true,
                        },
                    },
                    transactions: {
                        take: 5,
                        orderBy: { createdAt: 'desc' },
                    },
                },
                orderBy: { balance: 'desc' },
            }),
            this.prisma.studentWallet.count({ where }),
        ]);
        return {
            wallets,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async depositToStudentWallet(dto, adminId) {
        let wallet = await this.prisma.studentWallet.findUnique({
            where: { studentId: dto.studentId },
        });
        if (!wallet) {
            wallet = await this.prisma.studentWallet.create({
                data: {
                    studentId: dto.studentId,
                    balance: 0,
                    totalDeposited: 0,
                    totalSpent: 0,
                    isActive: true,
                },
            });
        }
        const updatedWallet = await this.prisma.studentWallet.update({
            where: { id: wallet.id },
            data: {
                balance: {
                    increment: dto.amount,
                },
                totalDeposited: {
                    increment: dto.amount,
                },
            },
        });
        await this.prisma.studentWalletTransaction.create({
            data: {
                walletId: wallet.id,
                type: 'DEPOSIT',
                amount: dto.amount,
                description: dto.description || `Deposit via ${dto.paymentMethod || 'manual'} by admin`,
                processedBy: adminId,
            },
        });
        await this.auditService.log(adminId, 'DEPOSIT_TO_STUDENT_WALLET', 'StudentWallet', wallet.id, {
            studentId: dto.studentId,
            amount: dto.amount,
        });
        return updatedWallet;
    }
    async withdrawFromStudentWallet(dto, adminId) {
        const wallet = await this.prisma.studentWallet.findUnique({
            where: { studentId: dto.studentId },
        });
        if (!wallet) {
            throw new common_1.NotFoundException('Student wallet not found');
        }
        if (wallet.balance < dto.amount) {
            throw new common_1.BadRequestException('Insufficient balance');
        }
        const updatedWallet = await this.prisma.studentWallet.update({
            where: { id: wallet.id },
            data: {
                balance: {
                    decrement: dto.amount,
                },
                totalSpent: {
                    increment: dto.amount,
                },
            },
        });
        await this.prisma.studentWalletTransaction.create({
            data: {
                walletId: wallet.id,
                type: 'WITHDRAWAL',
                amount: dto.amount,
                description: dto.description || 'Withdrawal by admin',
                processedBy: adminId,
            },
        });
        await this.auditService.log(adminId, 'WITHDRAW_FROM_STUDENT_WALLET', 'StudentWallet', wallet.id, {
            studentId: dto.studentId,
            amount: dto.amount,
        });
        return updatedWallet;
    }
    async processStudentPayment(dto, adminId) {
        const wallet = await this.prisma.studentWallet.findUnique({
            where: { studentId: dto.studentId },
        });
        if (!wallet) {
            throw new common_1.NotFoundException('Student wallet not found');
        }
        if (wallet.balance < dto.amount) {
            throw new common_1.BadRequestException('Insufficient balance');
        }
        const updatedWallet = await this.prisma.studentWallet.update({
            where: { id: wallet.id },
            data: {
                balance: {
                    decrement: dto.amount,
                },
                totalSpent: {
                    increment: dto.amount,
                },
            },
        });
        const transaction = await this.prisma.studentWalletTransaction.create({
            data: {
                walletId: wallet.id,
                type: 'PAYMENT',
                amount: dto.amount,
                description: dto.description || `Payment for ${dto.paymentType}`,
                subscriptionId: dto.paymentType === 'SUBSCRIPTION' ? dto.relatedId : null,
                bookingId: dto.paymentType === 'BOOKING' ? dto.relatedId : null,
                processedBy: adminId,
            },
        });
        if (dto.paymentType === 'SUBSCRIPTION' && dto.relatedId) {
            await this.prisma.studentSubscription.update({
                where: { id: dto.relatedId },
                data: {
                    paymentId: transaction.id,
                },
            });
        }
        await this.auditService.log(adminId, 'PROCESS_STUDENT_PAYMENT', 'StudentWallet', wallet.id, {
            studentId: dto.studentId,
            amount: dto.amount,
            paymentType: dto.paymentType,
            relatedId: dto.relatedId,
        });
        return {
            wallet: updatedWallet,
            transaction,
        };
    }
    async getStudentWalletTransactions(walletId, page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const [transactions, total] = await Promise.all([
            this.prisma.studentWalletTransaction.findMany({
                where: { walletId },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.studentWalletTransaction.count({ where: { walletId } }),
        ]);
        return {
            transactions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        notification_service_1.NotificationService,
        wallet_service_1.WalletService])
], AdminService);
//# sourceMappingURL=admin.service.js.map