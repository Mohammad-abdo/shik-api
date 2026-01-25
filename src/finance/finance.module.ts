import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { WalletService } from './wallet.service';

@Module({
  controllers: [FinanceController],
  providers: [FinanceService, WalletService],
  exports: [FinanceService, WalletService],
})
export class FinanceModule {}



