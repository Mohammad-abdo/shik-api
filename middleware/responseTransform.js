/**
 * Transforms successful responses to unified format: { success: true, message, data }
 */
function responseTransform(req, res, next) {
  const originalJson = res.json.bind(res);
  res.json = function (payload) {
    if (payload && typeof payload === 'object' && (payload.success === true || payload.status === true)) {
      return originalJson(payload);
    }
    if (payload && typeof payload === 'object' && payload.success === false) {
      return originalJson(payload);
    }
    const method = req.method;
    const messages = {
      GET: 'Request completed successfully',
      POST: 'Resource created successfully',
      PUT: 'Resource updated successfully',
      PATCH: 'Resource updated successfully',
      DELETE: 'Resource deleted successfully',
    };
    const message = messages[method] || 'Request completed successfully';
    return originalJson({
      success: true,
      message,
      data: payload ?? {},
    });
  };
  next();
}

module.exports = responseTransform;
