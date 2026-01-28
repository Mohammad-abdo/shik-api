"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding database...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@shaykhi.com' },
        update: {},
        create: {
            email: 'admin@shaykhi.com',
            password: adminPassword,
            firstName: 'Admin',
            firstNameAr: 'مدير',
            lastName: 'User',
            lastNameAr: 'النظام',
            role: 'ADMIN',
            status: 'ACTIVE',
            emailVerified: true,
            phoneVerified: true,
            phone: '+201000000000',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
        },
    });
    console.log('✅ Admin user created:', admin.email);
    const teacherImages = [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    ];
    const courseImages = [
        'https://images.unsplash.com/photo-1604147706283-d7119b5b822c?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1516321497487-e288fb197fca?w=800&h=600&fit=crop',
    ];
    const videoThumbnails = [
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1280&h=720&fit=crop',
        'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1280&h=720&fit=crop',
        'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1280&h=720&fit=crop',
        'https://images.unsplash.com/photo-1516321497487-e288fb197fca?w=1280&h=720&fit=crop',
        'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1280&h=720&fit=crop',
    ];
    const videoUrls = [
        'https://www.youtube.com/embed/5fZqk8vO1vE',
        'https://www.youtube.com/embed/2QKhE9ZrI2k',
        'https://www.youtube.com/embed/7xRp6sKqKqE',
        'https://www.youtube.com/embed/8HB-tW0n4QU',
        'https://www.youtube.com/embed/9P6rdqiybaw',
        'https://www.youtube.com/embed/5fZqk8vO1vE',
        'https://www.youtube.com/embed/2QKhE9ZrI2k',
        'https://www.youtube.com/embed/7xRp6sKqKqE',
        'https://www.youtube.com/embed/8HB-tW0n4QU',
        'https://www.youtube.com/embed/9P6rdqiybaw',
    ];
    const introVideoUrls = [
        'https://www.youtube.com/embed/5fZqk8vO1vE',
        'https://www.youtube.com/embed/2QKhE9ZrI2k',
        'https://www.youtube.com/embed/7xRp6sKqKqE',
    ];
    const userAvatars = [
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
    ];
    const createStudentWallet = async (studentId) => {
        try {
            await prisma.studentWallet.upsert({
                where: { studentId },
                update: {},
                create: {
                    studentId,
                    balance: Math.random() * 500,
                    totalDeposited: Math.random() * 1000,
                    totalSpent: Math.random() * 500,
                },
            });
        }
        catch (error) {
        }
    };
    const studentPassword = await bcrypt.hash('student123', 10);
    const students = [
        {
            email: 'student1@shaykhi.com',
            firstName: 'Ahmed',
            firstNameAr: 'أحمد',
            lastName: 'Mohamed',
            lastNameAr: 'محمد',
            phone: '+201234567890',
            currentSurah: 'Al-Baqarah',
            currentSurahAr: 'البقرة',
            memorizationLevel: 'INTERMEDIATE',
            memorizationLevelAr: 'متوسط',
            totalMemorized: 5,
        },
        {
            email: 'student2@shaykhi.com',
            firstName: 'Fatima',
            firstNameAr: 'فاطمة',
            lastName: 'Ali',
            lastNameAr: 'علي',
            phone: '+201234567891',
            currentSurah: 'Al-Imran',
            currentSurahAr: 'آل عمران',
            memorizationLevel: 'BEGINNER',
            memorizationLevelAr: 'مبتدئ',
            totalMemorized: 2,
        },
        {
            email: 'student3@shaykhi.com',
            firstName: 'Omar',
            firstNameAr: 'عمر',
            lastName: 'Hassan',
            lastNameAr: 'حسن',
            phone: '+201234567892',
            currentSurah: 'An-Nisa',
            currentSurahAr: 'النساء',
            memorizationLevel: 'ADVANCED',
            memorizationLevelAr: 'متقدم',
            totalMemorized: 15,
        },
        {
            email: 'student4@shaykhi.com',
            firstName: 'Aisha',
            firstNameAr: 'عائشة',
            lastName: 'Ibrahim',
            lastNameAr: 'إبراهيم',
            phone: '+201234567893',
            currentSurah: 'Al-Maidah',
            currentSurahAr: 'المائدة',
            memorizationLevel: 'INTERMEDIATE',
            memorizationLevelAr: 'متوسط',
            totalMemorized: 8,
        },
        {
            email: 'student5@shaykhi.com',
            firstName: 'Khalid',
            firstNameAr: 'خالد',
            lastName: 'Saeed',
            lastNameAr: 'سعيد',
            phone: '+201234567894',
            currentSurah: 'Al-Anam',
            currentSurahAr: 'الأنعام',
            memorizationLevel: 'BEGINNER',
            memorizationLevelAr: 'مبتدئ',
            totalMemorized: 1,
        },
    ];
    const createdStudents = [];
    for (const studentData of students) {
        try {
            let phoneToUse = studentData.phone;
            if (phoneToUse) {
                const phoneOwner = await prisma.user.findUnique({
                    where: { phone: phoneToUse },
                });
                if (phoneOwner && phoneOwner.email !== studentData.email) {
                    phoneToUse = null;
                }
            }
            const student = await prisma.user.upsert({
                where: { email: studentData.email },
                update: {
                    ...(phoneToUse && { phone: phoneToUse }),
                    password: studentPassword,
                    role: 'STUDENT',
                    status: 'ACTIVE',
                    emailVerified: true,
                    phoneVerified: !!phoneToUse,
                    avatar: userAvatars[createdStudents.length % userAvatars.length],
                },
                create: {
                    ...studentData,
                    phone: phoneToUse,
                    password: studentPassword,
                    role: 'STUDENT',
                    status: 'ACTIVE',
                    emailVerified: true,
                    phoneVerified: !!phoneToUse,
                    avatar: userAvatars[createdStudents.length % userAvatars.length],
                },
            });
            createdStudents.push(student);
            await createStudentWallet(student.id);
            console.log(`✅ Student created: ${student.email}`);
        }
        catch (error) {
            console.error(`❌ Error creating student ${studentData.email}:`, error);
        }
    }
    const teacherPassword = await bcrypt.hash('teacher123', 10);
    const teachersData = [
        {
            email: 'teacher1@shaykhi.com',
            firstName: 'Khalid',
            firstNameAr: 'خالد',
            lastName: 'Al-Ansari',
            lastNameAr: 'الأنصاري',
            phone: '+201234567895',
            bio: 'Experienced Quran teacher with 10 years of experience in tajweed and memorization',
            bioAr: 'شيخ قرآن ذو خبرة 10 سنوات في التجويد والحفظ',
            experience: 10,
            hourlyRate: 50,
            specialties: ['tajweed', 'memorization', 'recitation'],
            specialtiesAr: ['تجويد', 'حفظ', 'تلاوة'],
            readingType: 'HAFS',
            readingTypeAr: 'حفص',
            isApproved: true,
            rating: 4.8,
            totalReviews: 25,
            image: teacherImages[0],
            introVideoUrl: introVideoUrls[0],
        },
        {
            email: 'teacher2@shaykhi.com',
            firstName: 'Omar',
            firstNameAr: 'عمر',
            lastName: 'Ibrahim',
            lastNameAr: 'إبراهيم',
            phone: '+201234567896',
            bio: 'Specialized in Quran recitation and tajweed rules',
            bioAr: 'متخصص في تلاوة القرآن وقواعد التجويد',
            experience: 5,
            hourlyRate: 40,
            specialties: ['recitation', 'tajweed'],
            specialtiesAr: ['تلاوة', 'تجويد'],
            readingType: 'WARSH',
            readingTypeAr: 'ورش',
            isApproved: true,
            rating: 4.5,
            totalReviews: 15,
            image: teacherImages[1],
            introVideoUrl: introVideoUrls[1],
        },
        {
            email: 'teacher3@shaykhi.com',
            firstName: 'Fatima',
            firstNameAr: 'فاطمة',
            lastName: 'Al-Zahra',
            lastNameAr: 'الزهراء',
            phone: '+201234567897',
            bio: 'Expert in Quran memorization and Ijaza certification',
            bioAr: 'خبيرة في حفظ القرآن وإجازة القراءة',
            experience: 15,
            hourlyRate: 60,
            specialties: ['memorization', 'ijaza'],
            specialtiesAr: ['حفظ', 'إجازة'],
            readingType: 'HAFS',
            readingTypeAr: 'حفص',
            isApproved: true,
            rating: 4.9,
            totalReviews: 40,
            canIssueCertificates: true,
            image: teacherImages[2],
            introVideoUrl: introVideoUrls[2],
        },
        {
            email: 'teacher4@shaykhi.com',
            firstName: 'Mohamed',
            firstNameAr: 'محمد',
            lastName: 'Al-Hafiz',
            lastNameAr: 'الحافظ',
            phone: '+201234567898',
            bio: 'Quran teacher specializing in advanced memorization techniques',
            bioAr: 'شيخ قرآن متخصص في تقنيات الحفظ المتقدمة',
            experience: 8,
            hourlyRate: 45,
            specialties: ['memorization', 'recitation'],
            specialtiesAr: ['حفظ', 'تلاوة'],
            readingType: 'HAFS',
            readingTypeAr: 'حفص',
            isApproved: false,
            rating: 0,
            totalReviews: 0,
            image: teacherImages[3],
        },
        {
            email: 'teacher5@shaykhi.com',
            firstName: 'Aisha',
            firstNameAr: 'عائشة',
            lastName: 'Bint-Abdullah',
            lastNameAr: 'بنت عبدالله',
            phone: '+201234567899',
            bio: 'Female Quran teacher for women and children',
            bioAr: 'شيخة قرآن للنساء والأطفال',
            experience: 6,
            hourlyRate: 35,
            specialties: ['tajweed', 'recitation'],
            specialtiesAr: ['تجويد', 'تلاوة'],
            readingType: 'HAFS',
            readingTypeAr: 'حفص',
            isApproved: true,
            rating: 4.7,
            totalReviews: 20,
            image: teacherImages[4],
            introVideoUrl: introVideoUrls[0],
        },
    ];
    const createdTeachers = [];
    for (const teacherData of teachersData) {
        try {
            const { specialties, specialtiesAr } = teacherData;
            let phoneToUse = teacherData.phone;
            if (phoneToUse) {
                const phoneOwner = await prisma.user.findUnique({
                    where: { phone: phoneToUse },
                });
                if (phoneOwner && phoneOwner.email !== teacherData.email) {
                    phoneToUse = null;
                }
            }
            const teacherUser = await prisma.user.upsert({
                where: { email: teacherData.email },
                update: {
                    ...(phoneToUse && { phone: phoneToUse }),
                    password: teacherPassword,
                    firstName: teacherData.firstName,
                    firstNameAr: teacherData.firstNameAr,
                    lastName: teacherData.lastName,
                    lastNameAr: teacherData.lastNameAr,
                    role: 'TEACHER',
                    status: 'ACTIVE',
                    emailVerified: true,
                    phoneVerified: !!phoneToUse,
                },
                create: {
                    email: teacherData.email,
                    password: teacherPassword,
                    firstName: teacherData.firstName,
                    firstNameAr: teacherData.firstNameAr,
                    lastName: teacherData.lastName,
                    lastNameAr: teacherData.lastNameAr,
                    phone: phoneToUse,
                    role: 'TEACHER',
                    status: 'ACTIVE',
                    emailVerified: true,
                    phoneVerified: !!phoneToUse,
                },
            });
            const teacher = await prisma.teacher.upsert({
                where: { userId: teacherUser.id },
                update: {},
                create: {
                    userId: teacherUser.id,
                    bio: teacherData.bio,
                    bioAr: teacherData.bioAr,
                    experience: teacherData.experience,
                    hourlyRate: teacherData.hourlyRate,
                    specialties: JSON.stringify(specialties),
                    specialtiesAr: JSON.stringify(specialtiesAr),
                    readingType: teacherData.readingType,
                    readingTypeAr: teacherData.readingTypeAr,
                    isApproved: teacherData.isApproved,
                    approvedAt: teacherData.isApproved ? new Date() : null,
                    approvedBy: teacherData.isApproved ? admin.id : null,
                    rating: teacherData.rating,
                    totalReviews: teacherData.totalReviews,
                    canIssueCertificates: teacherData.canIssueCertificates || false,
                    image: teacherData.image || null,
                    introVideoUrl: teacherData.introVideoUrl || null,
                },
            });
            await prisma.teacherWallet.upsert({
                where: { teacherId: teacher.id },
                update: {},
                create: {
                    teacherId: teacher.id,
                    balance: Math.random() * 1000,
                    pendingBalance: Math.random() * 500,
                    totalEarned: Math.random() * 5000,
                },
            });
            createdTeachers.push({ user: teacherUser, teacher });
            console.log(`✅ Teacher created: ${teacherUser.email}`);
        }
        catch (error) {
            console.error(`❌ Error creating teacher ${teacherData.email}:`, error);
        }
    }
    const schedules = [
        { teacherId: createdTeachers[0].teacher.id, dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
        { teacherId: createdTeachers[0].teacher.id, dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
        { teacherId: createdTeachers[0].teacher.id, dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
        { teacherId: createdTeachers[0].teacher.id, dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
        { teacherId: createdTeachers[0].teacher.id, dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
        { teacherId: createdTeachers[1].teacher.id, dayOfWeek: 1, startTime: '10:00', endTime: '18:00' },
        { teacherId: createdTeachers[1].teacher.id, dayOfWeek: 2, startTime: '10:00', endTime: '18:00' },
        { teacherId: createdTeachers[1].teacher.id, dayOfWeek: 3, startTime: '10:00', endTime: '18:00' },
        { teacherId: createdTeachers[2].teacher.id, dayOfWeek: 0, startTime: '08:00', endTime: '16:00' },
        { teacherId: createdTeachers[2].teacher.id, dayOfWeek: 1, startTime: '08:00', endTime: '16:00' },
        { teacherId: createdTeachers[2].teacher.id, dayOfWeek: 2, startTime: '08:00', endTime: '16:00' },
        { teacherId: createdTeachers[2].teacher.id, dayOfWeek: 3, startTime: '08:00', endTime: '16:00' },
        { teacherId: createdTeachers[2].teacher.id, dayOfWeek: 4, startTime: '08:00', endTime: '16:00' },
        { teacherId: createdTeachers[3].teacher.id, dayOfWeek: 1, startTime: '14:00', endTime: '20:00' },
        { teacherId: createdTeachers[3].teacher.id, dayOfWeek: 2, startTime: '14:00', endTime: '20:00' },
        { teacherId: createdTeachers[3].teacher.id, dayOfWeek: 3, startTime: '14:00', endTime: '20:00' },
        { teacherId: createdTeachers[4].teacher.id, dayOfWeek: 0, startTime: '09:00', endTime: '15:00' },
        { teacherId: createdTeachers[4].teacher.id, dayOfWeek: 1, startTime: '09:00', endTime: '15:00' },
        { teacherId: createdTeachers[4].teacher.id, dayOfWeek: 2, startTime: '09:00', endTime: '15:00' },
        { teacherId: createdTeachers[4].teacher.id, dayOfWeek: 3, startTime: '09:00', endTime: '15:00' },
    ];
    await prisma.schedule.createMany({
        data: schedules,
        skipDuplicates: true,
    });
    console.log('✅ Schedules created');
    const bookings = [];
    const today = new Date();
    for (let i = 0; i < 20; i++) {
        const bookingDate = new Date(today);
        bookingDate.setDate(today.getDate() + i);
        const teacher = createdTeachers[i % createdTeachers.length];
        const student = createdStudents[i % createdStudents.length];
        if (teacher && student) {
            const statuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
            const status = statuses[i % statuses.length];
            const duration = [1, 1.5, 2][i % 3];
            const price = teacher.teacher.hourlyRate * duration;
            bookings.push({
                studentId: student.id,
                teacherId: teacher.teacher.id,
                date: bookingDate,
                startTime: ['09:00', '10:00', '11:00', '14:00', '15:00'][i % 5],
                duration: duration,
                status: status,
                price: price,
                discount: i % 3 === 0 ? price * 0.1 : 0,
                totalPrice: price - (i % 3 === 0 ? price * 0.1 : 0),
                cancelledAt: status === 'CANCELLED' ? new Date() : null,
            });
        }
    }
    await prisma.booking.createMany({
        data: bookings,
        skipDuplicates: true,
    });
    console.log('✅ Bookings created');
    const createdBookings = await prisma.booking.findMany({ take: 10 });
    const payments = [];
    for (const booking of createdBookings) {
        if (booking.status === 'COMPLETED' || booking.status === 'CONFIRMED') {
            payments.push({
                bookingId: booking.id,
                amount: booking.totalPrice * 100,
                currency: 'USD',
                status: booking.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING',
                paymentMethod: ['stripe', 'mada', 'apple_pay'][Math.floor(Math.random() * 3)],
            });
        }
    }
    await prisma.payment.createMany({
        data: payments,
        skipDuplicates: true,
    });
    console.log('✅ Payments created');
    const superAdminRole = await prisma.role.upsert({
        where: { name: 'SUPER_ADMIN' },
        update: {},
        create: {
            name: 'SUPER_ADMIN',
            description: 'Super administrator with all permissions',
        },
    });
    const financeAdminRole = await prisma.role.upsert({
        where: { name: 'FINANCE_ADMIN' },
        update: {},
        create: {
            name: 'FINANCE_ADMIN',
            description: 'Finance administrator',
        },
    });
    const contentAdminRole = await prisma.role.upsert({
        where: { name: 'CONTENT_ADMIN' },
        update: {},
        create: {
            name: 'CONTENT_ADMIN',
            description: 'Content administrator',
        },
    });
    const supportAdminRole = await prisma.role.upsert({
        where: { name: 'SUPPORT_ADMIN' },
        update: {},
        create: {
            name: 'SUPPORT_ADMIN',
            description: 'Support administrator',
        },
    });
    console.log('✅ Roles created');
    const permissions = [
        { name: 'users.read', resource: 'users', action: 'read', description: 'Read users' },
        { name: 'users.write', resource: 'users', action: 'write', description: 'Write users' },
        { name: 'teachers.approve', resource: 'teachers', action: 'approve', description: 'Approve teachers' },
        { name: 'teachers.manage', resource: 'teachers', action: 'manage', description: 'Manage teachers' },
        { name: 'bookings.manage', resource: 'bookings', action: 'manage', description: 'Manage bookings' },
        { name: 'payments.view', resource: 'payments', action: 'view', description: 'View payments' },
        { name: 'payments.manage', resource: 'payments', action: 'manage', description: 'Manage payments' },
        { name: 'content.review', resource: 'content', action: 'review', description: 'Review content' },
        { name: 'reports.view', resource: 'reports', action: 'view', description: 'View reports' },
        { name: 'notifications.send', resource: 'notifications', action: 'send', description: 'Send notifications' },
        { name: 'roles.read', resource: 'roles', action: 'read', description: 'Read roles' },
        { name: 'roles.write', resource: 'roles', action: 'write', description: 'Write roles' },
        { name: 'permissions.read', resource: 'permissions', action: 'read', description: 'Read permissions' },
        { name: 'permissions.write', resource: 'permissions', action: 'write', description: 'Write permissions' },
        { name: 'courses.read', resource: 'courses', action: 'read', description: 'Read courses' },
        { name: 'courses.write', resource: 'courses', action: 'write', description: 'Write courses' },
        { name: 'subscriptions.read', resource: 'subscriptions', action: 'read', description: 'Read subscriptions' },
        { name: 'subscriptions.write', resource: 'subscriptions', action: 'write', description: 'Write subscriptions' },
    ];
    const createdPermissions = [];
    for (const perm of permissions) {
        const permission = await prisma.permission.upsert({
            where: { name: perm.name },
            update: {},
            create: perm,
        });
        createdPermissions.push(permission);
    }
    console.log('✅ Permissions created');
    for (const permission of createdPermissions) {
        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: superAdminRole.id,
                    permissionId: permission.id,
                },
            },
            update: {},
            create: {
                roleId: superAdminRole.id,
                permissionId: permission.id,
            },
        });
    }
    const financePermissions = createdPermissions.filter((p) => ['payments.view', 'payments.manage', 'reports.view'].includes(p.name));
    for (const permission of financePermissions) {
        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: financeAdminRole.id,
                    permissionId: permission.id,
                },
            },
            update: {},
            create: {
                roleId: financeAdminRole.id,
                permissionId: permission.id,
            },
        });
    }
    const contentPermissions = createdPermissions.filter((p) => ['content.review', 'teachers.approve'].includes(p.name));
    for (const permission of contentPermissions) {
        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: contentAdminRole.id,
                    permissionId: permission.id,
                },
            },
            update: {},
            create: {
                roleId: contentAdminRole.id,
                permissionId: permission.id,
            },
        });
    }
    const supportPermissions = createdPermissions.filter((p) => ['users.read', 'users.write', 'bookings.manage', 'notifications.send'].includes(p.name));
    for (const permission of supportPermissions) {
        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: supportAdminRole.id,
                    permissionId: permission.id,
                },
            },
            update: {},
            create: {
                roleId: supportAdminRole.id,
                permissionId: permission.id,
            },
        });
    }
    console.log('✅ Role permissions assigned');
    await prisma.userRole.upsert({
        where: {
            userId_roleId: {
                userId: admin.id,
                roleId: superAdminRole.id,
            },
        },
        update: {},
        create: {
            userId: admin.id,
            roleId: superAdminRole.id,
        },
    });
    console.log('✅ Admin role assigned');
    const teacherPackages = [
        {
            name: 'Basic Plan',
            nameAr: 'الخطة الأساسية',
            description: 'Basic subscription for new teachers',
            descriptionAr: 'اشتراك أساسي للشيخين الجدد',
            price: 29.99,
            duration: 30,
            features: JSON.stringify(['Up to 10 students', 'Basic analytics', 'Email support']),
            featuresAr: JSON.stringify(['حتى 10 طلاب', 'تحليلات أساسية', 'دعم عبر البريد']),
            maxStudents: 10,
            maxCourses: 5,
            isActive: true,
            isPopular: false,
        },
        {
            name: 'Professional Plan',
            nameAr: 'الخطة الاحترافية',
            description: 'Professional subscription for experienced teachers',
            descriptionAr: 'اشتراك احترافي للشيخين ذوي الخبرة',
            price: 59.99,
            duration: 30,
            features: JSON.stringify(['Up to 50 students', 'Advanced analytics', 'Priority support', 'Certificate issuance']),
            featuresAr: JSON.stringify(['حتى 50 طالب', 'تحليلات متقدمة', 'دعم ذو أولوية', 'إصدار الشهادات']),
            maxStudents: 50,
            maxCourses: 20,
            isActive: true,
            isPopular: true,
        },
        {
            name: 'Enterprise Plan',
            nameAr: 'الخطة المؤسسية',
            description: 'Enterprise subscription for large institutions',
            descriptionAr: 'اشتراك مؤسسي للمؤسسات الكبيرة',
            price: 99.99,
            duration: 30,
            features: JSON.stringify(['Unlimited students', 'Full analytics', '24/7 support', 'Certificate issuance', 'Custom branding']),
            featuresAr: JSON.stringify(['طلاب غير محدود', 'تحليلات كاملة', 'دعم 24/7', 'إصدار الشهادات', 'علامة تجارية مخصصة']),
            maxStudents: null,
            maxCourses: null,
            isActive: true,
            isPopular: false,
        },
    ];
    const createdTeacherPackages = [];
    for (const pkg of teacherPackages) {
        let packageCreated = await prisma.subscriptionPackage.findFirst({
            where: { name: pkg.name },
        });
        if (!packageCreated) {
            packageCreated = await prisma.subscriptionPackage.create({
                data: pkg,
            });
        }
        createdTeacherPackages.push(packageCreated);
    }
    console.log('✅ Teacher subscription packages created');
    for (let i = 0; i < Math.min(3, createdTeachers.length); i++) {
        const teacher = createdTeachers[i];
        const packageToUse = createdTeacherPackages[i % createdTeacherPackages.length];
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + packageToUse.duration);
        await prisma.teacherSubscription.create({
            data: {
                teacherId: teacher.teacher.id,
                packageId: packageToUse.id,
                status: 'ACTIVE',
                startDate,
                endDate,
                autoRenew: true,
            },
        });
    }
    console.log('✅ Teacher subscriptions created');
    const studentPackages = [
        {
            name: 'Student Basic',
            nameAr: 'الخطة الأساسية للطالب',
            description: 'Basic subscription for students',
            descriptionAr: 'اشتراك أساسي للطلاب',
            price: 19.99,
            duration: 30,
            features: JSON.stringify(['5 bookings per month', 'Access to free courses', 'Basic support']),
            featuresAr: JSON.stringify(['5 حجوزات شهرياً', 'الوصول إلى الدورات المجانية', 'دعم أساسي']),
            maxBookings: 5,
            maxCourses: 3,
            isActive: true,
            isPopular: false,
        },
        {
            name: 'Student Premium',
            nameAr: 'الخطة المميزة للطالب',
            description: 'Premium subscription for students',
            descriptionAr: 'اشتراك مميز للطلاب',
            price: 39.99,
            duration: 30,
            features: JSON.stringify(['20 bookings per month', 'Access to all courses', 'Priority support', 'Certificates']),
            featuresAr: JSON.stringify(['20 حجز شهرياً', 'الوصول إلى جميع الدورات', 'دعم ذو أولوية', 'شهادات']),
            maxBookings: 20,
            maxCourses: 10,
            isActive: true,
            isPopular: true,
        },
    ];
    const createdStudentPackages = [];
    for (const pkg of studentPackages) {
        let packageCreated = await prisma.studentSubscriptionPackage.findFirst({
            where: { name: pkg.name },
        });
        if (!packageCreated) {
            packageCreated = await prisma.studentSubscriptionPackage.create({
                data: pkg,
            });
        }
        createdStudentPackages.push(packageCreated);
    }
    console.log('✅ Student subscription packages created');
    for (let i = 0; i < Math.min(3, createdStudents.length); i++) {
        const student = createdStudents[i];
        const packageToUse = createdStudentPackages[i % createdStudentPackages.length];
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + packageToUse.duration);
        await prisma.studentSubscription.create({
            data: {
                studentId: student.id,
                packageId: packageToUse.id,
                status: 'ACTIVE',
                startDate,
                endDate,
                autoRenew: true,
            },
        });
    }
    console.log('✅ Student subscriptions created');
    const courses = [];
    for (let i = 0; i < 5; i++) {
        const teacher = createdTeachers[i % createdTeachers.length];
        const course = await prisma.course.create({
            data: {
                title: `Quran Course ${i + 1}`,
                titleAr: `دورة القرآن ${i + 1}`,
                description: `Learn Quran recitation and tajweed - Course ${i + 1}`,
                descriptionAr: `تعلم تلاوة القرآن والتجويد - دورة ${i + 1}`,
                teacherId: teacher.teacher.id,
                price: [0, 29.99, 49.99, 79.99, 99.99][i],
                duration: [10, 20, 30, 40, 50][i],
                status: i < 3 ? 'PUBLISHED' : 'DRAFT',
                level: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'][i % 3],
                category: ['Tajweed', 'Memorization', 'Recitation', 'Ijaza', 'Advanced'][i],
                totalLessons: [5, 10, 15, 20, 25][i],
                totalVideos: [10, 20, 30, 40, 50][i],
                rating: 4.0 + Math.random(),
                totalReviews: Math.floor(Math.random() * 50),
                isFeatured: i < 2,
                image: courseImages[i % courseImages.length],
                introVideoUrl: introVideoUrls[i % introVideoUrls.length],
                introVideoThumbnail: videoThumbnails[i % videoThumbnails.length],
            },
        });
        courses.push(course);
        const lessons = [];
        for (let j = 0; j < 5; j++) {
            const lesson = await prisma.lesson.create({
                data: {
                    courseId: course.id,
                    title: `Lesson ${j + 1}`,
                    titleAr: `الدرس ${j + 1}`,
                    description: `Lesson ${j + 1} description`,
                    descriptionAr: `وصف الدرس ${j + 1}`,
                    order: j + 1,
                    durationMinutes: [30, 45, 60][j % 3],
                    isFree: j === 0,
                },
            });
            lessons.push(lesson);
            for (let k = 0; k < 3; k++) {
                const videoIndex = (i * 5 + j * 3 + k) % videoUrls.length;
                await prisma.video.create({
                    data: {
                        lessonId: lesson.id,
                        title: `Video ${k + 1}`,
                        titleAr: `الفيديو ${k + 1}`,
                        description: `Video ${k + 1} description`,
                        descriptionAr: `وصف الفيديو ${k + 1}`,
                        videoUrl: videoUrls[videoIndex],
                        thumbnailUrl: videoThumbnails[videoIndex % videoThumbnails.length],
                        durationSeconds: [300, 600, 900][k],
                        order: k + 1,
                    },
                });
            }
        }
    }
    console.log('✅ Courses, lessons, and videos created');
    const enrollments = [];
    for (let i = 0; i < 10; i++) {
        const course = courses[i % courses.length];
        const student = createdStudents[i % createdStudents.length];
        enrollments.push({
            courseId: course.id,
            studentId: student.id,
            status: 'ACTIVE',
            progress: Math.random() * 100,
        });
    }
    await prisma.courseEnrollment.createMany({
        data: enrollments,
        skipDuplicates: true,
    });
    console.log('✅ Course enrollments created');
    for (let i = 0; i < 3; i++) {
        const teacher = createdTeachers[i % createdTeachers.length];
        const exam = await prisma.exam.create({
            data: {
                teacherId: teacher.teacher.id,
                title: `Quran Exam ${i + 1}`,
                description: `Test your knowledge - Exam ${i + 1}`,
                duration: [30, 45, 60][i],
                totalMarks: [50, 75, 100][i],
                passingMarks: [25, 38, 50][i],
                status: i < 2 ? 'PUBLISHED' : 'DRAFT',
                isPublished: i < 2,
            },
        });
        for (let j = 0; j < 5; j++) {
            await prisma.question.create({
                data: {
                    examId: exam.id,
                    type: j < 3 ? 'MCQ' : 'TRUE_FALSE',
                    question: `Question ${j + 1}: What is the correct answer?`,
                    options: j < 3 ? JSON.stringify(['Option A', 'Option B', 'Option C', 'Option D']) : null,
                    correctAnswer: j < 3 ? 'Option A' : 'TRUE',
                    points: 10,
                    order: j + 1,
                },
            });
        }
    }
    console.log('✅ Exams and questions created');
    try {
        const certificates = [];
        for (let i = 0; i < 5; i++) {
            const student = createdStudents[i % createdStudents.length];
            const teacher = createdTeachers.find((t) => t.teacher.canIssueCertificates);
            if (student && teacher) {
                certificates.push({
                    studentId: student.id,
                    teacherId: teacher.teacher.id,
                    type: ['MEMORIZATION', 'RECITATION', 'TAJWEED', 'IJAZA'][i % 4],
                    title: `شهادة ${['حفظ', 'تلاوة', 'تجويد', 'إجازة'][i % 4]}`,
                    description: `شهادة إتمام ${['حفظ', 'تلاوة', 'تجويد', 'إجازة'][i % 4]}`,
                    status: 'ACTIVE',
                    issuedAt: new Date(),
                });
            }
        }
        if (certificates.length > 0) {
            await prisma.certificate.createMany({
                data: certificates,
                skipDuplicates: true,
            });
            console.log('✅ Certificates created');
        }
    }
    catch (error) {
        console.log('⚠️  Certificates table not found, skipping certificate creation');
    }
    console.log('🎉 Seeding completed!');
    console.log('\n📝 Test Credentials:');
    console.log('Admin: admin@shaykhi.com / admin123');
    console.log('Student: student1@shaykhi.com / student123');
    console.log('Teacher: teacher1@shaykhi.com / teacher123');
}
main()
    .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map