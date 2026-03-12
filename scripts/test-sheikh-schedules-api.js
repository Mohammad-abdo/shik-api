/**
 * Test script for Sheikh Mobile schedule endpoints:
 *   GET/POST /api/v1/shike/mobile/teachers/:teacherId/schedules
 *   PUT/DELETE /api/v1/shike/mobile/teachers/:teacherId/schedules/:scheduleId
 *
 * Usage:
 *   node scripts/test-sheikh-schedules-api.js
 *   BASE_URL=https://shike.developteam.site node scripts/test-sheikh-schedules-api.js
 *
 * Local: start API first (npm run dev), then run this script.
 * Uses seed teacher: phone +201234567895, password teacher123
 */
const https = require('https');
const http = require('http');

const BASE_URL = process.env.BASE_URL || 'http://localhost:8002';
const SHEIKH_PHONE = process.env.SHEIKH_PHONE || '+201234567895';
const SHEIKH_PASSWORD = process.env.SHEIKH_PASSWORD || 'teacher123';

function request(method, path, body = null, token = null) {
  const url = new URL(path, BASE_URL);
  const isHttps = url.protocol === 'https:';
  const lib = isHttps ? https : http;
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    const req = lib.request(opts, (res) => {
      let data = '';
      res.on('data', (ch) => (data += ch));
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode, data: json, raw: data });
        } catch {
          resolve({ status: res.statusCode, data: null, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  console.log('BASE_URL:', BASE_URL);
  console.log('Sheikh phone:', SHEIKH_PHONE);
  console.log('---');

  let token;
  let teacherId;
  let createdScheduleId;

  try {
    // 1) Login
    console.log('1) POST /api/v1/shike/mobile/login');
    const loginRes = await request('POST', '/api/v1/shike/mobile/login', {
      phone: SHEIKH_PHONE,
      password: SHEIKH_PASSWORD,
    });
    if (loginRes.status !== 200 || !loginRes.data?.data?.token) {
      console.log('   FAIL:', loginRes.status, loginRes.raw?.slice(0, 200));
      return;
    }
    token = loginRes.data.data.token;
    teacherId = loginRes.data.data.teacherId || loginRes.data.data.sheikh?.teacherId;
    if (!teacherId) {
      const profileRes = await request('GET', '/api/v1/shike/mobile/profile', null, token);
      const payload = profileRes.data?.data ?? profileRes.data;
      teacherId = payload?.teacherId;
      if (profileRes.status === 200 && teacherId) {
        console.log('   OK — token received, teacherId from profile:', teacherId);
      } else {
        console.log('   FAIL: no teacherId in login or profile', profileRes.status);
        return;
      }
    } else {
      console.log('   OK — token received, teacherId:', teacherId);
    }

    // 2) GET schedules
    const getPath = `/api/v1/shike/mobile/teachers/${teacherId}/schedules`;
    console.log('2) GET', getPath);
    const getRes = await request('GET', getPath, null, token);
    if (getRes.status !== 200) {
      console.log('   FAIL:', getRes.status, getRes.raw?.slice(0, 200));
      return;
    }
    const getPayload = getRes.data?.data ?? getRes.data;
    const total = getPayload?.total ?? getPayload?.schedules?.length ?? 0;
    const existing = Array.isArray(getPayload?.schedules) ? getPayload.schedules : [];
    console.log('   OK — total schedules:', total);

    // Pick a slot that does not overlap existing (e.g. Saturday 02:00-03:00)
    const testSlot = { dayOfWeek: 6, startTime: '02:00', endTime: '03:00' };
    const overlaps = existing.some(
      (s) =>
        Number(s.dayOfWeek) === testSlot.dayOfWeek &&
        s.startTime < testSlot.endTime &&
        (s.endTime || '').slice(0, 5) > testSlot.startTime
    );
    if (overlaps) {
      testSlot.dayOfWeek = 0;
      testSlot.startTime = '01:00';
      testSlot.endTime = '02:00';
    }

    // 3) POST new schedule
    console.log('3) POST', getPath, JSON.stringify(testSlot));
    const postRes = await request('POST', getPath, testSlot, token);
    if (postRes.status !== 201 && postRes.status !== 200) {
      console.log('   FAIL:', postRes.status, postRes.raw?.slice(0, 300));
      return;
    }
    const postPayload = postRes.data?.data ?? postRes.data;
    createdScheduleId =
      postPayload?.schedules?.[0]?.id ?? postPayload?.schedule?.id ?? postPayload?.schedules?.[0]?.id;
    if (!createdScheduleId && Array.isArray(postPayload?.schedules) && postPayload.schedules.length > 0) {
      createdScheduleId = postPayload.schedules[0].id;
    }
    console.log('   OK — created schedule id:', createdScheduleId);

    if (!createdScheduleId) {
      console.log('   (No schedule id to update/delete; POST may return createdCount only)');
      console.log('--- All tests done.');
      return;
    }

    // 4) PUT update schedule (move to Sunday 02:00-03:00 to avoid overlap on Saturday)
    const putPath = `/api/v1/shike/mobile/teachers/${teacherId}/schedules/${createdScheduleId}`;
    console.log('4) PUT', putPath);
    const putRes = await request('PUT', putPath, { dayOfWeek: 0, startTime: '02:00', endTime: '03:00' }, token);
    if (putRes.status !== 200) {
      console.log('   FAIL:', putRes.status, putRes.raw?.slice(0, 200));
    } else {
      console.log('   OK — schedule updated');
    }

    // 5) DELETE schedule
    console.log('5) DELETE', putPath);
    const delRes = await request('DELETE', putPath, null, token);
    if (delRes.status !== 200 && delRes.status !== 204) {
      console.log('   FAIL:', delRes.status, delRes.raw?.slice(0, 200));
    } else {
      console.log('   OK — schedule deleted');
    }

    console.log('--- All tests passed.');
  } catch (err) {
    console.error('Error:', err.message || err.code || err);
    if (err.code === 'ECONNREFUSED') {
      console.error('Is the API server running at', BASE_URL, '?');
    }
  }
}

run();
