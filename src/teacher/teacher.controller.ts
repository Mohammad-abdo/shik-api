import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TeacherService } from './teacher.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRoleEnum as UserRole } from '@prisma/client';
import { CreateTeacherDto, UpdateTeacherDto, CreateScheduleDto, UpdateScheduleDto } from './dto';

@ApiTags('teachers')
@Controller('teachers')
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @Get()
  @ApiOperation({ summary: 'Get all teachers' })
  @ApiQuery({ name: 'specialties', required: false, type: [String] })
  @ApiQuery({ name: 'minRating', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Teachers retrieved successfully' })
  async findAll(
    @Query('specialties') specialties?: string,
    @Query('minRating') minRating?: string,
    @Query('search') search?: string,
  ) {
    return this.teacherService.findAll({
      specialties: specialties ? specialties.split(',') : undefined,
      minRating: minRating ? parseFloat(minRating) : undefined,
      search,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get teacher by ID' })
  @ApiResponse({ status: 200, description: 'Teacher retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  async findOne(@Param('id') id: string) {
    return this.teacherService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create teacher profile' })
  @ApiResponse({ status: 201, description: 'Teacher profile created successfully' })
  async create(@CurrentUser() user: any, @Body() dto: CreateTeacherDto) {
    return this.teacherService.create(user.id, dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update teacher profile' })
  @ApiResponse({ status: 200, description: 'Teacher profile updated successfully' })
  async update(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: UpdateTeacherDto) {
    return this.teacherService.update(id, user.id, dto);
  }

  @Post(':id/schedules')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create teacher schedule' })
  @ApiResponse({ status: 201, description: 'Schedule created successfully' })
  async createSchedule(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: CreateScheduleDto,
  ) {
    return this.teacherService.createSchedule(id, user.id, dto);
  }

  @Put(':teacherId/schedules/:scheduleId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update teacher schedule' })
  @ApiResponse({ status: 200, description: 'Schedule updated successfully' })
  async updateSchedule(
    @Param('teacherId') teacherId: string,
    @Param('scheduleId') scheduleId: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateScheduleDto,
  ) {
    return this.teacherService.updateSchedule(scheduleId, teacherId, user.id, dto);
  }

  @Delete(':teacherId/schedules/:scheduleId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete teacher schedule' })
  @ApiResponse({ status: 200, description: 'Schedule deleted successfully' })
  async deleteSchedule(
    @Param('teacherId') teacherId: string,
    @Param('scheduleId') scheduleId: string,
    @CurrentUser() user: any,
  ) {
    return this.teacherService.deleteSchedule(scheduleId, teacherId, user.id);
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve teacher (Admin only)' })
  @ApiResponse({ status: 200, description: 'Teacher approved successfully' })
  async approveTeacher(@Param('id') id: string, @CurrentUser() user: any) {
    return this.teacherService.approveTeacher(id, user.id);
  }

  @Delete(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject teacher (Admin only)' })
  @ApiResponse({ status: 200, description: 'Teacher rejected successfully' })
  async rejectTeacher(@Param('id') id: string) {
    return this.teacherService.rejectTeacher(id);
  }
}
