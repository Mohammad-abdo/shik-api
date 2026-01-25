import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ExamService } from './exam.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateExamDto, AddQuestionDto, SubmitExamDto } from './dto';

@ApiTags('exams')
@Controller('exams')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @Permissions('exams.create')
  @ApiOperation({ summary: 'Create a new exam (Teacher only)' })
  @ApiResponse({ status: 201, description: 'Exam created successfully' })
  async createExam(@Body() dto: CreateExamDto, @CurrentUser() user: any) {
    return this.examService.createExam(dto, user.id);
  }

  @Post(':id/questions')
  @UseGuards(PermissionsGuard)
  @Permissions('exams.create')
  @ApiOperation({ summary: 'Add question to exam (Teacher only)' })
  @ApiResponse({ status: 201, description: 'Question added successfully' })
  async addQuestion(
    @Param('id') examId: string,
    @Body() dto: AddQuestionDto,
    @CurrentUser() user: any,
  ) {
    return this.examService.addQuestion(examId, dto, user.id);
  }

  @Post(':id/publish')
  @UseGuards(PermissionsGuard)
  @Permissions('exams.create')
  @ApiOperation({ summary: 'Publish exam (Teacher only)' })
  @ApiResponse({ status: 200, description: 'Exam published successfully' })
  async publishExam(@Param('id') examId: string, @CurrentUser() user: any) {
    return this.examService.publishExam(examId, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get exam details' })
  @ApiResponse({ status: 200, description: 'Exam retrieved successfully' })
  async getExam(@Param('id') examId: string, @CurrentUser() user: any) {
    return this.examService.getExam(examId, user.id);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit exam (Student only)' })
  @ApiResponse({ status: 201, description: 'Exam submitted successfully' })
  async submitExam(
    @Param('id') examId: string,
    @Body() dto: SubmitExamDto,
    @CurrentUser() user: any,
  ) {
    return this.examService.submitExam(examId, dto, user.id);
  }

  @Get(':id/results')
  @UseGuards(PermissionsGuard)
  @Permissions('exams.review')
  @ApiOperation({ summary: 'Get exam results (Teacher only)' })
  @ApiResponse({ status: 200, description: 'Results retrieved successfully' })
  async getResults(@Param('id') examId: string, @CurrentUser() user: any) {
    return this.examService.getExamResults(examId, user.id);
  }

  @Put(':examId/submissions/:submissionId/grade')
  @UseGuards(PermissionsGuard)
  @Permissions('exams.review')
  @ApiOperation({ summary: 'Grade exam submission (Teacher only)' })
  @ApiResponse({ status: 200, description: 'Exam graded successfully' })
  async gradeExam(
    @Param('examId') examId: string,
    @Param('submissionId') submissionId: string,
    @CurrentUser() user: any,
  ) {
    return this.examService.gradeExam(examId, submissionId, user.id);
  }

  @Get('student/my-exams')
  @ApiOperation({ summary: 'Get available exams for student' })
  @ApiResponse({ status: 200, description: 'Exams retrieved successfully' })
  async getStudentExams(@CurrentUser() user: any) {
    return this.examService.getStudentExams(user.id);
  }

  @Get('teacher/my-exams')
  @UseGuards(PermissionsGuard)
  @Permissions('exams.create')
  @ApiOperation({ summary: 'Get teacher exams' })
  @ApiResponse({ status: 200, description: 'Exams retrieved successfully' })
  async getTeacherExams(@CurrentUser() user: any) {
    return this.examService.getTeacherExams(user.id);
  }
}

