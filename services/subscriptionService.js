const { prisma } = require('../lib/prisma');

function parseFeatures(pkg) {
  if (pkg.features && typeof pkg.features === 'string') pkg.features = JSON.parse(pkg.features);
  if (pkg.featuresAr && typeof pkg.featuresAr === 'string') pkg.featuresAr = JSON.parse(pkg.featuresAr);
  return pkg;
}

async function createPackage(dto) {
  const pkg = await prisma.subscriptionPackage.create({
    data: {
      name: dto.name,
      nameAr: dto.nameAr,
      description: dto.description,
      descriptionAr: dto.descriptionAr,
      price: dto.price,
      duration: dto.duration || 30,
      features: dto.features ? JSON.stringify(dto.features) : null,
      featuresAr: dto.featuresAr ? JSON.stringify(dto.featuresAr) : null,
      maxStudents: dto.maxStudents,
      maxCourses: dto.maxCourses,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      isPopular: dto.isPopular || false,
    },
  });
  return parseFeatures({ ...pkg });
}

async function getAllPackages(activeOnly = false) {
  const where = activeOnly ? { isActive: true } : {};
  const packages = await prisma.subscriptionPackage.findMany({ where, orderBy: [{ isPopular: 'desc' }, { price: 'asc' }] });
  return packages.map((p) => parseFeatures({ ...p }));
}

async function getPackageById(id) {
  const pkg = await prisma.subscriptionPackage.findUnique({ where: { id }, include: { _count: { select: { subscriptions: true } } } });
  if (!pkg) throw Object.assign(new Error('Package not found'), { statusCode: 404 });
  return parseFeatures({ ...pkg });
}

async function updatePackage(id, dto) {
  const pkg = await prisma.subscriptionPackage.findUnique({ where: { id } });
  if (!pkg) throw Object.assign(new Error('Package not found'), { statusCode: 404 });
  const data = {};
  if (dto.name !== undefined) data.name = dto.name;
  if (dto.nameAr !== undefined) data.nameAr = dto.nameAr;
  if (dto.description !== undefined) data.description = dto.description;
  if (dto.descriptionAr !== undefined) data.descriptionAr = dto.descriptionAr;
  if (dto.price !== undefined) data.price = dto.price;
  if (dto.duration !== undefined) data.duration = dto.duration;
  if (dto.features !== undefined) data.features = JSON.stringify(dto.features);
  if (dto.featuresAr !== undefined) data.featuresAr = JSON.stringify(dto.featuresAr);
  if (dto.maxStudents !== undefined) data.maxStudents = dto.maxStudents;
  if (dto.maxCourses !== undefined) data.maxCourses = dto.maxCourses;
  if (dto.isActive !== undefined) data.isActive = dto.isActive;
  if (dto.isPopular !== undefined) data.isPopular = dto.isPopular;
  const updated = await prisma.subscriptionPackage.update({ where: { id }, data });
  return parseFeatures({ ...updated });
}

async function deletePackage(id) {
  const pkg = await prisma.subscriptionPackage.findUnique({ where: { id }, include: { _count: { select: { subscriptions: true } } } });
  if (!pkg) throw Object.assign(new Error('Package not found'), { statusCode: 404 });
  if (pkg._count.subscriptions > 0) throw Object.assign(new Error('Cannot delete package with active subscriptions'), { statusCode: 400 });
  await prisma.subscriptionPackage.delete({ where: { id } });
  return { message: 'Package deleted' };
}

async function subscribe(teacherId, dto) {
  const teacher = await prisma.teacher.findUnique({ where: { userId: teacherId } });
  if (!teacher) throw Object.assign(new Error('Teacher not found'), { statusCode: 404 });
  const pkg = await prisma.subscriptionPackage.findUnique({ where: { id: dto.packageId } });
  if (!pkg) throw Object.assign(new Error('Package not found'), { statusCode: 404 });
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + (pkg.duration || 30));
  return prisma.teacherSubscription.create({
    data: { teacherId: teacher.id, packageId: dto.packageId, startDate, endDate, status: 'ACTIVE', paymentId: dto.paymentId },
    include: { package: true, teacher: { include: { user: true } } },
  });
}

async function getMySubscriptions(teacherId) {
  const teacher = await prisma.teacher.findUnique({ where: { userId: teacherId } });
  if (!teacher) return [];
  return prisma.teacherSubscription.findMany({
    where: { teacherId: teacher.id },
    include: { package: true },
    orderBy: { createdAt: 'desc' },
  });
}

async function getMyActive(teacherId) {
  const teacher = await prisma.teacher.findUnique({ where: { userId: teacherId } });
  if (!teacher) return null;
  return prisma.teacherSubscription.findFirst({
    where: { teacherId: teacher.id, status: 'ACTIVE', endDate: { gte: new Date() } },
    include: { package: true },
  });
}

async function cancel(subscriptionId, teacherId) {
  const sub = await prisma.teacherSubscription.findUnique({ where: { id: subscriptionId }, include: { teacher: true } });
  if (!sub) throw Object.assign(new Error('Subscription not found'), { statusCode: 404 });
  if (sub.teacher.userId !== teacherId) throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
  return prisma.teacherSubscription.update({
    where: { id: subscriptionId },
    data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledBy: teacherId },
  });
}

async function getAllAdmin(page = 1, limit = 20, status) {
  const where = status ? { status } : {};
  const skip = (page - 1) * limit;
  const [subscriptions, total] = await Promise.all([
    prisma.teacherSubscription.findMany({
      where,
      skip,
      take: limit,
      include: { package: true, teacher: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.teacherSubscription.count({ where }),
  ]);
  return { subscriptions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

module.exports = { createPackage, getAllPackages, getPackageById, updatePackage, deletePackage, subscribe, getMySubscriptions, getMyActive, cancel, getAllAdmin };
