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
exports.StudentSubscriptionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let StudentSubscriptionService = class StudentSubscriptionService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createPackage(dto, adminId) {
        const packageData = await this.prisma.studentSubscriptionPackage.create({
            data: {
                name: dto.name,
                nameAr: dto.nameAr,
                description: dto.description,
                descriptionAr: dto.descriptionAr,
                price: dto.price,
                duration: dto.duration || 30,
                features: dto.features ? JSON.stringify(dto.features) : null,
                featuresAr: dto.featuresAr ? JSON.stringify(dto.featuresAr) : null,
                maxBookings: dto.maxBookings,
                maxCourses: dto.maxCourses,
                isActive: dto.isActive !== undefined ? dto.isActive : true,
                isPopular: dto.isPopular || false,
                createdBy: adminId,
            },
        });
        if (packageData.features && typeof packageData.features === 'string') {
            packageData.features = JSON.parse(packageData.features);
        }
        if (packageData.featuresAr && typeof packageData.featuresAr === 'string') {
            packageData.featuresAr = JSON.parse(packageData.featuresAr);
        }
        return packageData;
    }
    async getAllPackages(activeOnly = false) {
        const where = activeOnly ? { isActive: true } : {};
        const packages = await this.prisma.studentSubscriptionPackage.findMany({
            where,
            orderBy: [
                { isPopular: 'desc' },
                { price: 'asc' },
            ],
        });
        return packages.map((pkg) => ({
            ...pkg,
            features: pkg.features && typeof pkg.features === 'string' ? JSON.parse(pkg.features) : pkg.features,
            featuresAr: pkg.featuresAr && typeof pkg.featuresAr === 'string' ? JSON.parse(pkg.featuresAr) : pkg.featuresAr,
        }));
    }
    async getPackageById(id) {
        const packageData = await this.prisma.studentSubscriptionPackage.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        subscriptions: true,
                    },
                },
            },
        });
        if (!packageData) {
            throw new common_1.NotFoundException('Package not found');
        }
        if (packageData.features && typeof packageData.features === 'string') {
            packageData.features = JSON.parse(packageData.features);
        }
        if (packageData.featuresAr && typeof packageData.featuresAr === 'string') {
            packageData.featuresAr = JSON.parse(packageData.featuresAr);
        }
        return packageData;
    }
    async updatePackage(id, dto) {
        const packageData = await this.prisma.studentSubscriptionPackage.findUnique({
            where: { id },
        });
        if (!packageData) {
            throw new common_1.NotFoundException('Package not found');
        }
        const updateData = {};
        if (dto.name !== undefined)
            updateData.name = dto.name;
        if (dto.nameAr !== undefined)
            updateData.nameAr = dto.nameAr;
        if (dto.description !== undefined)
            updateData.description = dto.description;
        if (dto.descriptionAr !== undefined)
            updateData.descriptionAr = dto.descriptionAr;
        if (dto.price !== undefined)
            updateData.price = dto.price;
        if (dto.duration !== undefined)
            updateData.duration = dto.duration;
        if (dto.features !== undefined)
            updateData.features = JSON.stringify(dto.features);
        if (dto.featuresAr !== undefined)
            updateData.featuresAr = JSON.stringify(dto.featuresAr);
        if (dto.maxBookings !== undefined)
            updateData.maxBookings = dto.maxBookings;
        if (dto.maxCourses !== undefined)
            updateData.maxCourses = dto.maxCourses;
        if (dto.isActive !== undefined)
            updateData.isActive = dto.isActive;
        if (dto.isPopular !== undefined)
            updateData.isPopular = dto.isPopular;
        const updated = await this.prisma.studentSubscriptionPackage.update({
            where: { id },
            data: updateData,
        });
        if (updated.features && typeof updated.features === 'string') {
            updated.features = JSON.parse(updated.features);
        }
        if (updated.featuresAr && typeof updated.featuresAr === 'string') {
            updated.featuresAr = JSON.parse(updated.featuresAr);
        }
        return updated;
    }
    async deletePackage(id) {
        const packageData = await this.prisma.studentSubscriptionPackage.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        subscriptions: true,
                    },
                },
            },
        });
        if (!packageData) {
            throw new common_1.NotFoundException('Package not found');
        }
        if (packageData._count.subscriptions > 0) {
            throw new common_1.BadRequestException('Cannot delete package with active subscriptions');
        }
        await this.prisma.studentSubscriptionPackage.delete({
            where: { id },
        });
        return { message: 'Package deleted successfully' };
    }
    async subscribe(studentId, dto) {
        const student = await this.prisma.user.findUnique({
            where: { id: studentId },
        });
        if (!student || student.role !== 'STUDENT') {
            throw new common_1.NotFoundException('Student not found');
        }
        const packageData = await this.prisma.studentSubscriptionPackage.findUnique({
            where: { id: dto.packageId },
        });
        if (!packageData) {
            throw new common_1.NotFoundException('Package not found');
        }
        if (!packageData.isActive) {
            throw new common_1.BadRequestException('Package is not active');
        }
        const activeSubscription = await this.prisma.studentSubscription.findFirst({
            where: {
                studentId,
                status: client_1.SubscriptionStatus.ACTIVE,
                endDate: {
                    gte: new Date(),
                },
            },
        });
        if (activeSubscription) {
            throw new common_1.ConflictException('Student already has an active subscription');
        }
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + packageData.duration);
        const subscription = await this.prisma.studentSubscription.create({
            data: {
                studentId,
                packageId: dto.packageId,
                status: client_1.SubscriptionStatus.ACTIVE,
                startDate,
                endDate,
                autoRenew: dto.autoRenew || false,
            },
            include: {
                package: true,
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
            },
        });
        if (subscription.package.features && typeof subscription.package.features === 'string') {
            subscription.package.features = JSON.parse(subscription.package.features);
        }
        if (subscription.package.featuresAr && typeof subscription.package.featuresAr === 'string') {
            subscription.package.featuresAr = JSON.parse(subscription.package.featuresAr);
        }
        return subscription;
    }
    async getStudentSubscriptions(studentId) {
        const subscriptions = await this.prisma.studentSubscription.findMany({
            where: { studentId },
            include: {
                package: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return subscriptions.map((sub) => ({
            ...sub,
            package: {
                ...sub.package,
                features: sub.package.features && typeof sub.package.features === 'string'
                    ? JSON.parse(sub.package.features)
                    : sub.package.features,
                featuresAr: sub.package.featuresAr && typeof sub.package.featuresAr === 'string'
                    ? JSON.parse(sub.package.featuresAr)
                    : sub.package.featuresAr,
            },
        }));
    }
    async getActiveSubscription(studentId) {
        const subscription = await this.prisma.studentSubscription.findFirst({
            where: {
                studentId,
                status: client_1.SubscriptionStatus.ACTIVE,
                endDate: {
                    gte: new Date(),
                },
            },
            include: {
                package: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        if (!subscription) {
            return null;
        }
        if (subscription.package.features && typeof subscription.package.features === 'string') {
            subscription.package.features = JSON.parse(subscription.package.features);
        }
        if (subscription.package.featuresAr && typeof subscription.package.featuresAr === 'string') {
            subscription.package.featuresAr = JSON.parse(subscription.package.featuresAr);
        }
        return subscription;
    }
    async cancelSubscription(subscriptionId, studentId) {
        const subscription = await this.prisma.studentSubscription.findUnique({
            where: { id: subscriptionId },
        });
        if (!subscription) {
            throw new common_1.NotFoundException('Subscription not found');
        }
        if (subscription.studentId !== studentId) {
            throw new common_1.BadRequestException('You can only cancel your own subscription');
        }
        if (subscription.status !== client_1.SubscriptionStatus.ACTIVE) {
            throw new common_1.BadRequestException('Subscription is not active');
        }
        const updated = await this.prisma.studentSubscription.update({
            where: { id: subscriptionId },
            data: {
                status: client_1.SubscriptionStatus.CANCELLED,
                cancelledAt: new Date(),
                autoRenew: false,
            },
        });
        return updated;
    }
    async getAllSubscriptions(page = 1, limit = 20, status) {
        const skip = (page - 1) * limit;
        const where = {};
        if (status) {
            where.status = status;
        }
        const [subscriptions, total] = await Promise.all([
            this.prisma.studentSubscription.findMany({
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
                    package: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            this.prisma.studentSubscription.count({ where }),
        ]);
        const parsedSubscriptions = subscriptions.map((sub) => ({
            ...sub,
            package: {
                ...sub.package,
                features: sub.package.features && typeof sub.package.features === 'string'
                    ? JSON.parse(sub.package.features)
                    : sub.package.features,
                featuresAr: sub.package.featuresAr && typeof sub.package.featuresAr === 'string'
                    ? JSON.parse(sub.package.featuresAr)
                    : sub.package.featuresAr,
            },
        }));
        return {
            subscriptions: parsedSubscriptions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async checkExpiredSubscriptions() {
        const expired = await this.prisma.studentSubscription.updateMany({
            where: {
                status: client_1.SubscriptionStatus.ACTIVE,
                endDate: {
                    lt: new Date(),
                },
            },
            data: {
                status: client_1.SubscriptionStatus.EXPIRED,
            },
        });
        return { updated: expired.count };
    }
};
exports.StudentSubscriptionService = StudentSubscriptionService;
exports.StudentSubscriptionService = StudentSubscriptionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StudentSubscriptionService);
//# sourceMappingURL=student-subscription.service.js.map