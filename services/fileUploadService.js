const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const UPLOADS_BASE = path.join(PROJECT_ROOT, 'uploads');

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760', 10);
const MAX_VIDEO_SIZE = parseInt(process.env.MAX_VIDEO_SIZE || '5368709120', 10); // 5 GB default
const ALLOWED_FILE_TYPES = (process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,gif,webp,pdf').split(',').map((x) => x.trim().toLowerCase());
const ALLOWED_VIDEO_TYPES = (process.env.ALLOWED_VIDEO_TYPES || 'mp4,webm,mov,avi,mkv').split(',').map((x) => x.trim().toLowerCase());
const BASE_URL = process.env.BASE_URL || process.env.API_URL || 'http://localhost:8002';

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

/**
 * Upload from memory buffer (images, small files).
 */
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

/**
 * Upload from disk (large videos stored via multer diskStorage).
 * Moves the temp file to the final destination instead of buffering in RAM.
 */
function uploadVideoFromDisk(file, folder = 'videos') {
  if (!file || !file.path) {
    const err = new Error('No file provided. Send the file in form field "file".');
    err.statusCode = 400;
    throw err;
  }
  if (file.size > MAX_VIDEO_SIZE) {
    try { fs.unlinkSync(file.path); } catch (_) {}
    const limitGB = (MAX_VIDEO_SIZE / (1024 * 1024 * 1024)).toFixed(1);
    const fileGB = (file.size / (1024 * 1024 * 1024)).toFixed(2);
    const err = new Error(`Video too large (max ${limitGB} GB). Your file: ${fileGB} GB.`);
    err.statusCode = 400;
    throw err;
  }
  const fileExtension = (file.originalname || '').split('.').pop()?.toLowerCase();
  if (!fileExtension || !ALLOWED_VIDEO_TYPES.includes(fileExtension)) {
    try { fs.unlinkSync(file.path); } catch (_) {}
    const err = new Error(`Video type not allowed. Allowed: ${ALLOWED_VIDEO_TYPES.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }
  const fileName = `${uuidv4()}-${Date.now()}.${fileExtension}`;
  const uploadsDir = resolveUploadPath(folder);
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  const destPath = path.join(uploadsDir, fileName);
  fs.renameSync(file.path, destPath);
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

module.exports = { uploadFile, uploadVideoFromDisk, deleteFile, UPLOADS_BASE };
