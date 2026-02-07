const { prisma } = require('../lib/prisma');

async function updateTeacherRating(teacherId) {
  const reviews = await prisma.review.findMany({
    where: { teacherId },
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
    data: { rating: averageRating, totalReviews: reviews.length },
  });
}

async function create(bookingId, studentId, dto) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { teacher: true },
  });
  if (!booking) throw Object.assign(new Error('Booking not found'), { statusCode: 404 });
  if (booking.studentId !== studentId) throw Object.assign(new Error('You can only review your own bookings'), { statusCode: 403 });
  if (booking.status !== 'COMPLETED') throw Object.assign(new Error('Booking must be completed before leaving a review'), { statusCode: 400 });
  const existingReview = await prisma.review.findUnique({ where: { bookingId } });
  if (existingReview) throw Object.assign(new Error('Review already exists for this booking'), { statusCode: 400 });
  const review = await prisma.review.create({
    data: {
      bookingId,
      studentId,
      teacherId: booking.teacherId,
      rating: dto.rating,
      comment: dto.comment,
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, avatar: true } },
    },
  });
  await updateTeacherRating(booking.teacherId);
  return review;
}

async function findByTeacher(teacherId) {
  return prisma.review.findMany({
    where: { teacherId },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      booking: { select: { id: true, date: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function update(bookingId, studentId, dto) {
  const review = await prisma.review.findUnique({
    where: { bookingId },
    include: { booking: true },
  });
  if (!review) throw Object.assign(new Error('Review not found'), { statusCode: 404 });
  if (review.studentId !== studentId) throw Object.assign(new Error('You can only update your own reviews'), { statusCode: 403 });
  const updated = await prisma.review.update({
    where: { bookingId },
    data: { rating: dto.rating, comment: dto.comment },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, avatar: true } },
    },
  });
  await updateTeacherRating(review.teacherId);
  return updated;
}

async function deleteReview(bookingId, studentId) {
  const review = await prisma.review.findUnique({ where: { bookingId } });
  if (!review) throw Object.assign(new Error('Review not found'), { statusCode: 404 });
  if (review.studentId !== studentId) throw Object.assign(new Error('You can only delete your own reviews'), { statusCode: 403 });
  const teacherId = review.teacherId;
  await prisma.review.delete({ where: { bookingId } });
  await updateTeacherRating(teacherId);
  return { message: 'Review deleted successfully' };
}

module.exports = { create, findByTeacher, update, deleteReview };
