const bcrypt = require('bcrypt');
const { prisma } = require('../lib/prisma');

async function getProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { teacherProfile: true },
  });
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  const { password, ...rest } = user;
  return rest;
}

async function updateProfile(userId, dto) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      language: dto.language,
      avatar: dto.avatar,
    },
    include: { teacherProfile: true },
  });
  const { password, ...rest } = user;
  return rest;
}

async function updatePassword(userId, dto) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  const isCurrentPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
  if (!isCurrentPasswordValid) throw Object.assign(new Error('Current password is incorrect'), { statusCode: 400 });
  const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });
  return { message: 'Password updated successfully' };
}

async function deleteAccount(userId) {
  await prisma.user.update({ where: { id: userId }, data: { status: 'INACTIVE' } });
  return { message: 'Account deleted successfully' };
}

module.exports = { getProfile, updateProfile, updatePassword, deleteAccount };
