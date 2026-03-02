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
 * Body: { currencyCode?, currencySymbol?, currencyNameAr?, currencyNameEn? } or { currency: { code, symbol, nameAr, nameEn } }
 */
router.patch('/', jwtAuth, requireSuperAdmin, async (req, res, next) => {
  try {
    const body = req.body || {};
    // Support both flat keys and nested body.currency
    const currencyObj = body.currency && typeof body.currency === 'object' ? body.currency : body;
    const currencyCode = currencyObj.currencyCode ?? currencyObj.code;
    const currencySymbol = currencyObj.currencySymbol ?? currencyObj.symbol;
    const currencyNameAr = currencyObj.currencyNameAr ?? currencyObj.nameAr;
    const currencyNameEn = currencyObj.currencyNameEn ?? currencyObj.nameEn;

    const updates = [];
    if (currencyCode != null && currencyCode !== '') updates.push({ key: 'currency_code', value: String(currencyCode) });
    if (currencySymbol != null) updates.push({ key: 'currency_symbol', value: String(currencySymbol) });
    if (currencyNameAr != null) updates.push({ key: 'currency_name_ar', value: String(currencyNameAr) });
    if (currencyNameEn != null) updates.push({ key: 'currency_name_en', value: String(currencyNameEn) });

    if (updates.length === 0) {
      const err = new Error('No currency fields to update. Send currencyCode, currencySymbol, currencyNameAr, currencyNameEn.');
      err.statusCode = 400;
      return next(err);
    }

    await prisma.$transaction(
      updates.map((u) =>
        prisma.systemSetting.upsert({
          where: { key: u.key },
          create: { key: u.key, value: u.value },
          update: { value: u.value },
        })
      )
    );

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
