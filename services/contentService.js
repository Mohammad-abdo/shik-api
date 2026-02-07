const { prisma } = require('../lib/prisma');
const fileUploadService = require('./fileUploadService');

async function create(teacherId, dto, file) {
  const fileUrl = file ? fileUploadService.uploadFile(file, 'content') : dto.fileUrl;
  if (!fileUrl) throw Object.assign(new Error('File or fileUrl required'), { statusCode: 400 });
  return prisma.content.create({
    data: {
      teacherId,
      title: dto.title,
      description: dto.description,
      fileUrl,
      fileType: file ? file.mimetype : (dto.fileType || 'application/octet-stream'),
      contentType: dto.contentType || 'DOCUMENT',
      status: 'PENDING',
    },
    include: { teacher: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } } },
  });
}

async function getAllContent(page = 1, limit = 20, status) {
  const where = status ? { status } : {};
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.content.findMany({
      where,
      skip,
      take: limit,
      include: { teacher: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } } } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.content.count({ where }),
  ]);
  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }, totalPages: Math.ceil(total / limit) };
}

async function getPendingContent(page = 1, limit = 20) {
  return getAllContent(page, limit, 'PENDING');
}

async function getMyContent(teacherId, page = 1, limit = 20) {
  const teacher = await prisma.teacher.findUnique({ where: { userId: teacherId } });
  if (!teacher) throw Object.assign(new Error('Teacher not found'), { statusCode: 404 });
  const where = { teacherId: teacher.id };
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.content.findMany({ where, skip, take: limit, include: { teacher: true }, orderBy: { createdAt: 'desc' } }),
    prisma.content.count({ where }),
  ]);
  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function getById(id) {
  const content = await prisma.content.findUnique({
    where: { id },
    include: { teacher: { include: { user: true } } },
  });
  if (!content) throw Object.assign(new Error('Content not found'), { statusCode: 404 });
  return content;
}

async function approve(id, reviewerId) {
  const content = await prisma.content.findUnique({ where: { id } });
  if (!content) throw Object.assign(new Error('Content not found'), { statusCode: 404 });
  return prisma.content.update({
    where: { id },
    data: { status: 'APPROVED', reviewedBy: reviewerId, reviewedAt: new Date(), rejectionReason: null },
    include: { teacher: { include: { user: true } } },
  });
}

async function reject(id, reviewerId, reason) {
  const content = await prisma.content.findUnique({ where: { id } });
  if (!content) throw Object.assign(new Error('Content not found'), { statusCode: 404 });
  return prisma.content.update({
    where: { id },
    data: { status: 'REJECTED', reviewedBy: reviewerId, reviewedAt: new Date(), rejectionReason: reason },
    include: { teacher: { include: { user: true } } },
  });
}

async function deleteContent(id) {
  const content = await prisma.content.findUnique({ where: { id } });
  if (!content) throw Object.assign(new Error('Content not found'), { statusCode: 404 });
  await prisma.content.delete({ where: { id } });
  return { message: 'Content deleted' };
}

module.exports = { create, getAllContent, getPendingContent, getMyContent, getById, approve, reject, deleteContent };
