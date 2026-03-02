const { prisma } = require('../lib/prisma');

const DEBUG = process.env.NOTIFICATION_DEBUG === 'true' || process.env.NODE_ENV !== 'production';

/**
 * Create a single notification. Every notification has a valid userId (receiver).
 * @param {string} userId - Receiver user id (required)
 * @param {string} type - NotificationType enum value
 * @param {string} title
 * @param {string} message
 * @param {object} [data={}] - Extra JSON payload
 * @param {string|null} [relatedId=null] - Optional bookingId, courseId, reviewId, etc.
 * @param {string|null} [sentById=null]
 */
async function createNotification(userId, type, title, message, data = {}, relatedId = null, sentById = null) {
  if (!userId) {
    if (DEBUG) console.warn('[notification] createNotification skipped: missing userId');
    return null;
  }
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: typeof data === 'object' ? JSON.stringify(data) : (data || '{}'),
        relatedId: relatedId || undefined,
        sentById: sentById || undefined,
      },
    });
    if (DEBUG) console.log('[notification] created', { id: notification.id, userId, type, title: title?.slice(0, 30) });
    return notification;
  } catch (err) {
    console.error('[notification] createNotification failed', { userId, type, err: err.message });
    return null;
  }
}

/**
 * Get user IDs with role ADMIN or SUPER_ADMIN (for notifying admins).
 */
async function getAdminUserIds() {
  const users = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
    select: { id: true },
  });
  return users.map((u) => u.id);
}

/**
 * Notify all admins (e.g. new booking, new review, new course).
 */
async function notifyAdmins(type, title, message, data = {}, relatedId = null, sentById = null) {
  const adminIds = await getAdminUserIds();
  if (adminIds.length === 0) {
    if (DEBUG) console.log('[notification] notifyAdmins: no admin users found');
    return [];
  }
  const results = await Promise.all(
    adminIds.map((userId) => createNotification(userId, type, title, message, data, relatedId, sentById))
  );
  return results.filter(Boolean);
}

async function getUserNotifications(userId, options = {}) {
  const { unreadOnly = false, limit = 100, offset = 0 } = typeof options === 'boolean' ? { unreadOnly: options } : options;
  const where = { userId };
  if (unreadOnly) where.isRead = false;
  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: Math.min(100, limit),
    skip: offset,
  });
  return notifications;
}

async function markAsRead(userId, notificationId) {
  const updated = await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true, readAt: new Date() },
  });
  return { message: 'Marked as read', count: updated.count };
}

async function markAllAsRead(userId) {
  const updated = await prisma.notification.updateMany({
    where: { userId },
    data: { isRead: true, readAt: new Date() },
  });
  return { message: 'All marked as read', count: updated.count };
}

async function deleteNotification(notificationId, userId) {
  const deleted = await prisma.notification.deleteMany({
    where: { id: notificationId, userId },
  });
  if (deleted.count === 0) throw Object.assign(new Error('Notification not found'), { statusCode: 404 });
  return { message: 'Notification deleted' };
}

async function sendNotification(dto, sentById) {
  const userIds = dto.userIds || (dto.userId ? [dto.userId] : []);
  if (userIds.length === 0) throw Object.assign(new Error('No users specified'), { statusCode: 400 });
  const relatedId = dto.relatedId || null;
  const notifications = await Promise.all(
    userIds.map((userId) =>
      createNotification(userId, dto.type, dto.title, dto.message, dto.data || {}, relatedId, sentById)
    )
  );
  return { notifications: notifications.filter(Boolean), count: notifications.filter(Boolean).length };
}

async function broadcastNotification(dto, sentById) {
  const where = {};
  if (dto.roles && dto.roles.length > 0) where.role = { in: dto.roles };
  const users = await prisma.user.findMany({ where, select: { id: true } });
  const relatedId = dto.relatedId || null;
  const notifications = await Promise.all(
    users.map((user) =>
      createNotification(user.id, dto.type, dto.title, dto.message, dto.data || {}, relatedId, sentById)
    )
  );
  return { notifications: notifications.filter(Boolean), count: notifications.filter(Boolean).length };
}

module.exports = {
  createNotification,
  getAdminUserIds,
  notifyAdmins,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  sendNotification,
  broadcastNotification,
};
