const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { jwtAuth } = require('../middleware/jwtAuth');
const { requireSuperAdmin } = require('../middleware/requireSuperAdmin');

const CURRENCY_KEYS = ['currency_code', 'currency_symbol', 'currency_name_ar', 'currency_name_en'];
const CURRENCY_DEFAULTS = {
  currency_code: 'EGP',
  currency_symbol: 'ج.م',
  currency_name_ar: 'جنيه مصري',
  currency_name_en: 'Egyptian Pound',
};

async function getSettingsMap() {
  const rows = await prisma.systemSetting.findMany({
    where: { key: { in: CURRENCY_KEYS } },
  });
  const map = {};
  CURRENCY_KEYS.forEach((k) => { map[k] = CURRENCY_DEFAULTS[k]; });
  rows.forEach((r) => { map[r.key] = r.value; });
  return map;
}

/**
 * GET /api/settings — public, returns system settings (e.g. currency for display)
 */
router.get('/', async (req, res, next) => {
  try {
    const map = await getSettingsMap();
    res.json({
      currency: {
        code: map.currency_code,
        symbol: map.currency_symbol,
        nameAr: map.currency_name_ar,
        nameEn: map.currency_name_en,
      },
    });
  } catch (e) {
    next(e);
  }
});

/**
 * PATCH /api/settings — admin only, update system settings (e.g. currency)
 * Body: { currencyCode?, currencySymbol?, currencyNameAr?, currencyNameEn? }
 */
router.patch('/', jwtAuth, requireSuperAdmin, async (req, res, next) => {
  try {
    const { currencyCode, currencySymbol, currencyNameAr, currencyNameEn } = req.body || {};
    const updates = [];
    if (currencyCode != null) updates.push({ key: 'currency_code', value: String(currencyCode) });
    if (currencySymbol != null) updates.push({ key: 'currency_symbol', value: String(currencySymbol) });
    if (currencyNameAr != null) updates.push({ key: 'currency_name_ar', value: String(currencyNameAr) });
    if (currencyNameEn != null) updates.push({ key: 'currency_name_en', value: String(currencyNameEn) });
    for (const u of updates) {
      await prisma.systemSetting.upsert({
        where: { key: u.key },
        create: u,
        update: { value: u.value },
      });
    }
    const map = await getSettingsMap();
    res.json({
      currency: {
        code: map.currency_code,
        symbol: map.currency_symbol,
        nameAr: map.currency_name_ar,
        nameEn: map.currency_name_en,
      },
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
module.exports.getSettingsMap = getSettingsMap;
module.exports.CURRENCY_DEFAULTS = CURRENCY_DEFAULTS;
