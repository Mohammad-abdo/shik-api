import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { ContentService } from './content.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateContentDto, ApproveContentDto, RejectContentDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

@ApiTags('content')
@Controller('content')
export class ContentController {
  constructor(
    private readonly contentService: ContentService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload content (Teacher)' })
  @ApiResponse({ status: 201, description: 'Content uploaded successfully' })
  async create(
    @CurrentUser() user: any,
    @Body() dto: CreateContentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: user.id },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher profile not found');
    }

    return this.contentService.create(teacher.id, dto, file);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('content.review')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pending content (Admin)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Pending content retrieved successfully' })
  async getPendingContent(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.contentService.getPendingContent(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('my-content')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my content (Teacher)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, description: 'Content retrieved successfully' })
  async getMyContent(
    @CurrentUser() user: any,
    @Query('status') status?: string,
  ) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: user.id },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher profile not found');
    }

    return this.contentService.getContentByTeacher(teacher.id, status as any);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get content by ID' })
  @ApiResponse({ status: 200, description: 'Content retrieved successfully' })
  async getContentById(@Param('id') id: string) {
    return this.contentService.getContentById(id);
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('content.review')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve content (Admin)' })
  @ApiResponse({ status: 200, description: 'Content approved successfully' })
  async approve(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: ApproveContentDto,
  ) {
    return this.contentService.approve(id, user.id, dto);
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('content.review')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject content (Admin)' })
  @ApiResponse({ status: 200, description: 'Content rejected successfully' })
  async reject(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: RejectContentDto,
  ) {
    return this.contentService.reject(id, user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete content (Teacher)' })
  @ApiResponse({ status: 200, description: 'Content deleted successfully' })
  async deleteContent(@Param('id') id: string, @CurrentUser() user: any) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: user.id },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher profile not found');
    }

    return this.contentService.deleteContent(id, teacher.id);
  }
}



