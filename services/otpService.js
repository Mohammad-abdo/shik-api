const { prisma } = require('../lib/prisma');
const nodemailer = require('nodemailer');

let transporter;

function initTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

function generateOtp(length = 6) {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

async function sendEmailOtp(email, type) {
  const code = generateOtp(parseInt(process.env.OTP_LENGTH || '6', 10));
  const expiresIn = parseInt(process.env.OTP_EXPIRES_IN || '300', 10);
  await prisma.otp.create({
    data: {
      email,
      code,
      type,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    },
  });
  const t = initTransporter();
  if (t && process.env.SMTP_USER) {
    await t.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Verification Code - Shaykhi',
      html: `<div><h2>Your Verification Code</h2><p>Your code is: <strong>${code}</strong></p><p>Expires in ${expiresIn / 60} minutes.</p></div>`,
    });
  }
  return { code };
}

async function sendPhoneOtp(phone, type) {
  const code = generateOtp(parseInt(process.env.OTP_LENGTH || '6', 10));
  const expiresIn = parseInt(process.env.OTP_EXPIRES_IN || '300', 10);
  await prisma.otp.create({
    data: {
      phone,
      code,
      type,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    },
  });
  return { code };
}

async function verifyOtp(emailOrPhone, code, type) {
  const otp = await prisma.otp.findFirst({
    where: {
      OR: [{ email: emailOrPhone }, { phone: emailOrPhone }],
      code,
      type,
      isUsed: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });
  if (!otp) return false;
  await prisma.otp.update({
    where: { id: otp.id },
    data: { isUsed: true },
  });
  return true;
}

module.exports = { sendEmailOtp, sendPhoneOtp, verifyOtp };
