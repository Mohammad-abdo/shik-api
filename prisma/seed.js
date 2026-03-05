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

function normalizeTime(value) {
  return String(value || '').slice(0, 5);
}

function scheduleKey(teacherId, dayOfWeek, startTime, endTime) {
  return `${teacherId}|${dayOfWeek}|${normalizeTime(startTime)}|${normalizeTime(endTime)}`;
}

async function ensureTeacherSchedules(teacherId, desiredSlots) {
  const existing = await prisma.schedule.findMany({
    where: { teacherId },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });

  const byKey = new Map();
  for (const row of existing) {
    const key = scheduleKey(row.teacherId, row.dayOfWeek, row.startTime, row.endTime);
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(row);
  }

  for (const rows of byKey.values()) {
    if (rows.length <= 1) continue;
    const [keeper, ...duplicates] = rows;
    if (!keeper.isActive) {
      await prisma.schedule.update({
        where: { id: keeper.id },
        data: { isActive: true },
      });
    }
    if (duplicates.length > 0) {
      await prisma.schedule.updateMany({
        where: { id: { in: duplicates.map((d) => d.id) } },
        data: { isActive: false },
      });
    }
  }

  const existingAfterDedupe = await prisma.schedule.findMany({
    where: { teacherId },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });

  const firstByKey = new Map();
  for (const row of existingAfterDedupe) {
    const key = scheduleKey(row.teacherId, row.dayOfWeek, row.startTime, row.endTime);
    if (!firstByKey.has(key)) firstByKey.set(key, row);
  }

  for (const slot of desiredSlots) {
    const key = scheduleKey(teacherId, slot.dayOfWeek, slot.startTime, slot.endTime);
    const matched = firstByKey.get(key);
    if (matched) {
      if (!matched.isActive) {
        await prisma.schedule.update({
          where: { id: matched.id },
          data: { isActive: true },
        });
      }
      continue;
    }

    const created = await prisma.schedule.create({
      data: {
        teacherId,
        dayOfWeek: slot.dayOfWeek,
        startTime: normalizeTime(slot.startTime),
        endTime: normalizeTime(slot.endTime),
        isActive: true,
      },
    });
    firstByKey.set(key, created);
  }
}

