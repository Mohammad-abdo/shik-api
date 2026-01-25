import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { MobileBookingController } from './mobile-booking.controller';
import { BookingService } from './booking.service';
import { NotificationModule } from '../notification/notification.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [NotificationModule, PrismaModule],
  controllers: [BookingController, MobileBookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule { }

