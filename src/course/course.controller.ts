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
import { CourseService } from './course.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CreateCourseDto, UpdateCourseDto } from './dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CourseStatus } from '@prisma/client';

@ApiTags('courses')
@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('courses.write')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new course (Admin only)' })
  @ApiResponse({ status: 201, description: 'Course created successfully' })
  async create(@Body() dto: CreateCourseDto, @CurrentUser() user: any) {
    return this.courseService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all courses' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: CourseStatus })
  @ApiQuery({ name: 'teacherId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Courses retrieved successfully' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: CourseStatus,
    @Query('teacherId') teacherId?: string,
  ) {
    return this.courseService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      status,
      teacherId,
    );
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured courses' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Featured courses retrieved successfully' })
  async getFeatured(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.courseService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 5,
      'PUBLISHED',
      undefined,
      true, // isFeatured
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course by ID' })
  @ApiResponse({ status: 200, description: 'Course retrieved successfully' })
  async findOne(@Param('id') id: string) {
    return this.courseService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('courses.write')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update course (Admin only)' })
  @ApiResponse({ status: 200, description: 'Course updated successfully' })
  async update(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.courseService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('courses.write')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete course (Admin only)' })
  @ApiResponse({ status: 200, description: 'Course deleted successfully' })
  async delete(@Param('id') id: string) {
    return this.courseService.delete(id);
  }

  @Post(':id/enroll')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enroll student in course' })
  @ApiResponse({ status: 201, description: 'Student enrolled successfully' })
  async enroll(@Param('id') courseId: string, @CurrentUser() user: any) {
    return this.courseService.enrollStudent(courseId, user.id);
  }
}

