const { prisma } = require('../lib/prisma');
const notificationService = require('./notificationService');

const REVIEW_TYPE = { SHEIKH: 'SHEIKH', COURSE: 'COURSE', BOOKING: 'BOOKING' };

const userSelect = { id: true, firstName: true, lastName: true, firstNameAr: true, lastNameAr: true, avatar: true, email: true };
const teacherInclude = { include: { user: { select: userSelect } } };
const courseInclude = { select: { id: true, title: true, titleAr: true } };
const bookingInclude = {
  select: {
    id: true,
    date: true,
    teacher: teacherInclude,
    course: { select: { id: true, title: true, titleAr: true } },
  },
};

/** Default include for list: user + related entity (sheikh / course / booking) */
const listInclude = {
  user: { select: userSelect },
  teacher: teacherInclude,
  course: courseInclude,
  booking: bookingInclude,
};

const REVIEW_STATUS = { ACTIVE: 'ACTIVE', SUSPENDED: 'SUSPENDED' };

/**
 * Recompute and persist teacher (sheikh) rating from ACTIVE reviews where sheikhId = teacherId.
 */
async function updateTeacherRating(teacherId) {
  if (!teacherId) return;
  const reviews = await prisma.review.findMany({
    where: { sheikhId: teacherId, status: REVIEW_STATUS.ACTIVE },
    select: { rating: true },
  });
  if (reviews.length === 0) {
    await prisma.teacher.update({
      where: { id: teacherId },
      data: { rating: 0, totalReviews: 0 },
    });
    return;
  }
  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  await prisma.teacher.update({
    where: { id: teacherId },
    data: { rating: Math.round(averageRating * 100) / 100, totalReviews: reviews.length },
  });
}

/**
 * Get all reviews with optional type filter, status filter, and pagination. Sorted by latest first.
 * By default only ACTIVE reviews; pass includeSuspended: true to include SUSPENDED (e.g. for admin).
 * Returns { reviews, averageByType, pagination }.
 */
async function getAll(options = {}) {
  const { type, page = 1, limit: rawLimit = 10, includeSuspended = false } = options;
  const limit = Math.min(50, Math.max(1, Number(rawLimit) || 10));
  const skip = (Math.max(1, Number(page) || 1) - 1) * limit;
  const where = type && REVIEW_TYPE[type] ? { type: REVIEW_TYPE[type] } : {};
  if (!includeSuspended) where.status = REVIEW_STATUS.ACTIVE;

  const aggWhere = { status: REVIEW_STATUS.ACTIVE };
  const [reviews, total, aggAll, aggSheikh, aggCourse, aggBooking] = await Promise.all([
    prisma.review.findMany({
      where,
      include: listInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.review.count({ where }),
    prisma.review.aggregate({ where: aggWhere, _avg: { rating: true }, _count: { id: true } }),
    prisma.review.aggregate({ where: { ...aggWhere, type: 'SHEIKH' }, _avg: { rating: true }, _count: { id: true } }),
    prisma.review.aggregate({ where: { ...aggWhere, type: 'COURSE' }, _avg: { rating: true }, _count: { id: true } }),
    prisma.review.aggregate({ where: { ...aggWhere, type: 'BOOKING' }, _avg: { rating: true }, _count: { id: true } }),
  ]);

  const round = (v) => (v != null ? Math.round(Number(v) * 100) / 100 : null);
  const averageByType = {
    all: aggAll._count.id > 0 ? { average: round(aggAll._avg.rating), count: aggAll._count.id } : null,
    SHEIKH: aggSheikh._count.id > 0 ? { average: round(aggSheikh._avg.rating), count: aggSheikh._count.id } : null,
    COURSE: aggCourse._count.id > 0 ? { average: round(aggCourse._avg.rating), count: aggCourse._count.id } : null,
    BOOKING: aggBooking._count.id > 0 ? { average: round(aggBooking._avg.rating), count: aggBooking._count.id } : null,
  };

  const pagination = {
    page: skip / limit + 1,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };

  return { reviews, averageByType, pagination };
}

/**
 * Create a booking review (type = BOOKING). Called when a student reviews a completed booking.
 */
async function create(bookingId, userId, dto) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { teacher: true },
  });
  if (!booking) throw Object.assign(new Error('Booking not found'), { statusCode: 404 });
  if (booking.studentId !== userId) throw Object.assign(new Error('You can only review your own bookings'), { statusCode: 403 });
  if (booking.status !== 'COMPLETED') throw Object.assign(new Error('Booking must be completed before leaving a review'), { statusCode: 400 });
  const existingReview = await prisma.review.findFirst({ where: { bookingId } });
  if (existingReview) throw Object.assign(new Error('Review already exists for this booking'), { statusCode: 400 });

  const rating = Math.min(5, Math.max(1, Number(dto.rating) || 0));
  const review = await prisma.review.create({
    data: {
      bookingId,
      userId,
      type: REVIEW_TYPE.BOOKING,
      sheikhId: booking.teacherId,
      rating,
      comment: dto.comment ? String(dto.comment).trim() || null : null,
    },
    include: {
      user: { select: userSelect },
      teacher: teacherInclude,
      booking: bookingInclude,
    },
  });
  await updateTeacherRating(booking.teacherId);
  const teacherUser = booking.teacher?.userId || (await prisma.teacher.findUnique({ where: { id: booking.teacherId }, select: { userId: true } }))?.userId;
  if (teacherUser) {
    notificationService.createNotification(
      teacherUser,
      'REVIEW_RECEIVED',
      'New Review',
      `You received a new review (${review.rating}/5)${review.comment ? ': ' + review.comment.slice(0, 50) + (review.comment.length > 50 ? '…' : '') : ''}`,
      { reviewId: review.id, bookingId: booking.id },
      review.id,
      userId
    ).catch(() => {});
  }
  notificationService.notifyAdmins(
    'REVIEW_RECEIVED',
    'New Review',
    `A new review was added (${review.rating}/5) for booking ${booking.id}`,
    { reviewId: review.id, bookingId: booking.id },
    review.id,
    userId
  ).catch(() => {});
  return review;
}

