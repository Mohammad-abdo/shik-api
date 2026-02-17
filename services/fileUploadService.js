const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// مسار مجلد الرفع ثابت داخل المشروع (backend-js/uploads) – لا يُستخدم مسار خارج المشروع
const PROJECT_ROOT = path.resolve(__dirname, '..');
const UPLOADS_BASE = path.join(PROJECT_ROOT, 'uploads');

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760', 10);
const MAX_VIDEO_SIZE = parseInt(process.env.MAX_VIDEO_SIZE || '104857600', 10);
const ALLOWED_FILE_TYPES = (process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,gif,webp,pdf').split(',').map((x) => x.trim().toLowerCase());
const ALLOWED_VIDEO_TYPES = (process.env.ALLOWED_VIDEO_TYPES || 'mp4,webm,mov,avi,mkv').split(',').map((x) => x.trim().toLowerCase());
const BASE_URL = process.env.BASE_URL || process.env.API_URL || 'http://localhost:8002';

/** يضمن أن المسار النهائي داخل مجلد uploads بالمشروع فقط (يمنع الخروج خارج المشروع) */
function resolveUploadPath(relativePath) {
  const resolved = path.resolve(UPLOADS_BASE, relativePath);
  const relative = path.relative(UPLOADS_BASE, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    const err = new Error('Upload path must stay inside project uploads folder.');
    err.statusCode = 400;
    throw err;
  }
  return resolved;
}

function uploadFile(file, folder = 'uploads', allowVideo = false) {
  if (!file || !file.buffer) {
    const err = new Error('No file provided. Send the file in form field "file".');
    err.statusCode = 400;
    throw err;
  }
  const maxSize = allowVideo ? MAX_VIDEO_SIZE : MAX_FILE_SIZE;
  if (file.size > maxSize) {
    const err = new Error(`File size exceeds maximum (${Math.round(maxSize / 1024 / 1024)}MB). Your file: ${Math.round(file.size / 1024 / 1024)}MB.`);
    err.statusCode = 400;
    throw err;
  }
  const allowedExtensions = allowVideo ? ALLOWED_VIDEO_TYPES : ALLOWED_FILE_TYPES;
  const fileExtension = (file.originalname || '').split('.').pop()?.toLowerCase();
  if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
    const err = new Error(`File type not allowed. Allowed: ${allowedExtensions.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }
  const fileName = `${uuidv4()}-${Date.now()}.${fileExtension}`;
  const uploadsDir = resolveUploadPath(folder);
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  const filePath = path.join(uploadsDir, fileName);
  fs.writeFileSync(filePath, file.buffer);
  return `${BASE_URL.replace(/\/$/, '')}/uploads/${folder}/${fileName}`;
}

function deleteFile(fileUrl) {
  try {
    const match = fileUrl.match(/\/uploads\/(.+)$/);
    if (match) {
      const filePath = resolveUploadPath(match[1]);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  } catch (_) {}
}

module.exports = { uploadFile, deleteFile };
