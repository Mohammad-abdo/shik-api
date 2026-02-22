const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

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
  'https://www.youtube.com/embed/8HB-tW0n4QU',
  'https://www.youtube.com/embed/9P6rdqiybaw',
];

const userAvatars = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
];

async function createStudentWallet(studentId) {
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
  } catch (e) {
    // skip if exists
  }
}

async function main() {
  console.log('Seeding database...');

  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@shaykhi.com' },
    update: {},
    create: {
      email: 'admin@shaykhi.com',
      password: adminPassword,
      firstName: 'Admin',
      firstNameAr: '\u0645\u062F\u064A\u0631',
      lastName: 'User',
      lastNameAr: '\u0627\u0644\u0646\u0638\u0627\u0645',
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
      phone: '+201000000000',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
    },
  });
  console.log('Admin user created:', admin.email);

  const studentPassword = await bcrypt.hash('student123', 10);
  const studentsData = [
    { email: 'student1@shaykhi.com', firstName: 'Ahmed', firstNameAr: '\u0623\u062D\u0645\u062F', lastName: 'Mohamed', lastNameAr: '\u0645\u062D\u0645\u062F', phone: '+201234567890', currentSurah: 'Al-Baqarah', currentSurahAr: '\u0627\u0644\u0628\u0642\u0631\u0629', memorizationLevel: 'INTERMEDIATE', memorizationLevelAr: '\u0645\u062A\u0648\u0633\u0637', totalMemorized: 5 },
    { email: 'student2@shaykhi.com', firstName: 'Fatima', firstNameAr: '\u0641\u0627\u0637\u0645\u0629', lastName: 'Ali', lastNameAr: '\u0639\u0644\u064A', phone: '+201234567891', currentSurah: 'Al-Imran', currentSurahAr: '\u0622\u0644 \u0639\u0645\u0631\u0627\u0646', memorizationLevel: 'BEGINNER', memorizationLevelAr: '\u0645\u0628\u062A\u062F\u0626', totalMemorized: 2 },
    { email: 'student3@shaykhi.com', firstName: 'Omar', firstNameAr: '\u0639\u0645\u0631', lastName: 'Hassan', lastNameAr: '\u062D\u0633\u0646', phone: '+201234567892', currentSurah: 'An-Nisa', currentSurahAr: '\u0627\u0644\u0646\u0633\u0627\u0621', memorizationLevel: 'ADVANCED', memorizationLevelAr: '\u0645\u062A\u0642\u062F\u0645', totalMemorized: 15 },
    { email: 'student4@shaykhi.com', firstName: 'Aisha', firstNameAr: '\u0639\u0627\u0626\u0634\u0629', lastName: 'Ibrahim', lastNameAr: '\u0625\u0628\u0631\u0627\u0647\u064A\u0645', phone: '+201234567893', currentSurah: 'Al-Maidah', currentSurahAr: '\u0627\u0644\u0645\u0627\u0626\u062F\u0629', memorizationLevel: 'INTERMEDIATE', memorizationLevelAr: '\u0645\u062A\u0648\u0633\u0637', totalMemorized: 8 },
    { email: 'student5@shaykhi.com', firstName: 'Khalid', firstNameAr: '\u062E\u0627\u0644\u062F', lastName: 'Saeed', lastNameAr: '\u0633\u0639\u064A\u062F', phone: '+201234567894', currentSurah: 'Al-Anam', currentSurahAr: '\u0627\u0644\u0623\u0646\u0639\u0627\u0645', memorizationLevel: 'BEGINNER', memorizationLevelAr: '\u0645\u0628\u062A\u062F\u0626', totalMemorized: 1 },
  ];

  const createdStudents = [];
  for (let i = 0; i < studentsData.length; i++) {
    const d = studentsData[i];
    let phoneToUse = d.phone;
    if (phoneToUse) {
      const existing = await prisma.user.findUnique({ where: { phone: phoneToUse } });
      if (existing && existing.email !== d.email) phoneToUse = null;
    }
    const student = await prisma.user.upsert({
      where: { email: d.email },
      update: { password: studentPassword, role: 'STUDENT', status: 'ACTIVE', emailVerified: true, phoneVerified: !!phoneToUse, avatar: userAvatars[i % userAvatars.length] },
      create: {
        ...d,
        phone: phoneToUse,
        password: studentPassword,
        role: 'STUDENT',
        status: 'ACTIVE',
        emailVerified: true,
        phoneVerified: !!phoneToUse,
        avatar: userAvatars[i % userAvatars.length],
      },
    });
    createdStudents.push(student);
    await createStudentWallet(student.id);
    console.log('Student created:', student.email);
  }

  const teacherPassword = await bcrypt.hash('teacher123', 10);
  // مشايخ عادية (FULL_TEACHER): حجوزات، جداول، محفظة
  // مشايخ دورات فقط (COURSE_SHEIKH): اسم، صورة، فيديو تعريفي، محفظة، يُربطون بالدورات فقط — بدون حجوزات ولا جداول
  const teachersData = [
    { email: 'teacher1@shaykhi.com', firstName: 'Abdelrahman', firstNameAr: '\u0639\u0628\u062F \u0627\u0644\u0631\u062D\u0645\u0646', lastName: 'El-Masry', lastNameAr: '\u0627\u0644\u0645\u0635\u0631\u064A', phone: '+201234567895', bio: 'Certified Quran sheikh for live one-to-one sessions. Focus on Tajweed correction and daily memorization plans.', bioAr: '\u0634\u064A\u062E \u0642\u0631\u0622\u0646 \u0645\u0639\u062A\u0645\u062F \u0644\u0644\u062D\u0644\u0642\u0627\u062A \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629 \u0648\u064A\u0631\u0643\u0632 \u0639\u0644\u0649 \u062A\u0635\u062D\u064A\u062D \u0627\u0644\u062A\u062C\u0648\u064A\u062F \u0648\u062E\u0637\u0637 \u0627\u0644\u062D\u0641\u0638', experience: 12, hourlyRate: 180, specialties: ['tajweed', 'memorization', 'recitation'], specialtiesAr: ['\u062A\u062C\u0648\u064A\u062F', '\u062D\u0641\u0638', '\u062A\u0644\u0627\u0648\u0629'], readingType: 'HAFS', readingTypeAr: '\u062D\u0641\u0635', isApproved: true, rating: 4.9, totalReviews: 132, image: teacherImages[0], introVideoUrl: introVideoUrls[0], teacherType: 'FULL_TEACHER' },
    { email: 'teacher2@shaykhi.com', firstName: 'Youssef', firstNameAr: '\u064A\u0648\u0633\u0641', lastName: 'Saeed', lastNameAr: '\u0633\u0639\u064A\u062F', phone: '+201234567896', bio: 'Live Quran recitation coach. Specialized in adults and advanced pronunciation practice.', bioAr: '\u0645\u062F\u0631\u0628 \u062A\u0644\u0627\u0648\u0629 \u0642\u0631\u0622\u0646 \u0645\u0628\u0627\u0634\u0631 \u0645\u062A\u062E\u0635\u0635 \u0641\u064A \u062A\u062F\u0631\u064A\u0628 \u0627\u0644\u0643\u0628\u0627\u0631 \u0648\u062A\u062D\u0633\u064A\u0646 \u0627\u0644\u0645\u062E\u0627\u0631\u062C', experience: 9, hourlyRate: 160, specialties: ['recitation', 'tajweed', 'qiraat'], specialtiesAr: ['\u062A\u0644\u0627\u0648\u0629', '\u062A\u062C\u0648\u064A\u062F', '\u0642\u0631\u0627\u0621\u0627\u062A'], readingType: 'WARSH', readingTypeAr: '\u0648\u0631\u0634', isApproved: true, rating: 4.7, totalReviews: 88, image: teacherImages[1], introVideoUrl: introVideoUrls[1], teacherType: 'FULL_TEACHER' },
    { email: 'teacher3@shaykhi.com', firstName: 'Khadija', firstNameAr: '\u062E\u062F\u064A\u062C\u0629', lastName: 'Hassan', lastNameAr: '\u062D\u0633\u0646', phone: '+201234567897', bio: 'Female Quran sheikh for live sessions. Expert in kids memorization and weekly follow-up.', bioAr: '\u0634\u064A\u062E\u0629 \u0642\u0631\u0622\u0646 \u0644\u0644\u062D\u0644\u0642\u0627\u062A \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629 \u0648\u0645\u062A\u062E\u0635\u0635\u0629 \u0641\u064A \u062D\u0641\u0638 \u0627\u0644\u0623\u0637\u0641\u0627\u0644 \u0648\u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u0627\u0644\u0623\u0633\u0628\u0648\u0639\u064A\u0629', experience: 14, hourlyRate: 190, specialties: ['memorization', 'ijaza', 'tajweed'], specialtiesAr: ['\u062D\u0641\u0638', '\u0625\u062C\u0627\u0632\u0629', '\u062A\u062C\u0648\u064A\u062F'], readingType: 'HAFS', readingTypeAr: '\u062D\u0641\u0635', isApproved: true, rating: 4.95, totalReviews: 210, canIssueCertificates: true, image: teacherImages[2], introVideoUrl: introVideoUrls[2], teacherType: 'FULL_TEACHER' },
    { email: 'teacher4@shaykhi.com', firstName: 'Mahmoud', firstNameAr: '\u0645\u062D\u0645\u0648\u062F', lastName: 'El-Qari', lastNameAr: '\u0627\u0644\u0642\u0627\u0631\u0626', phone: '+201234567898', bio: 'Course sheikh only for recorded and structured programs. Not available for live booking.', bioAr: '\u0634\u064A\u062E \u062F\u0648\u0631\u0627\u062A \u0641\u0642\u0637 \u0644\u0644\u0628\u0631\u0627\u0645\u062C \u0627\u0644\u0645\u0633\u062C\u0644\u0629 \u0648\u0644\u0627 \u064A\u062A\u064A\u062D \u062D\u062C\u0632 \u062D\u0644\u0642\u0627\u062A \u0645\u0628\u0627\u0634\u0631\u0629', experience: 11, hourlyRate: 0, specialties: ['memorization', 'recitation'], specialtiesAr: ['\u062D\u0641\u0638', '\u062A\u0644\u0627\u0648\u0629'], readingType: 'HAFS', readingTypeAr: '\u062D\u0641\u0635', isApproved: true, rating: 0, totalReviews: 0, image: teacherImages[3], introVideoUrl: introVideoUrls[3], teacherType: 'COURSE_SHEIKH' },
    { email: 'teacher5@shaykhi.com', firstName: 'Amina', firstNameAr: '\u0623\u0645\u064A\u0646\u0629', lastName: 'Abdullah', lastNameAr: '\u0639\u0628\u062F\u0627\u0644\u0644\u0647', phone: '+201234567899', bio: 'Course content sheikh. Provides curriculum lessons only.', bioAr: '\u0634\u064A\u062E\u0629 \u0645\u062D\u062A\u0648\u0649 \u062F\u0648\u0631\u0627\u062A \u0641\u0642\u0637 \u0644\u0644\u062F\u0631\u0648\u0633 \u0627\u0644\u0645\u0646\u0647\u062C\u064A\u0629', experience: 7, hourlyRate: 0, specialties: ['tajweed', 'recitation'], specialtiesAr: ['\u062A\u062C\u0648\u064A\u062F', '\u062A\u0644\u0627\u0648\u0629'], readingType: 'HAFS', readingTypeAr: '\u062D\u0641\u0635', isApproved: true, rating: 0, totalReviews: 0, image: teacherImages[4], introVideoUrl: introVideoUrls[0], teacherType: 'COURSE_SHEIKH' },
  ];

  const createdTeachers = [];
  for (let i = 0; i < teachersData.length; i++) {
    const d = teachersData[i];
    let phoneToUse = d.phone;
    if (phoneToUse) {
      const existing = await prisma.user.findUnique({ where: { phone: phoneToUse } });
      if (existing && existing.email !== d.email) phoneToUse = null;
    }
    const teacherUser = await prisma.user.upsert({
      where: { email: d.email },
      update: {
        password: teacherPassword,
        firstName: d.firstName,
        firstNameAr: d.firstNameAr,
        lastName: d.lastName,
        lastNameAr: d.lastNameAr,
        phone: phoneToUse,
        role: 'TEACHER',
        status: 'ACTIVE',
        emailVerified: true,
        phoneVerified: !!phoneToUse,
        avatar: d.image,
      },
      create: {
        email: d.email,
        password: teacherPassword,
        firstName: d.firstName,
        firstNameAr: d.firstNameAr,
        lastName: d.lastName,
        lastNameAr: d.lastNameAr,
        phone: phoneToUse,
        avatar: d.image,
        role: 'TEACHER',
        status: 'ACTIVE',
        emailVerified: true,
        phoneVerified: !!phoneToUse,
      },
    });
    const teacherType = d.teacherType === 'COURSE_SHEIKH' ? 'COURSE_SHEIKH' : 'FULL_TEACHER';
    const teacher = await prisma.teacher.upsert({
      where: { userId: teacherUser.id },
      update: {
        teacherType,
        bio: d.bio,
        bioAr: d.bioAr,
        experience: d.experience,
        hourlyRate: d.hourlyRate ?? 0,
        specialties: JSON.stringify(d.specialties),
        specialtiesAr: JSON.stringify(d.specialtiesAr),
        readingType: d.readingType,
        readingTypeAr: d.readingTypeAr,
        isApproved: d.isApproved,
        approvedAt: d.isApproved ? new Date() : null,
        approvedBy: d.isApproved ? admin.id : null,
        rating: d.rating || 0,
        totalReviews: d.totalReviews || 0,
        canIssueCertificates: d.canIssueCertificates || false,
        image: d.image || null,
        introVideoUrl: d.introVideoUrl || null,
      },
      create: {
        userId: teacherUser.id,
        teacherType,
        bio: d.bio,
        bioAr: d.bioAr,
        experience: d.experience,
        hourlyRate: d.hourlyRate ?? 0,
        specialties: JSON.stringify(d.specialties),
        specialtiesAr: JSON.stringify(d.specialtiesAr),
        readingType: d.readingType,
        readingTypeAr: d.readingTypeAr,
        isApproved: d.isApproved,
        approvedAt: d.isApproved ? new Date() : null,
        approvedBy: d.isApproved ? admin.id : null,
        rating: d.rating || 0,
        totalReviews: d.totalReviews || 0,
        canIssueCertificates: d.canIssueCertificates || false,
        image: d.image || null,
        introVideoUrl: d.introVideoUrl || null,
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
    console.log('Teacher created:', teacherUser.email);
  }

  const fullTeachers = createdTeachers.filter((t) => t.teacher.teacherType === 'FULL_TEACHER');
  const schedules = [];
  if (fullTeachers.length >= 3) {
    for (let t = 0; t < Math.min(3, fullTeachers.length); t += 1) {
      const tid = fullTeachers[t].teacher.id;
      const slotsByTeacher = [
        [
          { dayOfWeek: 0, startTime: '07:00', endTime: '09:30' },
          { dayOfWeek: 2, startTime: '19:00', endTime: '22:00' },
          { dayOfWeek: 4, startTime: '19:00', endTime: '22:00' },
          { dayOfWeek: 6, startTime: '03:00', endTime: '06:00' },
        ],
        [
          { dayOfWeek: 1, startTime: '18:00', endTime: '21:00' },
          { dayOfWeek: 3, startTime: '18:00', endTime: '21:00' },
          { dayOfWeek: 5, startTime: '14:00', endTime: '18:00' },
        ],
        [
          { dayOfWeek: 0, startTime: '10:00', endTime: '13:00' },
          { dayOfWeek: 2, startTime: '10:00', endTime: '13:00' },
          { dayOfWeek: 4, startTime: '10:00', endTime: '13:00' },
          { dayOfWeek: 6, startTime: '16:00', endTime: '20:00' },
        ],
      ];
      const slots = slotsByTeacher[t] || [];
      slots.forEach((slot) => schedules.push({
        teacherId: tid,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
      }));
    }
    await prisma.schedule.createMany({ data: schedules, skipDuplicates: true });
    console.log('Schedules created (full teachers only)');
  }

  const today = new Date();
  const bookingsData = [];
  for (let i = 0; i < 20; i++) {
    const bookingDate = new Date(today);
    bookingDate.setDate(today.getDate() + i);
    const teacher = fullTeachers.length ? fullTeachers[i % fullTeachers.length] : createdTeachers[i % createdTeachers.length];
    const student = createdStudents[i % createdStudents.length];
    if (!teacher || !student) continue;
    const statuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
    const status = statuses[i % statuses.length];
    const duration = [1, 1.5, 2][i % 3];
    const price = teacher.teacher.hourlyRate * duration;
    const discount = i % 3 === 0 ? price * 0.1 : 0;
    bookingsData.push({
      studentId: student.id,
      teacherId: teacher.teacher.id,
      date: bookingDate,
      startTime: ['09:00', '10:00', '11:00', '14:00', '15:00'][i % 5],
      duration,
      status,
      price,
      discount,
      totalPrice: price - discount,
      cancelledAt: status === 'CANCELLED' ? new Date() : null,
    });
  }
  await prisma.booking.createMany({ data: bookingsData, skipDuplicates: true });
  console.log('Bookings created');

  const createdBookings = await prisma.booking.findMany({ take: 10 });
  const paymentsData = [];
  for (const booking of createdBookings) {
    if (booking.status === 'COMPLETED' || booking.status === 'CONFIRMED') {
      paymentsData.push({
        bookingId: booking.id,
        amount: booking.totalPrice,
        currency: 'USD',
        status: booking.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING',
        paymentMethod: ['stripe', 'mada', 'apple_pay'][Math.floor(Math.random() * 3)],
      });
    }
  }
  for (const p of paymentsData) {
    try {
      await prisma.payment.upsert({
        where: { bookingId: p.bookingId },
        update: {},
        create: p,
      });
    } catch (e) {
      // skip duplicate
    }
  }
  console.log('Payments created');

  const superAdminRole = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: { name: 'SUPER_ADMIN', description: 'Super administrator with all permissions' },
  });
  await prisma.role.upsert({ where: { name: 'FINANCE_ADMIN' }, update: {}, create: { name: 'FINANCE_ADMIN', description: 'Finance administrator' } });
  await prisma.role.upsert({ where: { name: 'CONTENT_ADMIN' }, update: {}, create: { name: 'CONTENT_ADMIN', description: 'Content administrator' } });
  await prisma.role.upsert({ where: { name: 'SUPPORT_ADMIN' }, update: {}, create: { name: 'SUPPORT_ADMIN', description: 'Support administrator' } });
  console.log('Roles created');

  const permissionNames = [
    'users.read', 'users.write', 'teachers.approve', 'teachers.manage', 'bookings.manage',
    'payments.view', 'payments.manage', 'content.review', 'content.read', 'content.approve',
    'reports.view', 'notifications.send', 'roles.read', 'roles.write', 'rbac.write',
    'permissions.read', 'permissions.write', 'courses.read', 'courses.write',
    'subscriptions.read', 'subscriptions.write', 'exams.create', 'exams.review',
  ];
  const createdPermissions = [];
  for (const name of permissionNames) {
    const [resource, action] = name.split('.');
    const perm = await prisma.permission.upsert({
      where: { name },
      update: {},
      create: { name, resource: resource || 'misc', action: action || 'read', description: `${action} ${resource}` },
    });
    createdPermissions.push(perm);
  }
  console.log('Permissions created');

  for (const permission of createdPermissions) {
    try {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: permission.id } },
        update: {},
        create: { roleId: superAdminRole.id, permissionId: permission.id },
      });
    } catch (e) {
      // skip
    }
  }
  const financeAdminRole = await prisma.role.findUnique({ where: { name: 'FINANCE_ADMIN' } });
  const contentAdminRole = await prisma.role.findUnique({ where: { name: 'CONTENT_ADMIN' } });
  const supportAdminRole = await prisma.role.findUnique({ where: { name: 'SUPPORT_ADMIN' } });
  if (financeAdminRole) {
    for (const p of createdPermissions.filter((x) => ['payments.view', 'payments.manage', 'reports.view'].includes(x.name))) {
      try {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: financeAdminRole.id, permissionId: p.id } },
          update: {},
          create: { roleId: financeAdminRole.id, permissionId: p.id },
        });
      } catch (e) { }
    }
  }
  if (contentAdminRole) {
    for (const p of createdPermissions.filter((x) => ['content.review', 'content.approve', 'teachers.approve'].includes(x.name))) {
      try {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: contentAdminRole.id, permissionId: p.id } },
          update: {},
          create: { roleId: contentAdminRole.id, permissionId: p.id },
        });
      } catch (e) { }
    }
  }
  if (supportAdminRole) {
    for (const p of createdPermissions.filter((x) => ['users.read', 'users.write', 'bookings.manage', 'notifications.send'].includes(x.name))) {
      try {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: supportAdminRole.id, permissionId: p.id } },
          update: {},
          create: { roleId: supportAdminRole.id, permissionId: p.id },
        });
      } catch (e) { }
    }
  }
  console.log('Role permissions assigned');

  try {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: admin.id, roleId: superAdminRole.id } },
      update: {},
      create: { userId: admin.id, roleId: superAdminRole.id },
    });
  } catch (e) { }
  console.log('Admin role assigned');

  const teacherPackagesData = [
    { name: 'Basic Plan', nameAr: '\u0627\u0644\u062E\u0637\u0629 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629', description: 'Basic subscription', descriptionAr: '\u0627\u0634\u062A\u0631\u0627\u0643 \u0623\u0633\u0627\u0633\u064A', price: 29.99, duration: 30, features: JSON.stringify(['Up to 10 students']), featuresAr: JSON.stringify(['\u062D\u062A\u0649 10 \u0637\u0644\u0627\u0628']), maxStudents: 10, maxCourses: 5, isActive: true, isPopular: false },
    { name: 'Professional Plan', nameAr: '\u0627\u0644\u062E\u0637\u0629 \u0627\u0644\u0627\u062D\u062A\u0631\u0627\u0641\u064A\u0629', description: 'Professional subscription', descriptionAr: '\u0627\u0634\u062A\u0631\u0627\u0643 \u0627\u062D\u062A\u0631\u0627\u0641\u064A', price: 59.99, duration: 30, features: JSON.stringify(['Up to 50 students']), featuresAr: JSON.stringify(['\u062D\u062A\u0649 50 \u0637\u0627\u0644\u0628\u0627']), maxStudents: 50, maxCourses: 20, isActive: true, isPopular: true },
    { name: 'Enterprise Plan', nameAr: '\u0627\u0644\u062E\u0637\u0629 \u0627\u0644\u0645\u0624\u0633\u0633\u064A\u0629', description: 'Enterprise subscription', descriptionAr: '\u0627\u0634\u062A\u0631\u0627\u0643 \u0645\u0624\u0633\u0633\u064A', price: 99.99, duration: 30, features: JSON.stringify(['Unlimited students']), featuresAr: JSON.stringify(['\u0637\u0644\u0627\u0628 \u063A\u064A\u0631 \u0645\u062D\u062F\u0648\u062F']), maxStudents: null, maxCourses: null, isActive: true, isPopular: false },
  ];
  const createdTeacherPackages = [];
  for (const pkg of teacherPackagesData) {
    const existing = await prisma.subscriptionPackage.findFirst({ where: { name: pkg.name } });
    createdTeacherPackages.push(existing || await prisma.subscriptionPackage.create({ data: pkg }));
  }
  console.log('Teacher subscription packages created');

  for (let i = 0; i < Math.min(3, createdTeachers.length); i++) {
    const teacher = createdTeachers[i];
    const pkg = createdTeacherPackages[i % createdTeacherPackages.length];
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + pkg.duration);
    try {
      await prisma.teacherSubscription.create({
        data: {
          teacherId: teacher.teacher.id,
          packageId: pkg.id,
          status: 'ACTIVE',
          startDate,
          endDate,
          autoRenew: true,
        },
      });
    } catch (e) { }
  }
  console.log('Teacher subscriptions created');

  const studentPackagesData = [
    {
      name: 'Quran Live Lite',
      nameAr: '\u0628\u0627\u0642\u0629 \u0627\u0644\u062D\u0644\u0642\u0627\u062A \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629 \u0644\u0627\u064A\u062A',
      description: '4 live sessions per month with Quran sheikhs.',
      descriptionAr: '\u0623\u0631\u0628\u0639 \u062D\u0644\u0642\u0627\u062A \u0645\u0628\u0627\u0634\u0631\u0629 \u0634\u0647\u0631\u064A\u0627 \u0645\u0639 \u0634\u064A\u0648\u062E \u0627\u0644\u0642\u0631\u0622\u0646.',
      price: 19.99,
      duration: 30,
      durationMonths: 1,
      monthlyPrice: 19.99,
      yearlyPrice: 199.99,
      maxTeachers: 1,
      features: JSON.stringify(['4 live sessions monthly', 'Session recording access']),
      featuresAr: JSON.stringify(['4 \u062D\u0644\u0642\u0627\u062A \u0645\u0628\u0627\u0634\u0631\u0629 \u0634\u0647\u0631\u064A\u0627', '\u0625\u0645\u0643\u0627\u0646\u064A\u0629 \u0631\u062C\u0648\u0639 \u0644\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062D\u0644\u0642\u0629']),
      maxBookings: 4,
      maxCourses: 2,
      isActive: true,
      isPopular: false,
    },
    {
      name: 'Quran Live Plus',
      nameAr: '\u0628\u0627\u0642\u0629 \u0627\u0644\u062D\u0644\u0642\u0627\u062A \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629 \u0628\u0644\u0633',
      description: '12 live sessions per month with priority booking slots.',
      descriptionAr: '\u0627\u062B\u0646\u062A\u0627 \u0639\u0634\u0631\u0629 \u062D\u0644\u0642\u0629 \u0645\u0628\u0627\u0634\u0631\u0629 \u0634\u0647\u0631\u064A\u0627 \u0645\u0639 \u0623\u0648\u0644\u0648\u064A\u0629 \u0627\u0644\u062D\u062C\u0632.',
      price: 49.99,
      duration: 30,
      durationMonths: 1,
      monthlyPrice: 49.99,
      yearlyPrice: 499.99,
      maxTeachers: 2,
      features: JSON.stringify(['12 live sessions monthly', 'Priority support', 'Flexible rescheduling']),
      featuresAr: JSON.stringify(['12 \u062D\u0644\u0642\u0627\u062A \u0645\u0628\u0627\u0634\u0631\u0629 \u0634\u0647\u0631\u064A\u0627', '\u062F\u0639\u0645 \u0633\u0631\u064A\u0639', '\u0645\u0631\u0648\u0646\u0629 \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062C\u062F\u0648\u0644\u0629']),
      maxBookings: 12,
      maxCourses: 5,
      isActive: true,
      isPopular: true,
    },
    {
      name: 'Quran Live Family',
      nameAr: '\u0628\u0627\u0642\u0629 \u0627\u0644\u062D\u0644\u0642\u0627\u062A \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629 \u0627\u0644\u0639\u0627\u0626\u0644\u064A\u0629',
      description: '24 live sessions monthly for family plans and multiple learners.',
      descriptionAr: '\u0623\u0631\u0628\u0639 \u0648\u0639\u0634\u0631\u0648\u0646 \u062D\u0644\u0642\u0629 \u0645\u0628\u0627\u0634\u0631\u0629 \u0634\u0647\u0631\u064A\u0627 \u0644\u062E\u0637\u0637 \u0627\u0644\u0639\u0627\u0626\u0644\u0629 \u0648\u062A\u0639\u062F\u062F \u0627\u0644\u0645\u062A\u0639\u0644\u0645\u064A\u0646.',
      price: 89.99,
      duration: 30,
      durationMonths: 1,
      monthlyPrice: 89.99,
      yearlyPrice: 899.99,
      maxTeachers: 3,
      features: JSON.stringify(['24 live sessions monthly', 'Family dashboard', 'Progress reports']),
      featuresAr: JSON.stringify(['24 \u062D\u0644\u0642\u0627\u062A \u0645\u0628\u0627\u0634\u0631\u0629 \u0634\u0647\u0631\u064A\u0627', '\u0644\u0648\u062D\u0629 \u062A\u062D\u0643\u0645 \u0639\u0627\u0626\u0644\u064A\u0629', '\u062A\u0642\u0627\u0631\u064A\u0631 \u062A\u0642\u062F\u0645']),
      maxBookings: 24,
      maxCourses: 8,
      isActive: true,
      isPopular: false,
    },
  ];
  const createdStudentPackages = [];
  for (const pkg of studentPackagesData) {
    const existing = await prisma.studentSubscriptionPackage.findFirst({ where: { name: pkg.name } });
    createdStudentPackages.push(existing || await prisma.studentSubscriptionPackage.create({ data: pkg }));
  }
  console.log('Student subscription packages created');

  for (let i = 0; i < Math.min(3, createdStudents.length); i++) {
    const student = createdStudents[i];
    const pkg = createdStudentPackages[i % createdStudentPackages.length];
    const sheikh = fullTeachers[i % fullTeachers.length];
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + pkg.duration);
    try {
      await prisma.studentSubscription.create({
        data: {
          studentId: student.id,
          teacherId: sheikh.teacher.id,
          packageId: pkg.id,
          status: 'ACTIVE',
          startDate,
          endDate,
          autoRenew: true,
        },
      });
    } catch (e) { }
  }
  console.log('Student subscriptions created');

  const courseOnlyTeachers = createdTeachers.filter((t) => t.teacher.teacherType === 'COURSE_SHEIKH');
  const createdCourses = [];
  for (let i = 0; i < 5; i++) {
    const teacherPool = courseOnlyTeachers.length > 0 ? courseOnlyTeachers : createdTeachers;
    const teacher = teacherPool[i % teacherPool.length];
    const course = await prisma.course.create({
      data: {
        title: `Quran Course ${i + 1}`,
        titleAr: `\u062F\u0648\u0631\u0629 \u0627\u0644\u0642\u0631\u0622\u0646 ${i + 1}`,
        description: `Learn Quran recitation and tajweed - Course ${i + 1}`,
        descriptionAr: `\u062A\u0639\u0644\u0645 \u062A\u0644\u0627\u0648\u0629 \u0627\u0644\u0642\u0631\u0622\u0646 \u0648\u0627\u0644\u062A\u062C\u0648\u064A\u062F`,
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
    createdCourses.push(course);

    for (let j = 0; j < 5; j++) {
      const lesson = await prisma.lesson.create({
        data: {
          courseId: course.id,
          title: `Lesson ${j + 1}`,
          titleAr: `\u0627\u0644\u062F\u0631\u0633 ${j + 1}`,
          description: `Lesson ${j + 1} description`,
          descriptionAr: `\u0648\u0635\u0641 \u0627\u0644\u062F\u0631\u0633 ${j + 1}`,
          order: j + 1,
          durationMinutes: [30, 45, 60][j % 3],
          isFree: j === 0,
        },
      });
      for (let k = 0; k < 3; k++) {
        const videoIndex = (i * 5 + j * 3 + k) % videoUrls.length;
        await prisma.video.create({
          data: {
            lessonId: lesson.id,
            title: `Video ${k + 1}`,
            titleAr: `\u0627\u0644\u0641\u064A\u062F\u064A\u0648 ${k + 1}`,
            description: `Video ${k + 1} description`,
            descriptionAr: `\u0648\u0635\u0641 \u0627\u0644\u0641\u064A\u062F\u064A\u0648 ${k + 1}`,
            videoUrl: videoUrls[videoIndex],
            thumbnailUrl: videoThumbnails[videoIndex % videoThumbnails.length],
            durationSeconds: [300, 600, 900][k],
            order: k + 1,
          },
        });
      }
    }
  }
  console.log('Courses, lessons, and videos created');

  const enrollmentsData = [];
  for (let i = 0; i < 10; i++) {
    enrollmentsData.push({
      courseId: createdCourses[i % createdCourses.length].id,
      studentId: createdStudents[i % createdStudents.length].id,
      status: 'ACTIVE',
      progress: Math.random() * 100,
    });
  }
  for (const e of enrollmentsData) {
    try {
      await prisma.courseEnrollment.upsert({
        where: { courseId_studentId: { courseId: e.courseId, studentId: e.studentId } },
        update: {},
        create: e,
      });
    } catch (err) { }
  }
  console.log('Course enrollments created');

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
  console.log('Exams and questions created');

  const certTeacher = createdTeachers.find((t) => t.teacher.canIssueCertificates);
  if (certTeacher) {
    for (let i = 0; i < Math.min(5, createdStudents.length); i++) {
      const student = createdStudents[i];
      try {
        await prisma.certificate.create({
          data: {
            studentId: student.id,
            teacherId: certTeacher.teacher.id,
            type: ['MEMORIZATION', 'RECITATION', 'TAJWEED', 'IJAZA'][i % 4],
            title: `\u0634\u0647\u0627\u062F\u0629 ${['\u062D\u0641\u0638', '\u062A\u0644\u0627\u0648\u0629', '\u062A\u062C\u0648\u064A\u062F', '\u0625\u062C\u0627\u0632\u0629'][i % 4]}`,
            description: `\u0634\u0647\u0627\u062F\u0629 \u0625\u062A\u0645\u0627\u0645`,
            status: 'ACTIVE',
            issuedAt: new Date(),
          },
        });
      } catch (e) { }
    }
    console.log('Certificates created');
  }

  console.log('\nSeeding completed.');
  console.log('Test credentials:');
  console.log('  Admin:   admin@shaykhi.com / admin123');
  console.log('  Student: student1@shaykhi.com / student123');
  console.log('  Teacher: teacher1@shaykhi.com / teacher123');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
