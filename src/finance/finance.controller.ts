import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApprovePayoutDto, RejectPayoutDto, CreatePayoutRequestDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

@ApiTags('finance')
@Controller('finance')
export class FinanceController {
  constructor(
    private readonly financeService: FinanceService,
    private readonly walletService: WalletService,
    private readonly prisma: PrismaService,
  ) {}

  // Admin endpoints
  @Get('statistics')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('reports.view', 'payments.view')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get finance statistics (Admin)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStatistics() {
    return this.financeService.getFinanceStatistics();
  }

  @Get('payouts')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('payments.view')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all payout requests (Admin)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'teacherId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Payouts retrieved successfully' })
  async getPayouts(
    @Query('status') status?: string,
    @Query('teacherId') teacherId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.financeService.getPayouts({
      status,
      teacherId,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Post('payouts/:id/approve')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('payments.manage')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve payout request (Admin)' })
  @ApiResponse({ status: 200, description: 'Payout approved successfully' })
  async approvePayout(@Param('id') id: string, @CurrentUser() user: any) {
    return this.walletService.approvePayout(id, user.id);
  }

  @Post('payouts/:id/reject')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('payments.manage')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject payout request (Admin)' })
  @ApiResponse({ status: 200, description: 'Payout rejected successfully' })
  async rejectPayout(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: RejectPayoutDto,
  ) {
    return this.walletService.rejectPayout(id, user.id, dto.reason);
  }

  @Post('payouts/:id/complete')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('payments.manage')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark payout as completed (Admin)' })
  @ApiResponse({ status: 200, description: 'Payout completed successfully' })
  async completePayout(@Param('id') id: string) {
    return this.walletService.completePayout(id);
  }

  // Teacher endpoints
  @Get('wallet')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get teacher wallet' })
  @ApiResponse({ status: 200, description: 'Wallet retrieved successfully' })
  async getWallet(@CurrentUser() user: any) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: user.id },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher profile not found');
    }

    return this.walletService.getOrCreateWallet(teacher.id);
  }

  @Get('wallet/transactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get wallet transactions' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  async getWalletTransactions(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: user.id },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher profile not found');
    }

    return this.walletService.getWalletTransactions(
      teacher.id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Post('wallet/payout-request')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create payout request' })
  @ApiResponse({ status: 201, description: 'Payout request created successfully' })
  async createPayoutRequest(@CurrentUser() user: any, @Body() dto: CreatePayoutRequestDto) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: user.id },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher profile not found');
    }

    return this.walletService.createPayoutRequest(teacher.id, dto.amount);
  }
}

