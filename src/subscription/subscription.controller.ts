import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CreatePackageDto, UpdatePackageDto, SubscribeDto } from './dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SubscriptionStatus } from '@prisma/client';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly prisma: PrismaService,
  ) {}

  // Package Management (Admin only)
  @Post('packages')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('subscriptions.write')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create subscription package (Admin only)' })
  @ApiResponse({ status: 201, description: 'Package created successfully' })
  async createPackage(@Body() dto: CreatePackageDto) {
    return this.subscriptionService.createPackage(dto);
  }

  @Get('packages')
  @ApiOperation({ summary: 'Get all subscription packages' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Packages retrieved successfully' })
  async getAllPackages(@Query('activeOnly') activeOnly?: string) {
    return this.subscriptionService.getAllPackages(activeOnly === 'true');
  }

  @Get('packages/:id')
  @ApiOperation({ summary: 'Get package by ID' })
  @ApiResponse({ status: 200, description: 'Package retrieved successfully' })
  async getPackageById(@Param('id') id: string) {
    return this.subscriptionService.getPackageById(id);
  }

  @Put('packages/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('subscriptions.write')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update package (Admin only)' })
  @ApiResponse({ status: 200, description: 'Package updated successfully' })
  async updatePackage(@Param('id') id: string, @Body() dto: UpdatePackageDto) {
    return this.subscriptionService.updatePackage(id, dto);
  }

  @Delete('packages/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('subscriptions.write')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete package (Admin only)' })
  @ApiResponse({ status: 200, description: 'Package deleted successfully' })
  async deletePackage(@Param('id') id: string) {
    return this.subscriptionService.deletePackage(id);
  }

  // Subscription Management
  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Subscribe to a package (Teacher only)' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  async subscribe(@CurrentUser() user: any, @Body() dto: SubscribeDto) {
    // Get teacher ID from user
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: user.id },
    });

    if (!teacher) {
      throw new Error('Teacher profile not found');
    }

    return this.subscriptionService.subscribe(teacher.id, dto);
  }

  @Get('my-subscriptions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my subscriptions (Teacher only)' })
  @ApiResponse({ status: 200, description: 'Subscriptions retrieved successfully' })
  async getMySubscriptions(@CurrentUser() user: any) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: user.id },
    });

    if (!teacher) {
      throw new Error('Teacher profile not found');
    }

    return this.subscriptionService.getTeacherSubscriptions(teacher.id);
  }

  @Get('my-active')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my active subscription (Teacher only)' })
  @ApiResponse({ status: 200, description: 'Active subscription retrieved successfully' })
  async getMyActiveSubscription(@CurrentUser() user: any) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: user.id },
    });

    if (!teacher) {
      throw new Error('Teacher profile not found');
    }

    return this.subscriptionService.getActiveSubscription(teacher.id);
  }

  @Post('cancel/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel subscription (Teacher only)' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled successfully' })
  async cancelSubscription(@Param('id') id: string, @CurrentUser() user: any) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: user.id },
    });

    if (!teacher) {
      throw new Error('Teacher profile not found');
    }

    return this.subscriptionService.cancelSubscription(id, teacher.id);
  }

  // Admin endpoints
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('subscriptions.read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all subscriptions (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: SubscriptionStatus })
  @ApiResponse({ status: 200, description: 'Subscriptions retrieved successfully' })
  async getAllSubscriptions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: SubscriptionStatus,
  ) {
    return this.subscriptionService.getAllSubscriptions(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      status,
    );
  }
}

