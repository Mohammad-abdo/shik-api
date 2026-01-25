import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentPackageDto, UpdateStudentPackageDto, SubscribeStudentDto } from './dto';
import { SubscriptionStatus } from '@prisma/client';

@Injectable()
export class StudentSubscriptionService {
  constructor(private prisma: PrismaService) {}

  // Package Management (Admin only)
  async createPackage(dto: CreateStudentPackageDto, adminId: string) {
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

    // Parse features for response
    if (packageData.features && typeof packageData.features === 'string') {
      packageData.features = JSON.parse(packageData.features);
    }
    if (packageData.featuresAr && typeof packageData.featuresAr === 'string') {
      packageData.featuresAr = JSON.parse(packageData.featuresAr);
    }

    return packageData;
  }

  async getAllPackages(activeOnly: boolean = false) {
    const where = activeOnly ? { isActive: true } : {};
    const packages = await this.prisma.studentSubscriptionPackage.findMany({
      where,
      orderBy: [
        { isPopular: 'desc' },
        { price: 'asc' },
      ],
    });

    // Parse features
    return packages.map((pkg) => ({
      ...pkg,
      features: pkg.features && typeof pkg.features === 'string' ? JSON.parse(pkg.features) : pkg.features,
      featuresAr: pkg.featuresAr && typeof pkg.featuresAr === 'string' ? JSON.parse(pkg.featuresAr) : pkg.featuresAr,
    }));
  }

  async getPackageById(id: string) {
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
      throw new NotFoundException('Package not found');
    }

    // Parse features
    if (packageData.features && typeof packageData.features === 'string') {
      packageData.features = JSON.parse(packageData.features);
    }
    if (packageData.featuresAr && typeof packageData.featuresAr === 'string') {
      packageData.featuresAr = JSON.parse(packageData.featuresAr);
    }

    return packageData;
  }

  async updatePackage(id: string, dto: UpdateStudentPackageDto) {
    const packageData = await this.prisma.studentSubscriptionPackage.findUnique({
      where: { id },
    });

    if (!packageData) {
      throw new NotFoundException('Package not found');
    }

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.nameAr !== undefined) updateData.nameAr = dto.nameAr;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.descriptionAr !== undefined) updateData.descriptionAr = dto.descriptionAr;
    if (dto.price !== undefined) updateData.price = dto.price;
    if (dto.duration !== undefined) updateData.duration = dto.duration;
    if (dto.features !== undefined) updateData.features = JSON.stringify(dto.features);
    if (dto.featuresAr !== undefined) updateData.featuresAr = JSON.stringify(dto.featuresAr);
    if (dto.maxBookings !== undefined) updateData.maxBookings = dto.maxBookings;
    if (dto.maxCourses !== undefined) updateData.maxCourses = dto.maxCourses;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.isPopular !== undefined) updateData.isPopular = dto.isPopular;

    const updated = await this.prisma.studentSubscriptionPackage.update({
      where: { id },
      data: updateData,
    });

    // Parse features for response
    if (updated.features && typeof updated.features === 'string') {
      updated.features = JSON.parse(updated.features);
    }
    if (updated.featuresAr && typeof updated.featuresAr === 'string') {
      updated.featuresAr = JSON.parse(updated.featuresAr);
    }

    return updated;
  }

  async deletePackage(id: string) {
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
      throw new NotFoundException('Package not found');
    }

    if (packageData._count.subscriptions > 0) {
      throw new BadRequestException('Cannot delete package with active subscriptions');
    }

    await this.prisma.studentSubscriptionPackage.delete({
      where: { id },
    });

    return { message: 'Package deleted successfully' };
  }

  // Subscription Management
  async subscribe(studentId: string, dto: SubscribeStudentDto) {
    // Check if student exists
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
    });

    if (!student || student.role !== 'STUDENT') {
      throw new NotFoundException('Student not found');
    }

    // Check if package exists and is active
    const packageData = await this.prisma.studentSubscriptionPackage.findUnique({
      where: { id: dto.packageId },
    });

    if (!packageData) {
      throw new NotFoundException('Package not found');
    }

    if (!packageData.isActive) {
      throw new BadRequestException('Package is not active');
    }

    // Check if student has active subscription
    const activeSubscription = await this.prisma.studentSubscription.findFirst({
      where: {
        studentId,
        status: SubscriptionStatus.ACTIVE,
        endDate: {
          gte: new Date(),
        },
      },
    });

    if (activeSubscription) {
      throw new ConflictException('Student already has an active subscription');
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + packageData.duration);

    // Create subscription
    const subscription = await this.prisma.studentSubscription.create({
      data: {
        studentId,
        packageId: dto.packageId,
        status: SubscriptionStatus.ACTIVE,
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

    // Parse package features
    if (subscription.package.features && typeof subscription.package.features === 'string') {
      subscription.package.features = JSON.parse(subscription.package.features);
    }
    if (subscription.package.featuresAr && typeof subscription.package.featuresAr === 'string') {
      subscription.package.featuresAr = JSON.parse(subscription.package.featuresAr);
    }

    return subscription;
  }

  async getStudentSubscriptions(studentId: string) {
    const subscriptions = await this.prisma.studentSubscription.findMany({
      where: { studentId },
      include: {
        package: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Parse package features
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

  async getActiveSubscription(studentId: string) {
    const subscription = await this.prisma.studentSubscription.findFirst({
      where: {
        studentId,
        status: SubscriptionStatus.ACTIVE,
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

    // Parse package features
    if (subscription.package.features && typeof subscription.package.features === 'string') {
      subscription.package.features = JSON.parse(subscription.package.features);
    }
    if (subscription.package.featuresAr && typeof subscription.package.featuresAr === 'string') {
      subscription.package.featuresAr = JSON.parse(subscription.package.featuresAr);
    }

    return subscription;
  }

  async cancelSubscription(subscriptionId: string, studentId: string) {
    const subscription = await this.prisma.studentSubscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.studentId !== studentId) {
      throw new BadRequestException('You can only cancel your own subscription');
    }

    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestException('Subscription is not active');
    }

    const updated = await this.prisma.studentSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
        autoRenew: false,
      },
    });

    return updated;
  }

  async getAllSubscriptions(page: number = 1, limit: number = 20, status?: SubscriptionStatus) {
    const skip = (page - 1) * limit;
    const where: any = {};

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

    // Parse package features
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

  // Check and update expired subscriptions
  async checkExpiredSubscriptions() {
    const expired = await this.prisma.studentSubscription.updateMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: {
          lt: new Date(),
        },
      },
      data: {
        status: SubscriptionStatus.EXPIRED,
      },
    });

    return { updated: expired.count };
  }
}

