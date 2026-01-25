import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CertificateService } from './certificate.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateCertificateDto } from './dto/create-certificate.dto';

@ApiTags('certificates')
@Controller('certificates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CertificateController {
  constructor(private readonly certificateService: CertificateService) {}

  @Post()
  @ApiOperation({ summary: 'Issue a certificate to a student' })
  async createCertificate(
    @Body() dto: CreateCertificateDto,
    @CurrentUser() user: any,
  ) {
    return this.certificateService.createCertificate(dto, user.id);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get all certificates for a student' })
  async getStudentCertificates(@Param('studentId') studentId: string) {
    return this.certificateService.getStudentCertificates(studentId);
  }

  @Get('teacher/my-certificates')
  @ApiOperation({ summary: 'Get all certificates issued by teacher' })
  async getTeacherCertificates(@CurrentUser() user: any) {
    return this.certificateService.getTeacherIssuedCertificates(user.id);
  }

  @Delete(':id/revoke')
  @ApiOperation({ summary: 'Revoke a certificate' })
  async revokeCertificate(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.certificateService.revokeCertificate(id, reason);
  }
}

