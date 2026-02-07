const { prisma } = require('../lib/prisma');

async function createCertificate(dto, teacherId) {
  const teacher = await prisma.teacher.findUnique({ where: { userId: teacherId } });
  if (!teacher) throw Object.assign(new Error('Teacher not found'), { statusCode: 404 });
  if (!teacher.canIssueCertificates) throw Object.assign(new Error('Teacher is not authorized to issue certificates'), { statusCode: 400 });
  const student = await prisma.user.findUnique({ where: { id: dto.studentId } });
  if (!student) throw Object.assign(new Error('Student not found'), { statusCode: 404 });
  const teacherUser = await prisma.user.findUnique({ where: { id: teacher.userId }, select: { firstName: true, lastName: true } });
  const pdfUrl = null;
  return prisma.certificate.create({
    data: {
      studentId: dto.studentId,
      teacherId: teacher.id,
      examId: dto.examId || null,
      type: dto.certificateType || 'IJAZA',
      title: `شهادة إجازة - ${dto.certificateType || 'IJAZA'}`,
      description: dto.surahName ? `شهادة إجازة في ${dto.surahName}` : null,
      pdfUrl,
    },
    include: { student: { select: { id: true, firstName: true, lastName: true, email: true } }, teacher: { include: { user: { select: { firstName: true, lastName: true } } } } },
  });
}

async function getStudentCertificates(studentId) {
  return prisma.certificate.findMany({
    where: { studentId },
    include: { teacher: { include: { user: { select: { firstName: true, lastName: true } } } } },
    orderBy: { issuedAt: 'desc' },
  });
}

async function getTeacherMyCertificates(teacherId) {
  const teacher = await prisma.teacher.findUnique({ where: { userId: teacherId } });
  if (!teacher) return [];
  return prisma.certificate.findMany({
    where: { teacherId: teacher.id },
    include: { student: { select: { id: true, firstName: true, lastName: true, email: true } } },
    orderBy: { issuedAt: 'desc' },
  });
}

async function revoke(id, teacherId) {
  const cert = await prisma.certificate.findUnique({ where: { id }, include: { teacher: true } });
  if (!cert) throw Object.assign(new Error('Certificate not found'), { statusCode: 404 });
  if (cert.teacher.userId !== teacherId) throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
  return prisma.certificate.update({
    where: { id },
    data: { status: 'REVOKED', revokedAt: new Date(), revocationReason: 'Revoked by teacher' },
  });
}

module.exports = { createCertificate, getStudentCertificates, getTeacherMyCertificates, revoke };
