import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePackageDto, UpdatePackageDto, SubscribeDto } from './dto';
import { SubscriptionStatus } from '@prisma/client';

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  // Package Management (Admin only)
  async createPackage(dto: CreatePackageDto) {
    const packageData = await this.prisma.subscriptionPackage.create({
      data: {
        name: dto.name,
        nameAr: dto.nameAr,
        description: dto.description,
        descriptionAr: dto.descriptionAr,
        price: dto.price,
        duration: dto.duration || 30,
        features: dto.features ? JSON.stringify(dto.features) : null,
        featuresAr: dto.featuresAr ? JSON.stringify(dto.featuresAr) : null,
        maxStudents: dto.maxStudents,
        maxCourses: dto.maxCourses,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        isPopular: dto.isPopular || false,
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
    const packages = await this.prisma.subscriptionPackage.findMany({
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
    const packageData = await this.prisma.subscriptionPackage.findUnique({
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

  async updatePackage(id: string, dto: UpdatePackageDto) {
    const packageData = await this.prisma.subscriptionPackage.findUnique({
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
    if (dto.maxStudents !== undefined) updateData.maxStudents = dto.maxStudents;
    if (dto.maxCourses !== undefined) updateData.maxCourses = dto.maxCourses;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.isPopular !== undefined) updateData.isPopular = dto.isPopular;

    const updated = await this.prisma.subscriptionPackage.update({
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
    const packageData = await this.prisma.subscriptionPackage.findUnique({
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

    await this.prisma.subscriptionPackage.delete({
      where: { id },
    });

    return { message: 'Package deleted successfully' };
  }

  // Subscription Management
  async subscribe(teacherId: string, dto: SubscribeDto) {
    // Check if teacher exists
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Check if package exists and is active
    const packageData = await this.prisma.subscriptionPackage.findUnique({
      where: { id: dto.packageId },
    });

    if (!packageData) {
      throw new NotFoundException('Package not found');
    }

    if (!packageData.isActive) {
      throw new BadRequestException('Package is not active');
    }

    // Check if teacher has active subscription
    const activeSubscription = await this.prisma.teacherSubscription.findFirst({
      where: {
        teacherId,
        status: SubscriptionStatus.ACTIVE,
        endDate: {
          gte: new Date(),
        },
      },
    });

    if (activeSubscription) {
      throw new ConflictException('Teacher already has an active subscription');
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + packageData.duration);

    // Create subscription
    const subscription = await this.prisma.teacherSubscription.create({
      data: {
        teacherId,
        packageId: dto.packageId,
        status: SubscriptionStatus.ACTIVE,
        startDate,
        endDate,
        autoRenew: dto.autoRenew || false,
      },
      include: {
        package: true,
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

  async getTeacherSubscriptions(teacherId: string) {
    const subscriptions = await this.prisma.teacherSubscription.findMany({
      where: { teacherId },
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

  async getActiveSubscription(teacherId: string) {
    const subscription = await this.prisma.teacherSubscription.findFirst({
      where: {
        teacherId,
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

  async cancelSubscription(subscriptionId: string, teacherId: string) {
    const subscription = await this.prisma.teacherSubscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.teacherId !== teacherId) {
      throw new BadRequestException('You can only cancel your own subscription');
    }

    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestException('Subscription is not active');
    }

    const updated = await this.prisma.teacherSubscription.update({
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
      this.prisma.teacherSubscription.findMany({
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
                },
              },
            },
          },
          package: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.teacherSubscription.count({ where }),
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

  // Check and update expired subscriptions (should be called by a cron job)
  async checkExpiredSubscriptions() {
    const expired = await this.prisma.teacherSubscription.updateMany({
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