async function main() {
  console.log('Seeding database...');

  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@shaykhi.com' },
    update: { role: 'SUPER_ADMIN' },
    create: {
      email: 'admin@shaykhi.com',
      password: adminPassword,
      firstName: 'Admin',
      firstNameAr: '\u0645\u062F\u064A\u0631',
      lastName: 'User',
      lastNameAr: '\u0627\u0644\u0646\u0638\u0627\u0645',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
      phone: '+201000000000',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
    },
  });
  console.log('Super Admin user created:', admin.email, '(role: SUPER_ADMIN)');

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
      await ensureTeacherSchedules(tid, slots);
    }
    console.log('Schedules synced (full teachers only, no duplicate times)');
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
        currency: 'EGP',
        status: booking.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING',
        paymentMethod: 'FAWRY',
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

  // ── BookingSessions (slots) for ALL bookings, then live Session only for CONFIRMED/COMPLETED ─
  const platformFee = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '20');
  const allBookingsForSlots = await prisma.booking.findMany({
    where: { teacher: { teacherType: 'FULL_TEACHER' } },
    include: { teacher: true },
    orderBy: { date: 'asc' },
  });
  const bookingsForSessions = allBookingsForSlots.filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED');

  const SESSIONS_PER_BOOKING = 4; // number of lesson slots per booking
  let sessionLoopIndex = 0;
  // First pass: create BookingSessions (slots) for every booking so each has many sessions
  for (const booking of allBookingsForSlots) {
    // booking.duration is in hours (1, 1.5, 2); convert to minutes (min 120)
    const durationMinutes = Math.max(120, Math.round((booking.duration || 2) * 60));
    const slotStatus = booking.status === 'COMPLETED' ? 'COMPLETED' : booking.status === 'CANCELLED' ? 'CANCELLED' : booking.status === 'CONFIRMED' ? 'CONFIRMED' : 'PENDING';
    let firstBookingSession = null;

    for (let slotIndex = 0; slotIndex < SESSIONS_PER_BOOKING; slotIndex++) {
      const scheduledDate = new Date(booking.date);
      scheduledDate.setDate(scheduledDate.getDate() + slotIndex);
      const hour = 9 + (sessionLoopIndex * SESSIONS_PER_BOOKING + slotIndex) % 12;
      const startTime = `${String(hour).padStart(2, '0')}:00`;
      const endTime = (() => {
        const [h, m] = startTime.split(':').map(Number);
        const totalM = (h * 60 + (m || 0)) + durationMinutes;
        return `${String(Math.floor(totalM / 60) % 24).padStart(2, '0')}:${String(totalM % 60).padStart(2, '0')}`;
      })();
      const dayOfWeek = scheduledDate.getDay();

      let schedule = await prisma.schedule.findFirst({
        where: { teacherId: booking.teacherId, dayOfWeek, startTime, isActive: true },
      });
      if (!schedule) {
        schedule = await prisma.schedule.create({
          data: { teacherId: booking.teacherId, dayOfWeek, startTime, endTime, isActive: true },
        });
      }

      let bookingSession = await prisma.bookingSession.findFirst({
        where: { bookingId: booking.id, orderIndex: slotIndex },
      });
      if (!bookingSession) {
        try {
          bookingSession = await prisma.bookingSession.create({
            data: {
              bookingId: booking.id,
              scheduleId: schedule.id,
              scheduledDate,
              startTime,
              endTime,
              orderIndex: slotIndex,
              status: slotStatus,
            },
          });
        } catch (e) {
          continue;
        }
      }
      if (slotIndex === 0) firstBookingSession = bookingSession;
    }

    sessionLoopIndex += 1;
    if (!firstBookingSession) continue;
    // Only create live Session (and wallet credit) for CONFIRMED/COMPLETED bookings
    if (booking.status !== 'CONFIRMED' && booking.status !== 'COMPLETED') continue;

    const existing = await prisma.session.findUnique({ where: { bookingSessionId: firstBookingSession.id } });
    if (existing) continue;

    const [hh, mm] = firstBookingSession.startTime.split(':').map(Number);
    const startedAt = new Date(firstBookingSession.scheduledDate);
    startedAt.setHours(hh, mm, 0, 0);
    const endedAt = new Date(startedAt.getTime() + durationMinutes * 60 * 1000);
    const roomId = `room_${firstBookingSession.id}_seed`;

    const sessionData = {
      bookingSessionId: firstBookingSession.id,
      type: 'VIDEO',
      roomId,
      startedAt,
      duration: durationMinutes,
    };
    if (booking.status === 'COMPLETED') sessionData.endedAt = endedAt;

    try {
      await prisma.session.create({ data: sessionData });
    } catch (e) {
      continue;
    }

    // Credit wallet for COMPLETED sessions
    if (booking.status === 'COMPLETED' && booking.teacher?.hourlyRate > 0) {
      const hours = durationMinutes / 60;
      const gross = hours * booking.teacher.hourlyRate;
      const fee = (gross * platformFee) / 100;
      const teacherEarning = gross - fee;

      try {
        // Ensure wallet exists
        let wallet = await prisma.teacherWallet.findUnique({ where: { teacherId: booking.teacherId } });
        if (!wallet) {
          wallet = await prisma.teacherWallet.create({
            data: { teacherId: booking.teacherId, balance: 0, pendingBalance: 0, totalEarned: 0, totalHours: 0 },
          });
        }

        await prisma.teacherWallet.update({
          where: { id: wallet.id },
          data: {
            balance: { increment: teacherEarning },
            totalEarned: { increment: teacherEarning },
            totalHours: { increment: hours },
          },
        });

        await prisma.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'SESSION_EARNING',
            amount: teacherEarning,
            description: `Seed: session earning ${hours.toFixed(2)}h × ${booking.teacher.hourlyRate}/h (booking ${booking.id})`,
            bookingId: booking.id,
          },
        });

        // Record platform revenue (avoid duplicate)
        const existingRev = await prisma.platformRevenue.findUnique({ where: { bookingId: booking.id } });
        if (!existingRev && gross > 0) {
          await prisma.platformRevenue.create({
            data: { bookingId: booking.id, amount: fee, teacherEarning },
          });
        }
      } catch (e) {
        // skip wallet errors silently in seed
      }
    }
  }
  console.log('Sessions created and wallet credits applied for COMPLETED sessions');

  // Seed session details (memorization, revision, report) for ALL COMPLETED sessions — full details
  const surahs = [
    { name: 'Al-Fatiha', nameAr: 'الفاتحة', num: 1 }, { name: 'Al-Baqarah', nameAr: 'البقرة', num: 2 },
    { name: 'Al-Imran', nameAr: 'آل عمران', num: 3 }, { name: 'An-Nisa', nameAr: 'النساء', num: 4 },
    { name: 'Al-Maidah', nameAr: 'المائدة', num: 5 }, { name: 'Al-Anam', nameAr: 'الأنعام', num: 6 },
  ];
  const revisionTypes = [
    { type: 'CLOSE', range: 'SURAH', fromS: 'Al-Fatiha', toS: 'Al-Baqarah', fromJ: null, toJ: null, fromQ: null, toQ: null, notesAr: 'مراجعة قريبة من الفاتحة إلى البقرة' },
    { type: 'FAR', range: 'JUZ', fromS: null, toS: null, fromJ: 1, toJ: 2, fromQ: null, toQ: null, notesAr: 'مراجعة بعيدة من الجزء الأول إلى الثاني' },
    { type: 'CLOSE', range: 'QUARTER', fromS: null, toS: null, fromJ: null, toJ: null, fromQ: '1', toQ: '2', notesAr: 'مراجعة ربعين متتاليين' },
  ];
  const reportTemplates = [
    'تقرير الجلسة: الطالب أتم حفظ الصفحة الأولى من البقرة بإتقان. التلاوة سليمة والمخارج واضحة. يُنصح بمراجعة يومية.',
    'تقييم الجلسة: أداء ممتاز في المراجعة القريبة. الحفظ ثابت. نوصي بزيادة عدد الصفحات الجديدة في الجلسة القادمة.',
    'ملخص الجلسة: تمت مراجعة جزء كامل. الطالب جاهز للانتقال إلى الحفظ الجديد. تقييم ٥/٥.',
  ];
  const completedSessions = await prisma.session.findMany({
    where: { endedAt: { not: null } },
    include: { bookingSession: { include: { booking: { select: { studentId: true, teacherId: true } } } } },
  });
  for (let idx = 0; idx < completedSessions.length; idx++) {
    const sess = completedSessions[idx];
    const booking = sess.bookingSession?.booking;
    if (!booking) continue;
    const { studentId, teacherId } = booking;
    const s1 = surahs[idx % surahs.length];
    const s2 = surahs[(idx + 1) % surahs.length];
    try {
      await prisma.sessionMemorization.create({
        data: {
          sessionId: sess.id,
          surahName: s1.name,
          surahNameAr: s1.nameAr,
          surahNumber: s1.num,
          fromAyah: 1,
          toAyah: Math.min(10 + (idx % 5), 20),
          isFullSurah: s1.num === 1,
          notes: `Seed: حفظ جديد من ${s1.name} (${s1.nameAr}).`,
        },
      });
    } catch (e) { /* skip if exists */ }
    if (idx % 2 === 0) {
      try {
        await prisma.sessionMemorization.create({
          data: {
            sessionId: sess.id,
            surahName: s2.name,
            surahNameAr: s2.nameAr,
            surahNumber: s2.num,
            fromAyah: 1,
            toAyah: 5,
            isFullSurah: false,
            notes: `Seed: مراجعة حفظ ${s2.nameAr}.`,
          },
        });
      } catch (e) { /* skip */ }
    }
    const rev = revisionTypes[idx % revisionTypes.length];
    try {
      await prisma.sessionRevision.create({
        data: {
          sessionId: sess.id,
          revisionType: rev.type,
          rangeType: rev.range,
          fromSurah: rev.fromS,
          toSurah: rev.toS,
          fromJuz: rev.fromJ,
          toJuz: rev.toJ,
          fromQuarter: rev.fromQ,
          toQuarter: rev.toQ,
          notes: rev.notesAr,
        },
      });
    } catch (e) { /* skip */ }
    try {
      await prisma.sessionReport.upsert({
        where: { sessionId: sess.id },
        update: {},
        create: {
          sessionId: sess.id,
          teacherId,
          studentId,
          content: reportTemplates[idx % reportTemplates.length],
          rating: 4 + (idx % 2),
        },
      });
    } catch (e) { /* skip */ }
  }
  console.log('Session memorization, revision, and report seed created (all completed sessions)');

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
  const fixedPermissions = [
    { name: 'VIEW_DASHBOARD', resource: 'dashboard', action: 'view', description: 'عرض لوحة التحكم' },
    { name: 'MANAGE_USERS', resource: 'users', action: 'manage', description: 'إدارة المستخدمين' },
    { name: 'MANAGE_BOOKINGS', resource: 'bookings', action: 'manage', description: 'إدارة الحجوزات' },
    { name: 'MANAGE_COURSES', resource: 'courses', action: 'manage', description: 'إدارة الدورات' },
    { name: 'MANAGE_REVIEWS', resource: 'reviews', action: 'manage', description: 'إدارة التقييمات' },
    { name: 'MANAGE_NOTIFICATIONS', resource: 'notifications', action: 'manage', description: 'إدارة الإشعارات' },
    { name: 'VIEW_REPORTS', resource: 'reports', action: 'view', description: 'عرض التقارير' },
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
  for (const p of fixedPermissions) {
    const perm = await prisma.permission.upsert({
      where: { name: p.name },
      update: {},
      create: { name: p.name, resource: p.resource, action: p.action, description: p.description },
    });
    if (!createdPermissions.find((x) => x.id === perm.id)) createdPermissions.push(perm);
  }
  console.log('Permissions created (including VIEW_DASHBOARD, MANAGE_*, VIEW_REPORTS)');

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

  console.log('Teacher course subscriptions seed skipped (subscriptions are student live-session only)');

  // UPDATED: Student subscription packages with removed fields (monthlyPrice, yearlyPrice, maxTeachers, maxBookings, maxCourses)
  const studentPackagesData = [
    {
      name: 'Quran Live Lite',
      nameAr: '\u0628\u0627\u0642\u0629 \u0627\u0644\u062D\u0644\u0642\u0627\u062A \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629 \u0644\u0627\u064A\u062A',
      description: '4 live sessions per month with Quran sheikhs. Ideal for beginners.',
      descriptionAr: '\u0623\u0631\u0628\u0639 \u062D\u0644\u0642\u0627\u062A \u0645\u0628\u0627\u0634\u0631\u0629 \u0634\u0647\u0631\u064A\u0627 \u0645\u0639 \u0634\u064A\u0648\u062E \u0627\u0644\u0642\u0631\u0622\u0646. \u0645\u062B\u0627\u0644\u064A\u0629 \u0644\u0644\u0645\u0628\u062A\u062F\u0626\u064A\u0646.',
      packageType: 'monthly',
      price: 19.99,
      period: 30,
      totalSessions: 4,
      weeklyFrequency: 1,
      monthlyPrice: 19.99,
      yearlyPrice: 199.99,
      packageType: 'monthly',
      period: 1,
      features: JSON.stringify(['4 live sessions monthly', 'Session recording access', 'Progress reports']),
      featuresAr: JSON.stringify(['4 \u062D\u0644\u0642\u0627\u062A \u0645\u0628\u0627\u0634\u0631\u0629 \u0634\u0647\u0631\u064A\u0627', '\u0625\u0645\u0643\u0627\u0646\u064A\u0629 \u0631\u062C\u0648\u0639 \u0644\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062D\u0644\u0642\u0629', '\u062A\u0642\u0627\u0631\u064A\u0631 \u0627\u0644\u062A\u0642\u062F\u0645']),
      isActive: true,
      isPopular: false,
    },
    {
      name: 'Quran Live Plus',
      nameAr: '\u0628\u0627\u0642\u0629 \u0627\u0644\u062D\u0644\u0642\u0627\u062A \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629 \u0628\u0644\u0633',
      description: '12 live sessions per month with priority booking slots. Best value.',
      descriptionAr: '\u0627\u062B\u0646\u062A\u0627 \u0639\u0634\u0631\u0629 \u062D\u0644\u0642\u0629 \u0645\u0628\u0627\u0634\u0631\u0629 \u0634\u0647\u0631\u064A\u0627 \u0645\u0639 \u0623\u0648\u0644\u0648\u064A\u0629 \u0627\u0644\u062D\u062C\u0632. \u0623\u0641\u0636\u0644 \u0627\u0644\u0623\u0633\u0639\u0627\u0631.',
      packageType: 'monthly',
      price: 49.99,
      period: 30,
      totalSessions: 12,
      weeklyFrequency: 3,
      monthlyPrice: 49.99,
      yearlyPrice: 499.99,
      packageType: 'monthly',
      period: 1,
      features: JSON.stringify(['12 live sessions monthly', 'Priority support', 'Flexible rescheduling', 'Memorization & revision reports']),
      featuresAr: JSON.stringify(['12 \u062D\u0644\u0642\u0627\u062A \u0645\u0628\u0627\u0634\u0631\u0629 \u0634\u0647\u0631\u064A\u0627', '\u062F\u0639\u0645 \u0633\u0631\u064A\u0639', '\u0645\u0631\u0648\u0646\u0629 \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062C\u062F\u0648\u0644\u0629', '\u062A\u0642\u0627\u0631\u064A\u0631 \u062D\u0641\u0638 \u0648\u0645\u0631\u0627\u062C\u0639\u0629']),
      isActive: true,
      isPopular: true,
    },
    {
      name: 'Quran Live Family',
      nameAr: '\u0628\u0627\u0642\u0629 \u0627\u0644\u062D\u0644\u0642\u0627\u062A \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629 \u0627\u0644\u0639\u0627\u0626\u0644\u064A\u0629',
      description: '24 live sessions monthly for family plans and multiple learners. Full support.',
      descriptionAr: '\u0623\u0631\u0628\u0639 \u0648\u0639\u0634\u0631\u0648\u0646 \u062D\u0644\u0642\u0629 \u0645\u0628\u0627\u0634\u0631\u0629 \u0634\u0647\u0631\u064A\u0627 \u0644\u062E\u0637\u0637 \u0627\u0644\u0639\u0627\u0626\u0644\u0629 \u0648\u062A\u0639\u062F\u062F \u0627\u0644\u0645\u062A\u0639\u0644\u0645\u064A\u0646. \u062F\u0639\u0645 \u0643\u0627\u0645\u0644.',
      packageType: 'monthly',
      price: 89.99,
      period: 30,
      totalSessions: 24,
      weeklyFrequency: 6,
      monthlyPrice: 89.99,
      yearlyPrice: 899.99,
      packageType: 'monthly',
      period: 1,
      features: JSON.stringify(['24 live sessions monthly', 'Family dashboard', 'Progress reports', 'Dedicated support']),
      featuresAr: JSON.stringify(['24 \u062D\u0644\u0642\u0627\u062A \u0645\u0628\u0627\u0634\u0631\u0629 \u0634\u0647\u0631\u064A\u0627', '\u0644\u0648\u062D\u0629 \u062A\u062D\u0643\u0645 \u0639\u0627\u0626\u0644\u064A\u0629', '\u062A\u0642\u0627\u0631\u064A\u0631 \u062A\u0642\u062F\u0645', '\u062F\u0639\u0645 \u0645\u062E\u0635\u0635']),
      isActive: true,
      isPopular: false,
    },
    // Add a yearly package example
    {
      name: 'Quran Live Yearly Premium',
      nameAr: '\u0628\u0627\u0642\u0629 \u0627\u0644\u062D\u0644\u0642\u0627\u062A \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629 \u0627\u0644\u0633\u0646\u0648\u064A\u0629',
      description: '12 live sessions per month with annual commitment. Best savings.',
      descriptionAr: '\u0627\u062B\u0646\u062A\u0627 \u0639\u0634\u0631\u0629 \u062D\u0644\u0642\u0629 \u0645\u0628\u0627\u0634\u0631\u0629 \u0634\u0647\u0631\u064A\u0627 \u0628\u0627\u0644\u062A\u0632\u0627\u0645 \u0633\u0646\u0648\u064A. \u0623\u0641\u0636\u0644 \u062A\u0648\u0641\u064A\u0631.',
      packageType: 'yearly',
      price: 499.99,
      period: 365,
      totalSessions: 144, // 12 sessions × 12 months
      features: JSON.stringify(['12 live sessions monthly', 'Priority support', 'Best value pricing', 'Annual progress report', 'Flexible scheduling']),
      featuresAr: JSON.stringify(['12 \u062D\u0644\u0642\u0627\u062A \u0645\u0628\u0627\u0634\u0631\u0629 \u0634\u0647\u0631\u064A\u0627', '\u062F\u0639\u0645 \u0645\u0645\u064A\u0632', '\u0623\u0641\u0636\u0644 \u0633\u0639\u0631', '\u062A\u0642\u0631\u064A\u0631 \u062A\u0642\u062F\u0645 \u0633\u0646\u0648\u064A', '\u062C\u062F\u0648\u0644\u0629 \u0645\u0631\u0646\u0629']),
      isActive: true,
      isPopular: true,
    },
  ];

  const createdStudentPackages = [];
  for (const pkg of studentPackagesData) {
    const existing = await prisma.studentSubscriptionPackage.findFirst({ where: { name: pkg.name } });
    if (existing) {
      const updated = await prisma.studentSubscriptionPackage.update({
        where: { id: existing.id },
        data: pkg,
      });
      createdStudentPackages.push(updated);
    } else {
      createdStudentPackages.push(await prisma.studentSubscriptionPackage.create({ data: pkg }));
    }
  }
  console.log('Student subscription packages created');

  // إنشاء اشتراك باقة لكل زوج (طالب، شيخ) حتى يكون لكل حجز باقة مرتبطة — لا يبقى أي حجز بدون باقة
  const subscriptionByStudentTeacher = new Map();
  for (let si = 0; si < createdStudents.length; si++) {
    for (let ti = 0; ti < fullTeachers.length; ti++) {
      const student = createdStudents[si];
      const sheikh = fullTeachers[ti];
      const key = `${student.id}|${sheikh.teacher.id}`;
      let sub = await prisma.studentSubscription.findFirst({
        where: { studentId: student.id, teacherId: sheikh.teacher.id },
      });
      if (!sub) {
        const pkg = createdStudentPackages[(si + ti) % createdStudentPackages.length];
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + (pkg.period || 30));
        sub = await prisma.studentSubscription.create({
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
      }
      subscriptionByStudentTeacher.set(key, sub.id);
    }
  }
  console.log('Student subscriptions created (one per student–sheikh pair so every booking can be linked)');

  // ─── Create payments for student subscriptions so /my-students returns data ──
  const allStudentSubs = await prisma.studentSubscription.findMany({
    where: { status: 'ACTIVE' },
    include: { package: true, student: true },
  });
  for (const sub of allStudentSubs) {
    const existingPayment = await prisma.payment.findFirst({ where: { subscriptionId: sub.id } });
    if (existingPayment) {
      if (!sub.paymentId) {
        await prisma.studentSubscription.update({ where: { id: sub.id }, data: { paymentId: existingPayment.id } });
      }
      continue;
    }
    const payment = await prisma.payment.create({
      data: {
        paymentType: 'SUBSCRIPTION',
        userId: sub.studentId,
        subscriptionId: sub.id,
        amount: sub.package?.price ?? 99,
        currency: 'EGP',
        status: 'COMPLETED',
        paymentMethod: 'fawry',
      },
    });
    await prisma.studentSubscription.update({ where: { id: sub.id }, data: { paymentId: payment.id } });
  }
  console.log('Payments linked to all student subscriptions (COMPLETED)');

  // Create sample schedule reservations for active student subscriptions
  const activeStudentSubscriptions = await prisma.studentSubscription.findMany({
    where: { status: 'ACTIVE' },
    include: {
      teacher: {
        include: {
          schedules: { where: { isActive: true }, orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
        },
      },
    },
    take: 10,
  });

  const reservationSeedData = [];
  for (const sub of activeStudentSubscriptions) {
    const primarySchedule = sub.teacher?.schedules?.[0];
    if (!primarySchedule) continue;

    const cursor = new Date(sub.startDate);
    let createdForSub = 0;
    while (cursor <= sub.endDate && createdForSub < 4) {
      if (cursor.getDay() === primarySchedule.dayOfWeek) {
        reservationSeedData.push({
          scheduleId: primarySchedule.id,
          studentId: sub.studentId,
          subscriptionId: sub.id,
          reservationDate: new Date(cursor),
          startTime: primarySchedule.startTime,
          endTime: primarySchedule.endTime,
        });
        createdForSub += 1;
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  if (reservationSeedData.length > 0) {
    await prisma.scheduleReservation.createMany({ data: reservationSeedData, skipDuplicates: true });
  }
  console.log('Schedule reservations created');

  // ربط كل حجز بباقة اشتراك — لا يبقى أي حجز بدون subscriptionId و type SUBSCRIPTION
  const allBookings = await prisma.booking.findMany({ select: { id: true, studentId: true, teacherId: true } });
  let linkedCount = 0;
  for (const b of allBookings) {
    const subId = subscriptionByStudentTeacher.get(`${b.studentId}|${b.teacherId}`);
    if (subId) {
      await prisma.booking.update({
        where: { id: b.id },
        data: { subscriptionId: subId, type: 'SUBSCRIPTION' },
      });
      linkedCount += 1;
    }
  }
  console.log(`All bookings linked to a package: ${linkedCount}/${allBookings.length} (type SUBSCRIPTION)`);

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

  // ── CourseTeacher join records (so getMyCourses returns sheikhs via courseTeachers) ──
  for (let i = 0; i < createdCourses.length; i++) {
    const course = createdCourses[i];
    const primaryTeacher = createdTeachers.find(t => t.teacher.id === course.teacherId);
    if (primaryTeacher) {
      try {
        await prisma.courseTeacher.upsert({
          where: { courseId_teacherId: { courseId: course.id, teacherId: primaryTeacher.teacher.id } },
          update: {},
          create: { courseId: course.id, teacherId: primaryTeacher.teacher.id },
        });
      } catch (_) {}
    }
    const secondTeacher = createdTeachers[(i + 1) % createdTeachers.length];
    if (secondTeacher && secondTeacher.teacher.id !== course.teacherId) {
      try {
        await prisma.courseTeacher.upsert({
          where: { courseId_teacherId: { courseId: course.id, teacherId: secondTeacher.teacher.id } },
          update: {},
          create: { courseId: course.id, teacherId: secondTeacher.teacher.id },
        });
      } catch (_) {}
    }
  }
  console.log('CourseTeacher join records created');

  // ── Enroll every student in multiple courses (varied progress) ──
  const enrollmentsData = [];
  for (let si = 0; si < createdStudents.length; si++) {
    for (let ci = 0; ci < createdCourses.length; ci++) {
      const progressTiers = [0.0, 0.25, 0.5, 0.75, 1.0];
      const progress = progressTiers[(si + ci) % progressTiers.length];
      const isCompleted = progress >= 1.0;
      enrollmentsData.push({
        courseId: createdCourses[ci].id,
        studentId: createdStudents[si].id,
        status: isCompleted ? 'COMPLETED' : 'ACTIVE',
        progress,
        completedAt: isCompleted ? new Date() : null,
      });
    }
  }
  for (const e of enrollmentsData) {
    try {
      await prisma.courseEnrollment.upsert({
        where: { courseId_studentId: { courseId: e.courseId, studentId: e.studentId } },
        update: { progress: e.progress, status: e.status, completedAt: e.completedAt },
        create: e,
      });
    } catch (err) { }
  }
  console.log(`Course enrollments created: ${enrollmentsData.length} (every student × every course)`);

  // ── VideoProgress for all enrolled students (realistic watch data) ──
  const allEnrollments = await prisma.courseEnrollment.findMany({
    include: {
      course: {
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            include: { videos: { orderBy: { order: 'asc' } } },
          },
        },
      },
    },
  });

  let vpCreated = 0;
  for (const enrollment of allEnrollments) {
    const { studentId, courseId, progress, course } = enrollment;
    const allVideos = (course.lessons || []).flatMap(l => (l.videos || []).map(v => ({ ...v, lessonId: l.id })));
    if (allVideos.length === 0) continue;

    const completedCount = Math.round(progress * allVideos.length);
    for (let vi = 0; vi < allVideos.length; vi++) {
      const video = allVideos[vi];
      const isCompleted = vi < completedCount;
      const isWatching = vi === completedCount;
      if (!isCompleted && !isWatching) continue;

      const watchProg = isCompleted ? 100 : Math.floor(Math.random() * 70 + 10);
      const watchSec = isCompleted ? video.durationSeconds : Math.floor(video.durationSeconds * watchProg / 100);

      try {
        await prisma.videoProgress.upsert({
          where: { userId_videoId: { userId: studentId, videoId: video.id } },
          update: {
            status: isCompleted ? 'COMPLETED' : 'WATCHING',
            watchProgress: watchProg,
            watchDurationSeconds: watchSec,
            completedAt: isCompleted ? new Date() : null,
          },
          create: {
            userId: studentId,
            videoId: video.id,
            lessonId: video.lessonId,
            courseId,
            status: isCompleted ? 'COMPLETED' : 'WATCHING',
            watchProgress: watchProg,
            watchDurationSeconds: watchSec,
            startedAt: new Date(Date.now() - (allVideos.length - vi) * 86400000),
            completedAt: isCompleted ? new Date() : null,
          },
        });
        vpCreated++;
      } catch (_) {}
    }
  }
  console.log(`VideoProgress records created: ${vpCreated}`);

  // Seed reviews (BOOKING for completed bookings, plus sample SHEIKH and COURSE reviews)
  const bookingReviewComments = [
    'Great session, very clear explanation of Tajweed rules.',
    'الشيخ ممتاز في الشرح والمراجعة. جلسة مفيدة جداً.',
    'Patient and professional. My recitation improved a lot.',
    'تعامل راقٍ ومتابعة أسبوعية منظمة. أنصح بالحجز.',
    'Best Quran teacher I have had. Highly recommend.',
    'جلسات منظمة وحفظ مع مراجعة مستمرة.',
  ];
  const completedBookings = await prisma.booking.findMany({
    where: { status: 'COMPLETED' },
    select: { id: true, studentId: true, teacherId: true },
  });
  let reviewsCreated = 0;
  for (let i = 0; i < completedBookings.length; i++) {
    const b = completedBookings[i];
    try {
      const existing = await prisma.review.findFirst({ where: { bookingId: b.id } });
      if (existing) continue;
      await prisma.review.create({
        data: {
          userId: b.studentId,
          type: 'BOOKING',
          sheikhId: b.teacherId,
          bookingId: b.id,
          rating: 3 + (i % 3),
          comment: bookingReviewComments[i % bookingReviewComments.length],
        },
      });
      reviewsCreated++;
    } catch (e) {
      // skip duplicates or missing user
    }
  }
  const fullTeachersForReviews = createdTeachers.filter((t) => t.teacher.teacherType === 'FULL_TEACHER');
  for (let i = 0; i < Math.min(3, fullTeachersForReviews.length); i++) {
    const sheikh = fullTeachersForReviews[i].teacher;
    const student = createdStudents[i % createdStudents.length];
    try {
      await prisma.review.create({
        data: {
          userId: student.id,
          type: 'SHEIKH',
          sheikhId: sheikh.id,
          rating: 4 + (i % 2),
          comment: i === 0 ? 'Excellent sheikh for memorization and Tajweed.' : (i === 1 ? 'مدرس متميز. أنصح بالتعلم معه.' : 'Very knowledgeable and patient.'),
        },
      });
      reviewsCreated++;
    } catch (e) { /* skip */ }
  }
  for (let i = 0; i < Math.min(3, createdCourses.length); i++) {
    const course = createdCourses[i];
    const student = createdStudents[i % createdStudents.length];
    try {
      await prisma.review.create({
        data: {
          userId: student.id,
          type: 'COURSE',
          courseId: course.id,
          rating: 4 + (i % 2),
          comment: i === 0 ? 'Clear lessons and good structure.' : (i === 1 ? 'دورة منظمة ومفيدة.' : 'Worth the time. Recommended.'),
        },
      });
      reviewsCreated++;
    } catch (e) { /* skip */ }
  }
  console.log(`Reviews seeded: ${reviewsCreated} (BOOKING + SHEIKH + COURSE)`);

  // ── Notifications seed (Admin, Sheikh, Student) ─────────────────────────────
  const notificationSeedData = [];
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

  // For Admin
  notificationSeedData.push(
    { userId: admin.id, type: 'BOOKING_REQUEST', title: 'طلب حجز جديد', message: 'طالب جديد يطلب حجز جلسة مع الشيخ عبدالرحمن. يرجى المراجعة.', relatedId: createdBookings[0]?.id, isRead: false, createdAt: now, sentById: createdStudents[0]?.id },
    { userId: admin.id, type: 'REVIEW_RECEIVED', title: 'تقييم جديد', message: 'تم إضافة تقييم جديد على منصة Shaykhi.', relatedId: null, isRead: true, readAt: oneDayAgo, createdAt: twoDaysAgo, sentById: createdStudents[0]?.id },
    { userId: admin.id, type: 'COURSE_CREATED', title: 'دورة جديدة', message: 'تم إنشاء دورة جديدة: دورة القرآن 1.', relatedId: createdCourses[0]?.id, isRead: false, createdAt: oneDayAgo, sentById: admin.id },
    { userId: admin.id, type: 'SYSTEM', title: 'تحديث النظام', message: 'تم تحديث المنصة بنجاح. لا يلزم أي إجراء.', relatedId: null, isRead: true, readAt: now, createdAt: twoDaysAgo, sentById: null }
  );

  // For first Sheikh (teacher user)
  if (fullTeachers.length > 0) {
    const sheikhUser = fullTeachers[0].user;
    notificationSeedData.push(
      { userId: sheikhUser.id, type: 'BOOKING_REQUEST', title: 'طلب حجز جديد', message: 'الطالب أحمد محمد يطلب حجز جلسة معك غداً الساعة 09:00.', relatedId: createdBookings[0]?.id, isRead: false, createdAt: now, sentById: createdStudents[0]?.id },
      { userId: sheikhUser.id, type: 'BOOKING_CONFIRMED', title: 'تم تأكيد الحجز', message: 'تم تأكيد حجز جلسة مع فاطمة علي.', relatedId: createdBookings[1]?.id, isRead: true, readAt: oneDayAgo, createdAt: twoDaysAgo, sentById: admin.id },
      { userId: sheikhUser.id, type: 'REVIEW_RECEIVED', title: 'تقييم جديد من طالب', message: 'تقييمك: ممتاز في الشرح والمراجعة. جلسة مفيدة جداً.', relatedId: null, isRead: false, createdAt: oneDayAgo, sentById: createdStudents[0]?.id },
      { userId: sheikhUser.id, type: 'SESSION_REMINDER', title: 'تذكير بجلسة', message: 'جلسة مع أحمد محمد غداً الساعة 10:00. لا تنسَ الحضور.', relatedId: createdBookings[0]?.id, isRead: false, createdAt: now, sentById: null }
    );
  }

  // For first Student
  if (createdStudents.length > 0) {
    const student = createdStudents[0];
    notificationSeedData.push(
      { userId: student.id, type: 'BOOKING_CONFIRMED', title: 'تم تأكيد حجزك', message: 'تم تأكيد حجز جلستك مع الشيخ عبدالرحمن المصري.', relatedId: createdBookings[1]?.id, isRead: false, createdAt: now, sentById: admin.id },
      { userId: student.id, type: 'BOOKING_REJECTED', title: 'تم رفض الحجز', message: 'عذراً، تم رفض حجزك لليوم المطلوب. يرجى اختيار وقت آخر.', relatedId: null, isRead: true, readAt: oneDayAgo, createdAt: twoDaysAgo, sentById: fullTeachers[0]?.user?.id },
      { userId: student.id, type: 'PAYMENT_RECEIVED', title: 'تم استلام الدفع', message: 'تم استلام دفعتك بنجاح. شكراً لاستخدامك منصة Shaykhi.', relatedId: null, isRead: false, createdAt: oneDayAgo, sentById: null },
      { userId: student.id, type: 'SYSTEM', title: 'مرحباً بك', message: 'مرحباً بك في منصة Shaykhi. استمتع بتعلم القرآن مع أفضل المشايخ.', relatedId: null, isRead: true, readAt: twoDaysAgo, createdAt: twoDaysAgo, sentById: null }
    );
  }

  for (const n of notificationSeedData) {
    try {
      if (!n.userId) continue;
      await prisma.notification.create({
        data: {
          userId: n.userId,
          type: n.type,
          title: n.title,
          message: n.message,
          relatedId: n.relatedId ?? null,
          isRead: n.isRead ?? false,
          readAt: n.isRead ? (n.readAt || now) : null,
          sentById: n.sentById ?? null,
          createdAt: n.createdAt || now,
        },
      });
    } catch (e) {
      // skip if duplicate or constraint
    }
  }
  console.log(`Notifications seeded: ${notificationSeedData.length} (Admin, Sheikh, Student)`);

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

  // ─── Site Pages (About, Privacy) for Sheikh Mobile API ─────────────────────
  const sitePages = [
    {
      slug: 'app',
      title: 'About Shaykhi',
      titleAr: 'عن شيخي',
      body: 'Shaykhi is a Quran memorization platform connecting students with certified sheikhs for live one-on-one sessions. Our mission is to make Quran learning accessible to everyone worldwide through technology while preserving the traditional teacher-student relationship.',
      bodyAr: 'شيخي هي منصة لحفظ القرآن الكريم تربط الطلاب بمشايخ معتمدين لحلقات مباشرة فردية. مهمتنا هي جعل تعلم القرآن متاحاً للجميع في جميع أنحاء العالم من خلال التكنولوجيا مع الحفاظ على العلاقة التقليدية بين الشيخ والطالب.',
    },
    {
      slug: 'privacy',
      title: 'Privacy Policy',
      titleAr: 'سياسة الخصوصية',
      body: 'We respect your privacy. Your personal data is collected solely for providing our Quran learning services. We do not share your information with third parties without your consent. Session recordings are stored securely and accessible only to the sheikh and student involved.',
      bodyAr: 'نحن نحترم خصوصيتك. يتم جمع بياناتك الشخصية فقط لتقديم خدمات تعلم القرآن. لا نشارك معلوماتك مع أطراف ثالثة بدون موافقتك. يتم تخزين تسجيلات الجلسات بشكل آمن ولا يمكن الوصول إليها إلا من قبل الشيخ والطالب المعنيين.',
    },
    {
      slug: 'terms',
      title: 'Terms of Service',
      titleAr: 'شروط الخدمة',
      body: 'By using Shaykhi, you agree to maintain respectful conduct during sessions. Sheikhs must hold valid certifications. Cancellation policy: sessions can be cancelled up to 4 hours before the scheduled time.',
      bodyAr: 'باستخدامك لمنصة شيخي، فإنك توافق على الحفاظ على السلوك المحترم أثناء الجلسات. يجب أن يحمل المشايخ شهادات صالحة. سياسة الإلغاء: يمكن إلغاء الجلسات قبل 4 ساعات من الموعد المحدد.',
    },
  ];
  for (const pg of sitePages) {
    await prisma.sitePage.upsert({
      where: { slug: pg.slug },
      create: pg,
      update: { title: pg.title, titleAr: pg.titleAr, body: pg.body, bodyAr: pg.bodyAr },
    });
  }
  console.log('Site pages seeded (about, privacy, terms)');

  // ─── Payout requests (withdraw history) for sheikh wallet ─────────────────
  for (const t of fullTeachers) {
    const wallet = await prisma.teacherWallet.findUnique({ where: { teacherId: t.teacher.id } });
    if (!wallet) continue;
    const existingPayout = await prisma.payoutRequest.findFirst({ where: { teacherId: t.teacher.id } });
    if (existingPayout) continue;
    const payouts = [
      { teacherId: t.teacher.id, walletId: wallet.id, amount: 500, status: 'APPROVED', requestedAt: new Date(Date.now() - 15 * 86400000), approvedAt: new Date(Date.now() - 14 * 86400000), approvedBy: admin.id, processedAt: new Date(Date.now() - 13 * 86400000) },
      { teacherId: t.teacher.id, walletId: wallet.id, amount: 300, status: 'APPROVED', requestedAt: new Date(Date.now() - 7 * 86400000), approvedAt: new Date(Date.now() - 6 * 86400000), approvedBy: admin.id, processedAt: new Date(Date.now() - 5 * 86400000) },
      { teacherId: t.teacher.id, walletId: wallet.id, amount: 200, status: 'REJECTED', requestedAt: new Date(Date.now() - 3 * 86400000), rejectionReason: 'Insufficient documentation' },
    ];
    for (const p of payouts) {
      try { await prisma.payoutRequest.create({ data: p }); } catch (_) {}
    }
  }
  console.log('Payout requests seeded (withdraw history for sheikhs)');

  // Default system settings (currency: Egyptian Pound)
  const currencyDefaults = { currency_code: 'EGP', currency_symbol: 'ج.م', currency_name_ar: 'جنيه مصري', currency_name_en: 'Egyptian Pound' };
  for (const [key, value] of Object.entries(currencyDefaults)) {
    await prisma.systemSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }
  console.log('System settings (currency) seeded');

  console.log('\nSeeding completed.');
  console.log('Test credentials:');
  console.log('  Admin:   admin@shaykhi.com / admin123');
  console.log('  Student: student1@shaykhi.com / student123');
  console.log('  Teacher: teacher1@shaykhi.com / teacher123');
  console.log('\nSheikh Mobile API test:');
  console.log('  Login:   POST /api/v1/shike/mobile/login { phone: "+201234567895", password: "teacher123" }');
  console.log('  Docs:    http://localhost:8002/api/sheikh/docs');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });