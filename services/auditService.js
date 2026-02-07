const { prisma } = require('../lib/prisma');

async function log(userId, action, entity, entityId = null, details = null, ipAddress, userAgent) {
  return prisma.auditLog.create({
    data: {
      userId,
      action,
      entity,
      entityId,
      details: details ? JSON.stringify(details) : null,
      ipAddress,
      userAgent,
    },
  });
}

async function getLogs(filters = {}) {
  const where = {};
  if (filters.userId) where.userId = filters.userId;
  if (filters.entity) where.entity = filters.entity;
  if (filters.entityId) where.entityId = filters.entityId;
  if (filters.action) where.action = filters.action;
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }
  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { logs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

module.exports = { log, getLogs };
