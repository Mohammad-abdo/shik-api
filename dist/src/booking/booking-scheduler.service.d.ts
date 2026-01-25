import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
export declare class BookingSchedulerService {
    private prisma;
    private notificationService;
    private readonly logger;
    constructor(prisma: PrismaService, notificationService: NotificationService);
    sendBookingReminders(): Promise<void>;
    handleNoShows(): Promise<void>;
    autoCreateSessions(): Promise<void>;
}
