import { Module } from '@nestjs/common';
import { StudentSubscriptionController } from './student-subscription.controller';
import { StudentSubscriptionService } from './student-subscription.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StudentSubscriptionController],
  providers: [StudentSubscriptionService],
  exports: [StudentSubscriptionService],
})
export class StudentSubscriptionModule {}

