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
import { StudentSubscriptionService } from './student-subscription.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CreateStudentPackageDto, UpdateStudentPackageDto, SubscribeStudentDto } from './dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SubscriptionStatus } from '@prisma/client';

@ApiTags('student-subscriptions')
@Controller('student-subscriptions')
export class StudentSubscriptionController {
  constructor(
    private readonly subscriptionService: StudentSubscriptionService,
    private readonly prisma: PrismaService,
  ) {}

  // Package Management (Admin only)
  @Post('packages')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('subscriptions.write')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create student subscription package (Admin only)' })
  @ApiResponse({ status: 201, description: 'Package created successfully' })
  async createPackage(@Body() dto: CreateStudentPackageDto, @CurrentUser() user: any) {
    return this.subscriptionService.createPackage(dto, user.id);
  }

  @Get('packages')
  @ApiOperation({ summary: 'Get all student subscription packages' })
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
  async updatePackage(@Param('id') id: string, @Body() dto: UpdateStudentPackageDto) {
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
  @ApiOperation({ summary: 'Subscribe to a package (Student only)' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  async subscribe(@CurrentUser() user: any, @Body() dto: SubscribeStudentDto) {
    if (user.role !== 'STUDENT') {
      throw new Error('Only students can subscribe');
    }
    return this.subscriptionService.subscribe(user.id, dto);
  }

  @Get('my-subscriptions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my subscriptions (Student only)' })
  @ApiResponse({ status: 200, description: 'Subscriptions retrieved successfully' })
  async getMySubscriptions(@CurrentUser() user: any) {
    if (user.role !== 'STUDENT') {
      throw new Error('Only students can view subscriptions');
    }
    return this.subscriptionService.getStudentSubscriptions(user.id);
  }

  @Get('my-active')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my active subscription (Student only)' })
  @ApiResponse({ status: 200, description: 'Active subscription retrieved successfully' })
  async getMyActiveSubscription(@CurrentUser() user: any) {
    if (user.role !== 'STUDENT') {
      throw new Error('Only students can view subscriptions');
    }
    return this.subscriptionService.getActiveSubscription(user.id);
  }

  @Post('cancel/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel subscription (Student only)' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled successfully' })
  async cancelSubscription(@Param('id') id: string, @CurrentUser() user: any) {
    if (user.role !== 'STUDENT') {
      throw new Error('Only students can cancel subscriptions');
    }
    return this.subscriptionService.cancelSubscription(id, user.id);
  }

  // Admin endpoints
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('subscriptions.read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all student subscriptions (Admin only)' })
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

