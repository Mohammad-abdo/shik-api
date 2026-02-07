const { prisma } = require('../lib/prisma');

async function createNotification(userId, type, title, message, data = {}, sentById = null) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      data: typeof data === 'object' ? JSON.stringify(data) : (data || '{}'),
      sentById,
    },
  });
  return notification;
}

async function getUserNotifications(userId, unreadOnly = false) {
  const where = { userId };
  if (unreadOnly) where.isRead = false;
  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return notifications;
}

async function markAsRead(userId, notificationId) {
  await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true, readAt: new Date() },
  });
  return { message: 'Marked as read' };
}

async function markAllAsRead(userId) {
  await prisma.notification.updateMany({
    where: { userId },
    data: { isRead: true, readAt: new Date() },
  });
  return { message: 'All marked as read' };
}

async function sendNotification(dto, sentById) {
  const userIds = dto.userIds || (dto.userId ? [dto.userId] : []);
  if (userIds.length === 0) throw Object.assign(new Error('No users specified'), { statusCode: 400 });
  const notifications = await Promise.all(
    userIds.map((userId) =>
      createNotification(userId, dto.type, dto.title, dto.message, dto.data || {}, sentById)
    )
  );
  return { notifications, count: notifications.length };
}

async function broadcastNotification(dto, sentById) {
  const where = {};
  if (dto.roles && dto.roles.length > 0) where.role = { in: dto.roles };
  const users = await prisma.user.findMany({ where, select: { id: true } });
  const notifications = await Promise.all(
    users.map((user) =>
      createNotification(user.id, dto.type, dto.title, dto.message, dto.data || {}, sentById)
    )
  );
  return { notifications, count: notifications.length };
}

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  sendNotification,
  broadcastNotification,
};
