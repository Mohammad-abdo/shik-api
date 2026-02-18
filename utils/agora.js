const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

const HEX_32 = /^[a-fA-F0-9]{32}$/;
const DEFAULT_TOKEN_EXPIRES_IN_SECONDS = 3600;

function sanitizeChannelName(channelName) {
  const name = String(channelName || `test-${Date.now()}`)
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .slice(0, 64);
  return name || `test-${Date.now()}`;
}

function sanitizeUid(uid) {
  const numeric = Math.abs(parseInt(uid, 10));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 1;
}

function parseTokenExpirySeconds() {
  const value = parseInt(process.env.AGORA_TOKEN_EXPIRES_IN_SECONDS, 10);
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_TOKEN_EXPIRES_IN_SECONDS;
  return value;
}

function readAgoraConfig() {
  return {
    appId: (process.env.AGORA_APP_ID || '').trim(),
    appCertificate: (process.env.AGORA_APP_CERTIFICATE || process.env.AGORA_APP_SECRET || '').trim(),
  };
}

function getAgoraConfigValidationErrors() {
  const { appId, appCertificate } = readAgoraConfig();
  const errors = [];

  if (!appId) {
    errors.push('AGORA_APP_ID is missing. Set AGORA_APP_ID=<32 hex> in shik-api/.env');
  } else if (!HEX_32.test(appId)) {
    errors.push('AGORA_APP_ID is invalid. It must be a 32-character hex string from Agora Console.');
  }

  if (!appCertificate) {
    errors.push('AGORA_APP_CERTIFICATE is missing. Set AGORA_APP_CERTIFICATE=<32 hex> in shik-api/.env');
  } else if (!HEX_32.test(appCertificate)) {
    errors.push('AGORA_APP_CERTIFICATE is invalid. It must be a 32-character hex string from the same Agora project.');
  }

  return errors;
}

function getAgoraConfigOrThrow() {
  const errors = getAgoraConfigValidationErrors();
  if (errors.length > 0) {
    const err = new Error(`Agora configuration invalid: ${errors.join(' ')}`);
    err.statusCode = 503;
    throw err;
  }
  return readAgoraConfig();
}

function buildRtcToken(channelName, uid, role = RtcRole.PUBLISHER) {
  const { appId, appCertificate } = getAgoraConfigOrThrow();
  const safeChannelName = sanitizeChannelName(channelName);
  const safeUid = sanitizeUid(uid);
  const privilegeExpiredTs = Math.floor(Date.now() / 1000) + parseTokenExpirySeconds();

  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    safeChannelName,
    safeUid,
    role,
    privilegeExpiredTs
  );

  return { token, appId, channelName: safeChannelName, uid: safeUid };
}

module.exports = {
  buildRtcToken,
  getAgoraConfigOrThrow,
  getAgoraConfigValidationErrors,
  sanitizeChannelName,
  sanitizeUid,
  RtcRole,
};
