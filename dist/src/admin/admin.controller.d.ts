import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { SendNotificationDto, CreateUserDto, UpdateUserDto, UpdateTeacherDto, CreateTeacherDto, DepositToWalletDto, WithdrawFromWalletDto, ProcessPaymentDto } from './dto';
export declare class AdminController {
    private readonly adminService;
    private readonly prisma;
    constructor(adminService: AdminService, prisma: PrismaService);
    getDashboard(): Promise<{
        stats: {
            totalUsers: number;
            totalTeachers: number;
            pendingTeachers: number;
            totalBookings: number;
            completedBookings: number;
            totalRevenue: number;
            totalCourses: number;
            publishedCourses: number;
            totalCourseEnrollments: number;
            totalTeacherSubscriptions: number;
            activeTeacherSubscriptions: number;
            totalStudentSubscriptions: number;
            activeStudentSubscriptions: number;
            totalStudentWallets: number;
            studentWalletsBalance: number;
        };
        recentBookings: ({
            teacher: {
                user: {
                    id: string;
                    email: string;
                    firstName: string;
                    lastName: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                certificates: string | null;
                canIssueCertificates: boolean | null;
                specialties: string | null;
                specialtiesAr: string | null;
                userId: string;
                bio: string | null;
                bioAr: string | null;
                image: string | null;
                experience: number | null;
                hourlyRate: number;
                rating: number;
                totalReviews: number;
                isApproved: boolean;
                approvedAt: Date | null;
                approvedBy: string | null;
                introVideoUrl: string | null;
                readingType: string | null;
                readingTypeAr: string | null;
            };
            student: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.BookingStatus;
            createdAt: Date;
            updatedAt: Date;
            teacherId: string;
            studentId: string;
            date: Date;
            startTime: string;
            duration: number;
            price: number;
            discount: number;
            totalPrice: number;
            notes: string | null;
            cancelledAt: Date | null;
            cancelledBy: string | null;
        })[];
        recentCourses: ({
            teacher: {
                user: {
                    firstName: string;
                    firstNameAr: string;
                    lastName: string;
                    lastNameAr: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                certificates: string | null;
                canIssueCertificates: boolean | null;
                specialties: string | null;
                specialtiesAr: string | null;
                userId: string;
                bio: string | null;
                bioAr: string | null;
                image: string | null;
                experience: number | null;
                hourlyRate: number;
                rating: number;
                totalReviews: number;
                isApproved: boolean;
                approvedAt: Date | null;
                approvedBy: string | null;
                introVideoUrl: string | null;
                readingType: string | null;
                readingTypeAr: string | null;
            };
            _count: {
                enrollments: number;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.CourseStatus;
            createdAt: Date;
            updatedAt: Date;
            image: string | null;
            rating: number;
            totalReviews: number;
            introVideoUrl: string | null;
            teacherId: string | null;
            duration: number | null;
            price: number;
            description: string | null;
            descriptionAr: string | null;
            createdBy: string | null;
            title: string;
            titleAr: string | null;
            category: string | null;
            fullDescription: string | null;
            fullDescriptionAr: string | null;
            introVideoThumbnail: string | null;
            isFeatured: boolean;
            level: import(".prisma/client").$Enums.CourseLevel | null;
            totalLessons: number;
            totalVideos: number;
        })[];
        recentSubscriptions: ({
            teacher: {
                user: {
                    firstName: string;
                    firstNameAr: string;
                    lastName: string;
                    lastNameAr: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                certificates: string | null;
                canIssueCertificates: boolean | null;
                specialties: string | null;
                specialtiesAr: string | null;
                userId: string;
                bio: string | null;
                bioAr: string | null;
                image: string | null;
                experience: number | null;
                hourlyRate: number;
                rating: number;
                totalReviews: number;
                isApproved: boolean;
                approvedAt: Date | null;
                approvedBy: string | null;
                introVideoUrl: string | null;
                readingType: string | null;
                readingTypeAr: string | null;
            };
            package: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                isActive: boolean;
                duration: number;
                price: number;
                description: string | null;
                nameAr: string | null;
                descriptionAr: string | null;
                features: string | null;
                featuresAr: string | null;
                maxStudents: number | null;
                maxCourses: number | null;
                isPopular: boolean;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.SubscriptionStatus;
            createdAt: Date;
            updatedAt: Date;
            teacherId: string;
            cancelledAt: Date | null;
            cancelledBy: string | null;
            startDate: Date;
            endDate: Date;
            autoRenew: boolean;
            paymentId: string | null;
            stripeSubscriptionId: string | null;
            packageId: string;
        })[];
    }>;
    getAllUsers(page?: string, limit?: string, role?: string, status?: string, search?: string): Promise<{
        users: {
            id: string;
            email: string;
            phone: string;
            firstName: string;
            firstNameAr: string;
            lastName: string;
            lastNameAr: string;
            avatar: string;
            role: import(".prisma/client").$Enums.UserRoleEnum;
            status: import(".prisma/client").$Enums.UserStatus;
            emailVerified: boolean;
            phoneVerified: boolean;
            createdAt: Date;
            teacherProfile: {
                id: string;
                isApproved: boolean;
            };
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getAllTeachers(page?: string, limit?: string, isApproved?: string): Promise<{
        teachers: ({
            user: {
                id: string;
                email: string;
                phone: string;
                firstName: string;
                firstNameAr: string;
                lastName: string;
                lastNameAr: string;
                avatar: string;
            };
            wallet: {
                id: string;
                balance: number;
            };
            _count: {
                bookings: number;
                reviews: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            certificates: string | null;
            canIssueCertificates: boolean | null;
            specialties: string | null;
            specialtiesAr: string | null;
            userId: string;
            bio: string | null;
            bioAr: string | null;
            image: string | null;
            experience: number | null;
            hourlyRate: number;
            rating: number;
            totalReviews: number;
            isApproved: boolean;
            approvedAt: Date | null;
            approvedBy: string | null;
            introVideoUrl: string | null;
            readingType: string | null;
            readingTypeAr: string | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getAllBookings(page?: string, limit?: string, status?: string): Promise<{
        bookings: ({
            teacher: {
                user: {
                    id: string;
                    email: string;
                    firstName: string;
                    firstNameAr: string;
                    lastName: string;
                    lastNameAr: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                certificates: string | null;
                canIssueCertificates: boolean | null;
                specialties: string | null;
                specialtiesAr: string | null;
                userId: string;
                bio: string | null;
                bioAr: string | null;
                image: string | null;
                experience: number | null;
                hourlyRate: number;
                rating: number;
                totalReviews: number;
                isApproved: boolean;
                approvedAt: Date | null;
                approvedBy: string | null;
                introVideoUrl: string | null;
                readingType: string | null;
                readingTypeAr: string | null;
            };
            student: {
                id: string;
                email: string;
                firstName: string;
                firstNameAr: string;
                lastName: string;
                lastNameAr: string;
            };
            payment: {
                id: string;
                status: import(".prisma/client").$Enums.PaymentStatus;
                createdAt: Date;
                updatedAt: Date;
                bookingId: string;
                amount: number;
                currency: string;
                paymentMethod: string | null;
                stripePaymentId: string | null;
                stripeIntentId: string | null;
                receiptUrl: string | null;
                refundedAt: Date | null;
                refundAmount: number | null;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.BookingStatus;
            createdAt: Date;
            updatedAt: Date;
            teacherId: string;
            studentId: string;
            date: Date;
            startTime: string;
            duration: number;
            price: number;
            discount: number;
            totalPrice: number;
            notes: string | null;
            cancelledAt: Date | null;
            cancelledBy: string | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getAllPayments(page?: string, limit?: string, status?: string): Promise<{
        payments: ({
            booking: {
                teacher: {
                    user: {
                        id: string;
                        email: string;
                        firstName: string;
                        firstNameAr: string;
                        lastName: string;
                        lastNameAr: string;
                    };
                } & {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    certificates: string | null;
                    canIssueCertificates: boolean | null;
                    specialties: string | null;
                    specialtiesAr: string | null;
                    userId: string;
                    bio: string | null;
                    bioAr: string | null;
                    image: string | null;
                    experience: number | null;
                    hourlyRate: number;
                    rating: number;
                    totalReviews: number;
                    isApproved: boolean;
                    approvedAt: Date | null;
                    approvedBy: string | null;
                    introVideoUrl: string | null;
                    readingType: string | null;
                    readingTypeAr: string | null;
                };
                student: {
                    id: string;
                    email: string;
                    firstName: string;
                    firstNameAr: string;
                    lastName: string;
                    lastNameAr: string;
                };
            } & {
                id: string;
                status: import(".prisma/client").$Enums.BookingStatus;
                createdAt: Date;
                updatedAt: Date;
                teacherId: string;
                studentId: string;
                date: Date;
                startTime: string;
                duration: number;
                price: number;
                discount: number;
                totalPrice: number;
                notes: string | null;
                cancelledAt: Date | null;
                cancelledBy: string | null;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.PaymentStatus;
            createdAt: Date;
            updatedAt: Date;
            bookingId: string;
            amount: number;
            currency: string;
            paymentMethod: string | null;
            stripePaymentId: string | null;
            stripeIntentId: string | null;
            receiptUrl: string | null;
            refundedAt: Date | null;
            refundAmount: number | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getPaymentStats(): Promise<{
        totalRevenue: number;
        pendingPayments: number;
        completedPayments: number;
    }>;
    updateUserStatus(id: string, status: string, user: any): Promise<{
        id: string;
        email: string;
        phone: string | null;
        password: string;
        firstName: string;
        firstNameAr: string | null;
        lastName: string;
        lastNameAr: string | null;
        avatar: string | null;
        role: import(".prisma/client").$Enums.UserRoleEnum;
        status: import(".prisma/client").$Enums.UserStatus;
        language: string;
        emailVerified: boolean;
        phoneVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
        currentSurah: string | null;
        currentSurahAr: string | null;
        memorizationLevel: string | null;
        memorizationLevelAr: string | null;
        totalMemorized: number | null;
        age: number | null;
        gender: import(".prisma/client").$Enums.Gender | null;
        memorized_parts: number | null;
        parent_phone: string | null;
        student_phone: string | null;
    }>;
    banUser(id: string, user: any): Promise<{
        id: string;
        email: string;
        phone: string | null;
        password: string;
        firstName: string;
        firstNameAr: string | null;
        lastName: string;
        lastNameAr: string | null;
        avatar: string | null;
        role: import(".prisma/client").$Enums.UserRoleEnum;
        status: import(".prisma/client").$Enums.UserStatus;
        language: string;
        emailVerified: boolean;
        phoneVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
        currentSurah: string | null;
        currentSurahAr: string | null;
        memorizationLevel: string | null;
        memorizationLevelAr: string | null;
        totalMemorized: number | null;
        age: number | null;
        gender: import(".prisma/client").$Enums.Gender | null;
        memorized_parts: number | null;
        parent_phone: string | null;
        student_phone: string | null;
    }>;
    activateUser(id: string, user: any): Promise<{
        id: string;
        email: string;
        phone: string | null;
        password: string;
        firstName: string;
        firstNameAr: string | null;
        lastName: string;
        lastNameAr: string | null;
        avatar: string | null;
        role: import(".prisma/client").$Enums.UserRoleEnum;
        status: import(".prisma/client").$Enums.UserStatus;
        language: string;
        emailVerified: boolean;
        phoneVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
        currentSurah: string | null;
        currentSurahAr: string | null;
        memorizationLevel: string | null;
        memorizationLevelAr: string | null;
        totalMemorized: number | null;
        age: number | null;
        gender: import(".prisma/client").$Enums.Gender | null;
        memorized_parts: number | null;
        parent_phone: string | null;
        student_phone: string | null;
    }>;
    deleteUser(id: string): Promise<{
        id: string;
        email: string;
        phone: string | null;
        password: string;
        firstName: string;
        firstNameAr: string | null;
        lastName: string;
        lastNameAr: string | null;
        avatar: string | null;
        role: import(".prisma/client").$Enums.UserRoleEnum;
        status: import(".prisma/client").$Enums.UserStatus;
        language: string;
        emailVerified: boolean;
        phoneVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
        currentSurah: string | null;
        currentSurahAr: string | null;
        memorizationLevel: string | null;
        memorizationLevelAr: string | null;
        totalMemorized: number | null;
        age: number | null;
        gender: import(".prisma/client").$Enums.Gender | null;
        memorized_parts: number | null;
        parent_phone: string | null;
        student_phone: string | null;
    }>;
    getAllBookingsWithFilters(page?: string, limit?: string, status?: string, teacherId?: string, studentId?: string): Promise<{
        bookings: ({
            teacher: {
                user: {
                    id: string;
                    email: string;
                    firstName: string;
                    lastName: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                certificates: string | null;
                canIssueCertificates: boolean | null;
                specialties: string | null;
                specialtiesAr: string | null;
                userId: string;
                bio: string | null;
                bioAr: string | null;
                image: string | null;
                experience: number | null;
                hourlyRate: number;
                rating: number;
                totalReviews: number;
                isApproved: boolean;
                approvedAt: Date | null;
                approvedBy: string | null;
                introVideoUrl: string | null;
                readingType: string | null;
                readingTypeAr: string | null;
            };
            student: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
            payment: {
                id: string;
                status: import(".prisma/client").$Enums.PaymentStatus;
                createdAt: Date;
                updatedAt: Date;
                bookingId: string;
                amount: number;
                currency: string;
                paymentMethod: string | null;
                stripePaymentId: string | null;
                stripeIntentId: string | null;
                receiptUrl: string | null;
                refundedAt: Date | null;
                refundAmount: number | null;
            };
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                duration: number | null;
                type: import(".prisma/client").$Enums.SessionType;
                bookingId: string;
                startedAt: Date | null;
                roomId: string;
                agoraToken: string | null;
                endedAt: Date | null;
                recordingUrl: string | null;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.BookingStatus;
            createdAt: Date;
            updatedAt: Date;
            teacherId: string;
            studentId: string;
            date: Date;
            startTime: string;
            duration: number;
            price: number;
            discount: number;
            totalPrice: number;
            notes: string | null;
            cancelledAt: Date | null;
            cancelledBy: string | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    forceCancelBooking(id: string, user: any): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.BookingStatus;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
        studentId: string;
        date: Date;
        startTime: string;
        duration: number;
        price: number;
        discount: number;
        totalPrice: number;
        notes: string | null;
        cancelledAt: Date | null;
        cancelledBy: string | null;
    }>;
    forceConfirmBooking(id: string, user: any): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.BookingStatus;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
        studentId: string;
        date: Date;
        startTime: string;
        duration: number;
        price: number;
        discount: number;
        totalPrice: number;
        notes: string | null;
        cancelledAt: Date | null;
        cancelledBy: string | null;
    }>;
    exportBookings(status?: string): Promise<{
        csv: string;
    }>;
    getPrincipalReport(startDate?: string, endDate?: string): Promise<{
        summary: {
            totalUsers: number;
            totalTeachers: number;
            totalStudents: number;
            activeTeachers: number;
            pendingTeachers: number;
            totalBookings: number;
            completedBookings: number;
            cancelledBookings: number;
            totalRevenue: number;
            platformRevenue: number;
            teacherPayouts: number;
            netProfit: number;
        };
        period: {
            newUsers: number;
            newTeachers: number;
            newStudents: number;
            newBookings: number;
        };
        periodRange: {
            startDate: Date;
            endDate: Date;
        };
    }>;
    getTeacherReport(startDate?: string, endDate?: string, teacherId?: string): Promise<{
        summary: {
            totalTeachers: number;
            activeTeachers: number;
            totalBookings: number;
            completedBookings: number;
            totalEarnings: number;
        };
        teachers: ({
            user: {
                id: string;
                email: string;
                phone: string;
                firstName: string;
                firstNameAr: string;
                lastName: string;
                lastNameAr: string;
            };
            wallet: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                teacherId: string;
                balance: number;
                pendingBalance: number;
                totalEarned: number;
                isActive: boolean;
            };
            _count: {
                bookings: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            certificates: string | null;
            canIssueCertificates: boolean | null;
            specialties: string | null;
            specialtiesAr: string | null;
            userId: string;
            bio: string | null;
            bioAr: string | null;
            image: string | null;
            experience: number | null;
            hourlyRate: number;
            rating: number;
            totalReviews: number;
            isApproved: boolean;
            approvedAt: Date | null;
            approvedBy: string | null;
            introVideoUrl: string | null;
            readingType: string | null;
            readingTypeAr: string | null;
        })[];
        topTeachers: ({
            user: {
                firstName: string;
                firstNameAr: string;
                lastName: string;
                lastNameAr: string;
            };
            wallet: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                teacherId: string;
                balance: number;
                pendingBalance: number;
                totalEarned: number;
                isActive: boolean;
            };
            _count: {
                bookings: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            certificates: string | null;
            canIssueCertificates: boolean | null;
            specialties: string | null;
            specialtiesAr: string | null;
            userId: string;
            bio: string | null;
            bioAr: string | null;
            image: string | null;
            experience: number | null;
            hourlyRate: number;
            rating: number;
            totalReviews: number;
            isApproved: boolean;
            approvedAt: Date | null;
            approvedBy: string | null;
            introVideoUrl: string | null;
            readingType: string | null;
            readingTypeAr: string | null;
        })[];
        periodRange: {
            startDate: Date;
            endDate: Date;
        };
    }>;
    getStudentReport(startDate?: string, endDate?: string, studentId?: string): Promise<{
        summary: {
            totalStudents: number;
            activeStudents: number;
            totalBookings: number;
            completedBookings: number;
            totalSpent: number;
        };
        students: ({
            _count: {
                studentBookings: number;
            };
        } & {
            id: string;
            email: string;
            phone: string | null;
            password: string;
            firstName: string;
            firstNameAr: string | null;
            lastName: string;
            lastNameAr: string | null;
            avatar: string | null;
            role: import(".prisma/client").$Enums.UserRoleEnum;
            status: import(".prisma/client").$Enums.UserStatus;
            language: string;
            emailVerified: boolean;
            phoneVerified: boolean;
            createdAt: Date;
            updatedAt: Date;
            currentSurah: string | null;
            currentSurahAr: string | null;
            memorizationLevel: string | null;
            memorizationLevelAr: string | null;
            totalMemorized: number | null;
            age: number | null;
            gender: import(".prisma/client").$Enums.Gender | null;
            memorized_parts: number | null;
            parent_phone: string | null;
            student_phone: string | null;
        })[];
        topStudents: ({
            _count: {
                studentBookings: number;
            };
        } & {
            id: string;
            email: string;
            phone: string | null;
            password: string;
            firstName: string;
            firstNameAr: string | null;
            lastName: string;
            lastNameAr: string | null;
            avatar: string | null;
            role: import(".prisma/client").$Enums.UserRoleEnum;
            status: import(".prisma/client").$Enums.UserStatus;
            language: string;
            emailVerified: boolean;
            phoneVerified: boolean;
            createdAt: Date;
            updatedAt: Date;
            currentSurah: string | null;
            currentSurahAr: string | null;
            memorizationLevel: string | null;
            memorizationLevelAr: string | null;
            totalMemorized: number | null;
            age: number | null;
            gender: import(".prisma/client").$Enums.Gender | null;
            memorized_parts: number | null;
            parent_phone: string | null;
            student_phone: string | null;
        })[];
        periodRange: {
            startDate: Date;
            endDate: Date;
        };
    }>;
    getProfitReport(startDate?: string, endDate?: string): Promise<{
        summary: {
            totalRevenue: number;
            platformRevenue: number;
            teacherEarnings: number;
            teacherPayouts: number;
            pendingPayouts: number;
            netProfit: number;
            profitMargin: string;
            totalBookings: number;
            completedBookings: number;
            averageRevenuePerBooking: number;
        };
        revenueByDate: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.PlatformRevenueGroupByOutputType, "createdAt"[]> & {
            _sum: {
                amount: number;
            };
        })[];
        periodRange: {
            startDate: Date;
            endDate: Date;
        };
    }>;
    getDailyReport(date?: string): Promise<{
        date: string;
        newUsers: number;
        newBookings: number;
        completedBookings: number;
        revenue: number;
        newTeachers: number;
    }>;
    getMonthlyReport(year?: string, month?: string): Promise<{
        year: number;
        month: number;
        newUsers: number;
        newBookings: number;
        completedBookings: number;
        revenue: number;
        newTeachers: number;
    }>;
    getBookingTrends(startDate?: string, endDate?: string): Promise<{
        total: number;
        completed: number;
        cancelled: number;
        date: string;
    }[]>;
    sendGlobalNotification(user: any, dto: SendNotificationDto): Promise<{
        sent: number;
    }>;
    sendNotificationToUsers(user: any, dto: SendNotificationDto): Promise<{
        sent: number;
    }>;
    createUser(dto: CreateUserDto, user: any): Promise<{
        userRoles: ({
            role: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            roleId: string;
        })[];
    } & {
        id: string;
        email: string;
        phone: string | null;
        password: string;
        firstName: string;
        firstNameAr: string | null;
        lastName: string;
        lastNameAr: string | null;
        avatar: string | null;
        role: import(".prisma/client").$Enums.UserRoleEnum;
        status: import(".prisma/client").$Enums.UserStatus;
        language: string;
        emailVerified: boolean;
        phoneVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
        currentSurah: string | null;
        currentSurahAr: string | null;
        memorizationLevel: string | null;
        memorizationLevelAr: string | null;
        totalMemorized: number | null;
        age: number | null;
        gender: import(".prisma/client").$Enums.Gender | null;
        memorized_parts: number | null;
        parent_phone: string | null;
        student_phone: string | null;
    }>;
    updateUser(id: string, dto: UpdateUserDto, user: any): Promise<{
        userRoles: ({
            role: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            roleId: string;
        })[];
    } & {
        id: string;
        email: string;
        phone: string | null;
        password: string;
        firstName: string;
        firstNameAr: string | null;
        lastName: string;
        lastNameAr: string | null;
        avatar: string | null;
        role: import(".prisma/client").$Enums.UserRoleEnum;
        status: import(".prisma/client").$Enums.UserStatus;
        language: string;
        emailVerified: boolean;
        phoneVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
        currentSurah: string | null;
        currentSurahAr: string | null;
        memorizationLevel: string | null;
        memorizationLevelAr: string | null;
        totalMemorized: number | null;
        age: number | null;
        gender: import(".prisma/client").$Enums.Gender | null;
        memorized_parts: number | null;
        parent_phone: string | null;
        student_phone: string | null;
    }>;
    getUserById(id: string): Promise<{
        teacherProfile: {
            wallet: {
                transactions: {
                    id: string;
                    createdAt: Date;
                    description: string;
                    paymentId: string | null;
                    type: string;
                    bookingId: string | null;
                    amount: number;
                    walletId: string;
                }[];
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                teacherId: string;
                balance: number;
                pendingBalance: number;
                totalEarned: number;
                isActive: boolean;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            certificates: string | null;
            canIssueCertificates: boolean | null;
            specialties: string | null;
            specialtiesAr: string | null;
            userId: string;
            bio: string | null;
            bioAr: string | null;
            image: string | null;
            experience: number | null;
            hourlyRate: number;
            rating: number;
            totalReviews: number;
            isApproved: boolean;
            approvedAt: Date | null;
            approvedBy: string | null;
            introVideoUrl: string | null;
            readingType: string | null;
            readingTypeAr: string | null;
        };
        studentBookings: {
            id: string;
            status: import(".prisma/client").$Enums.BookingStatus;
            createdAt: Date;
            updatedAt: Date;
            teacherId: string;
            studentId: string;
            date: Date;
            startTime: string;
            duration: number;
            price: number;
            discount: number;
            totalPrice: number;
            notes: string | null;
            cancelledAt: Date | null;
            cancelledBy: string | null;
        }[];
        userRoles: ({
            role: {
                permissions: ({
                    permission: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        name: string;
                        description: string | null;
                        resource: string;
                        action: string;
                    };
                } & {
                    id: string;
                    createdAt: Date;
                    roleId: string;
                    permissionId: string;
                })[];
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            roleId: string;
        })[];
        _count: {
            studentBookings: number;
            notifications: number;
        };
    } & {
        id: string;
        email: string;
        phone: string | null;
        password: string;
        firstName: string;
        firstNameAr: string | null;
        lastName: string;
        lastNameAr: string | null;
        avatar: string | null;
        role: import(".prisma/client").$Enums.UserRoleEnum;
        status: import(".prisma/client").$Enums.UserStatus;
        language: string;
        emailVerified: boolean;
        phoneVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
        currentSurah: string | null;
        currentSurahAr: string | null;
        memorizationLevel: string | null;
        memorizationLevelAr: string | null;
        totalMemorized: number | null;
        age: number | null;
        gender: import(".prisma/client").$Enums.Gender | null;
        memorized_parts: number | null;
        parent_phone: string | null;
        student_phone: string | null;
    }>;
    updateTeacher(id: string, dto: UpdateTeacherDto, user: any): Promise<{
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            avatar: string;
        };
        wallet: {
            transactions: {
                id: string;
                createdAt: Date;
                description: string;
                paymentId: string | null;
                type: string;
                bookingId: string | null;
                amount: number;
                walletId: string;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            teacherId: string;
            balance: number;
            pendingBalance: number;
            totalEarned: number;
            isActive: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        certificates: string | null;
        canIssueCertificates: boolean | null;
        specialties: string | null;
        specialtiesAr: string | null;
        userId: string;
        bio: string | null;
        bioAr: string | null;
        image: string | null;
        experience: number | null;
        hourlyRate: number;
        rating: number;
        totalReviews: number;
        isApproved: boolean;
        approvedAt: Date | null;
        approvedBy: string | null;
        introVideoUrl: string | null;
        readingType: string | null;
        readingTypeAr: string | null;
    }>;
    getTeacherById(id: string): Promise<{
        user: {
            id: string;
            email: string;
            phone: string;
            firstName: string;
            firstNameAr: string;
            lastName: string;
            lastNameAr: string;
            avatar: string;
            status: import(".prisma/client").$Enums.UserStatus;
            createdAt: Date;
        };
        bookings: ({
            student: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
            payment: {
                id: string;
                status: import(".prisma/client").$Enums.PaymentStatus;
                createdAt: Date;
                updatedAt: Date;
                bookingId: string;
                amount: number;
                currency: string;
                paymentMethod: string | null;
                stripePaymentId: string | null;
                stripeIntentId: string | null;
                receiptUrl: string | null;
                refundedAt: Date | null;
                refundAmount: number | null;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.BookingStatus;
            createdAt: Date;
            updatedAt: Date;
            teacherId: string;
            studentId: string;
            date: Date;
            startTime: string;
            duration: number;
            price: number;
            discount: number;
            totalPrice: number;
            notes: string | null;
            cancelledAt: Date | null;
            cancelledBy: string | null;
        })[];
        reviews: ({
            student: {
                id: string;
                firstName: string;
                lastName: string;
                avatar: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            rating: number;
            teacherId: string;
            studentId: string;
            bookingId: string;
            comment: string | null;
        })[];
        wallet: {
            payoutRequests: {
                id: string;
                status: import(".prisma/client").$Enums.PayoutStatus;
                createdAt: Date;
                updatedAt: Date;
                approvedAt: Date | null;
                approvedBy: string | null;
                teacherId: string;
                amount: number;
                walletId: string;
                requestedAt: Date;
                processedAt: Date | null;
                rejectionReason: string | null;
            }[];
            transactions: {
                id: string;
                createdAt: Date;
                description: string;
                paymentId: string | null;
                type: string;
                bookingId: string | null;
                amount: number;
                walletId: string;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            teacherId: string;
            balance: number;
            pendingBalance: number;
            totalEarned: number;
            isActive: boolean;
        };
        schedules: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            teacherId: string;
            isActive: boolean;
            startTime: string;
            dayOfWeek: number;
            endTime: string;
        }[];
        _count: {
            bookings: number;
            reviews: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        certificates: string | null;
        canIssueCertificates: boolean | null;
        specialties: string | null;
        specialtiesAr: string | null;
        userId: string;
        bio: string | null;
        bioAr: string | null;
        image: string | null;
        experience: number | null;
        hourlyRate: number;
        rating: number;
        totalReviews: number;
        isApproved: boolean;
        approvedAt: Date | null;
        approvedBy: string | null;
        introVideoUrl: string | null;
        readingType: string | null;
        readingTypeAr: string | null;
    }>;
    createTeacher(dto: CreateTeacherDto, user: any): Promise<{
        user: {
            id: string;
            email: string;
            phone: string;
            firstName: string;
            firstNameAr: string;
            lastName: string;
            lastNameAr: string;
            avatar: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        certificates: string | null;
        canIssueCertificates: boolean | null;
        specialties: string | null;
        specialtiesAr: string | null;
        userId: string;
        bio: string | null;
        bioAr: string | null;
        image: string | null;
        experience: number | null;
        hourlyRate: number;
        rating: number;
        totalReviews: number;
        isApproved: boolean;
        approvedAt: Date | null;
        approvedBy: string | null;
        introVideoUrl: string | null;
        readingType: string | null;
        readingTypeAr: string | null;
    }>;
    getAllTeacherWallets(page?: string, limit?: string, search?: string): Promise<{
        wallets: ({
            payoutRequests: {
                id: string;
                status: import(".prisma/client").$Enums.PayoutStatus;
                createdAt: Date;
                updatedAt: Date;
                approvedAt: Date | null;
                approvedBy: string | null;
                teacherId: string;
                amount: number;
                walletId: string;
                requestedAt: Date;
                processedAt: Date | null;
                rejectionReason: string | null;
            }[];
            teacher: {
                user: {
                    id: string;
                    email: string;
                    phone: string;
                    firstName: string;
                    firstNameAr: string;
                    lastName: string;
                    lastNameAr: string;
                    avatar: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                certificates: string | null;
                canIssueCertificates: boolean | null;
                specialties: string | null;
                specialtiesAr: string | null;
                userId: string;
                bio: string | null;
                bioAr: string | null;
                image: string | null;
                experience: number | null;
                hourlyRate: number;
                rating: number;
                totalReviews: number;
                isApproved: boolean;
                approvedAt: Date | null;
                approvedBy: string | null;
                introVideoUrl: string | null;
                readingType: string | null;
                readingTypeAr: string | null;
            };
            transactions: {
                id: string;
                createdAt: Date;
                description: string;
                paymentId: string | null;
                type: string;
                bookingId: string | null;
                amount: number;
                walletId: string;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            teacherId: string;
            balance: number;
            pendingBalance: number;
            totalEarned: number;
            isActive: boolean;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    syncPaymentsToWallets(): Promise<{
        synced: number;
        errors: number;
        total: number;
    }>;
    getTeacherWallet(id: string): Promise<{
        payoutRequests: {
            id: string;
            status: import(".prisma/client").$Enums.PayoutStatus;
            createdAt: Date;
            updatedAt: Date;
            approvedAt: Date | null;
            approvedBy: string | null;
            teacherId: string;
            amount: number;
            walletId: string;
            requestedAt: Date;
            processedAt: Date | null;
            rejectionReason: string | null;
        }[];
        teacher: {
            user: {
                id: string;
                email: string;
                phone: string;
                firstName: string;
                firstNameAr: string;
                lastName: string;
                lastNameAr: string;
                avatar: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            certificates: string | null;
            canIssueCertificates: boolean | null;
            specialties: string | null;
            specialtiesAr: string | null;
            userId: string;
            bio: string | null;
            bioAr: string | null;
            image: string | null;
            experience: number | null;
            hourlyRate: number;
            rating: number;
            totalReviews: number;
            isApproved: boolean;
            approvedAt: Date | null;
            approvedBy: string | null;
            introVideoUrl: string | null;
            readingType: string | null;
            readingTypeAr: string | null;
        };
        transactions: {
            id: string;
            createdAt: Date;
            description: string;
            paymentId: string | null;
            type: string;
            bookingId: string | null;
            amount: number;
            walletId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
        balance: number;
        pendingBalance: number;
        totalEarned: number;
        isActive: boolean;
    }>;
    sendMoneyToTeacher(id: string, body: {
        amount: number;
        paymentMethod: string;
        description?: string;
    }, admin: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
        balance: number;
        pendingBalance: number;
        totalEarned: number;
        isActive: boolean;
    }>;
    createWalletForTeacher(teacherId: string): Promise<{
        teacher: {
            user: {
                id: string;
                email: string;
                firstName: string;
                firstNameAr: string;
                lastName: string;
                lastNameAr: string;
                avatar: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            certificates: string | null;
            canIssueCertificates: boolean | null;
            specialties: string | null;
            specialtiesAr: string | null;
            userId: string;
            bio: string | null;
            bioAr: string | null;
            image: string | null;
            experience: number | null;
            hourlyRate: number;
            rating: number;
            totalReviews: number;
            isApproved: boolean;
            approvedAt: Date | null;
            approvedBy: string | null;
            introVideoUrl: string | null;
            readingType: string | null;
            readingTypeAr: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
        balance: number;
        pendingBalance: number;
        totalEarned: number;
        isActive: boolean;
    }>;
    disableWallet(id: string): Promise<{
        teacher: {
            user: {
                id: string;
                email: string;
                phone: string;
                firstName: string;
                firstNameAr: string;
                lastName: string;
                lastNameAr: string;
                avatar: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            certificates: string | null;
            canIssueCertificates: boolean | null;
            specialties: string | null;
            specialtiesAr: string | null;
            userId: string;
            bio: string | null;
            bioAr: string | null;
            image: string | null;
            experience: number | null;
            hourlyRate: number;
            rating: number;
            totalReviews: number;
            isApproved: boolean;
            approvedAt: Date | null;
            approvedBy: string | null;
            introVideoUrl: string | null;
            readingType: string | null;
            readingTypeAr: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
        balance: number;
        pendingBalance: number;
        totalEarned: number;
        isActive: boolean;
    }>;
    enableWallet(id: string): Promise<{
        teacher: {
            user: {
                id: string;
                email: string;
                phone: string;
                firstName: string;
                firstNameAr: string;
                lastName: string;
                lastNameAr: string;
                avatar: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            certificates: string | null;
            canIssueCertificates: boolean | null;
            specialties: string | null;
            specialtiesAr: string | null;
            userId: string;
            bio: string | null;
            bioAr: string | null;
            image: string | null;
            experience: number | null;
            hourlyRate: number;
            rating: number;
            totalReviews: number;
            isApproved: boolean;
            approvedAt: Date | null;
            approvedBy: string | null;
            introVideoUrl: string | null;
            readingType: string | null;
            readingTypeAr: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
        balance: number;
        pendingBalance: number;
        totalEarned: number;
        isActive: boolean;
    }>;
    getAllSubscriptions(page?: string, limit?: string, status?: string): Promise<{
        message: string;
    }>;
    getAllStudentWallets(page?: string, limit?: string, search?: string): Promise<{
        wallets: ({
            transactions: {
                id: string;
                createdAt: Date;
                description: string;
                paymentId: string | null;
                type: string;
                bookingId: string | null;
                amount: number;
                walletId: string;
                subscriptionId: string | null;
                processedBy: string | null;
            }[];
            student: {
                id: string;
                email: string;
                phone: string;
                firstName: string;
                firstNameAr: string;
                lastName: string;
                lastNameAr: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            balance: number;
            isActive: boolean;
            studentId: string;
            totalDeposited: number;
            totalSpent: number;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getStudentWallet(studentId: string): Promise<{
        transactions: {
            id: string;
            createdAt: Date;
            description: string;
            paymentId: string | null;
            type: string;
            bookingId: string | null;
            amount: number;
            walletId: string;
            subscriptionId: string | null;
            processedBy: string | null;
        }[];
        student: {
            id: string;
            email: string;
            phone: string;
            firstName: string;
            firstNameAr: string;
            lastName: string;
            lastNameAr: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        balance: number;
        isActive: boolean;
        studentId: string;
        totalDeposited: number;
        totalSpent: number;
    }>;
    depositToStudentWallet(dto: DepositToWalletDto, admin: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        balance: number;
        isActive: boolean;
        studentId: string;
        totalDeposited: number;
        totalSpent: number;
    }>;
    withdrawFromStudentWallet(dto: WithdrawFromWalletDto, admin: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        balance: number;
        isActive: boolean;
        studentId: string;
        totalDeposited: number;
        totalSpent: number;
    }>;
    processStudentPayment(dto: ProcessPaymentDto, admin: any): Promise<{
        wallet: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            balance: number;
            isActive: boolean;
            studentId: string;
            totalDeposited: number;
            totalSpent: number;
        };
        transaction: {
            id: string;
            createdAt: Date;
            description: string;
            paymentId: string | null;
            type: string;
            bookingId: string | null;
            amount: number;
            walletId: string;
            subscriptionId: string | null;
            processedBy: string | null;
        };
    }>;
    getStudentWalletTransactions(walletId: string, page?: string, limit?: string): Promise<{
        transactions: {
            id: string;
            createdAt: Date;
            description: string;
            paymentId: string | null;
            type: string;
            bookingId: string | null;
            amount: number;
            walletId: string;
            subscriptionId: string | null;
            processedBy: string | null;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
}