/**
 * Find reviews for a teacher (sheikh) – ACTIVE reviews where sheikhId = teacherId.
 */
async function findByTeacher(teacherId) {
  return prisma.review.findMany({
    where: { sheikhId: teacherId, status: REVIEW_STATUS.ACTIVE },
    include: {
      user: { select: userSelect },
      teacher: teacherInclude,
      course: courseInclude,
      booking: bookingInclude,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Update a booking review by bookingId (owner only).
 */
async function update(bookingId, userId, dto) {
  const review = await prisma.review.findFirst({
    where: { bookingId },
    include: { booking: true },
  });
  if (!review) throw Object.assign(new Error('Review not found'), { statusCode: 404 });
  if (review.userId !== userId) throw Object.assign(new Error('You can only update your own reviews'), { statusCode: 403 });

  const rating = dto.rating != null ? Math.min(5, Math.max(1, Number(dto.rating))) : undefined;
  const updated = await prisma.review.update({
    where: { id: review.id },
    data: {
      ...(rating !== undefined && { rating }),
      ...(dto.comment !== undefined && { comment: dto.comment ? String(dto.comment).trim() || null : null }),
    },
    include: {
      user: { select: userSelect },
      teacher: teacherInclude,
      booking: bookingInclude,
    },
  });
  await updateTeacherRating(review.sheikhId);
  return updated;
}

/**
 * Delete a booking review by bookingId (owner only).
 */
async function deleteReview(bookingId, userId) {
  const review = await prisma.review.findFirst({ where: { bookingId } });
  if (!review) throw Object.assign(new Error('Review not found'), { statusCode: 404 });
  if (review.userId !== userId) throw Object.assign(new Error('You can only delete your own reviews'), { statusCode: 403 });
  const sheikhId = review.sheikhId;
  await prisma.review.delete({ where: { id: review.id } });
  await updateTeacherRating(sheikhId);
  return { message: 'Review deleted successfully' };
}

/**
 * Get a single review by id.
 */
async function getById(id) {
  const review = await prisma.review.findUnique({
    where: { id },
    include: listInclude,
  });
  if (!review) throw Object.assign(new Error('Review not found'), { statusCode: 404 });
  return review;
}

/**
 * Update a review by id. Allowed: owner (userId) or admin (isAdmin).
 */
async function updateById(id, dto, userId, isAdmin = false) {
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) throw Object.assign(new Error('Review not found'), { statusCode: 404 });
  if (!isAdmin && review.userId !== userId) throw Object.assign(new Error('You can only update your own reviews'), { statusCode: 403 });

  const rating = dto.rating != null ? Math.min(5, Math.max(1, Number(dto.rating))) : undefined;
  const updated = await prisma.review.update({
    where: { id },
    data: {
      ...(rating !== undefined && { rating }),
      ...(dto.comment !== undefined && { comment: dto.comment ? String(dto.comment).trim() || null : null }),
    },
    include: listInclude,
  });
  if (review.sheikhId) await updateTeacherRating(review.sheikhId);
  return updated;
}

/**
 * Delete a review by id. Allowed: owner or admin.
 */
async function deleteById(id, userId, isAdmin = false) {
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) throw Object.assign(new Error('Review not found'), { statusCode: 404 });
  if (!isAdmin && review.userId !== userId) throw Object.assign(new Error('You can only delete your own reviews'), { statusCode: 403 });
  const sheikhId = review.sheikhId;
  await prisma.review.delete({ where: { id } });
  await updateTeacherRating(sheikhId);
  return { message: 'Review deleted successfully' };
}

/**
 * Suspend a review (hide from public). Admin only.
 */
async function suspend(id, isAdmin = false) {
  if (!isAdmin) throw Object.assign(new Error('Only admins can suspend reviews'), { statusCode: 403 });
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) throw Object.assign(new Error('Review not found'), { statusCode: 404 });
  const updated = await prisma.review.update({
    where: { id },
    data: { status: REVIEW_STATUS.SUSPENDED },
    include: listInclude,
  });
  await updateTeacherRating(review.sheikhId);
  return updated;
}

/**
 * Activate a suspended review. Admin only.
 */
async function activate(id, isAdmin = false) {
  if (!isAdmin) throw Object.assign(new Error('Only admins can activate reviews'), { statusCode: 403 });
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) throw Object.assign(new Error('Review not found'), { statusCode: 404 });
  const updated = await prisma.review.update({
    where: { id },
    data: { status: REVIEW_STATUS.ACTIVE },
    include: listInclude,
  });
  await updateTeacherRating(review.sheikhId);
  return updated;
}

module.exports = {
  getAll,
  create,
  findByTeacher,
  update,
  deleteReview,
  updateTeacherRating,
  getById,
  updateById,
  deleteById,
  suspend,
  activate,
};
