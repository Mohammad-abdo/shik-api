/**
 * Global error handler - returns unified error format
 */
function errorHandler(err, req, res, next) {
  let statusCode = 500;
  let message = 'Internal server error';
  let errorCode;

  if (err.statusCode) {
    statusCode = err.statusCode;
    message = err.message || message;
    errorCode = err.errorCode;
  } else if (err.status) {
    statusCode = err.status;
    const resBody = err.response || err.body;
    if (resBody && typeof resBody === 'object') {
      message = Array.isArray(resBody.message) ? resBody.message.join(', ') : (resBody.message || err.message);
      errorCode = resBody.error_code;
    } else {
      message = err.message || message;
    }
  } else if (err instanceof Error) {
    message = err.message || message;
  }

  if (statusCode >= 500) {
    console.error('Server error:', err.stack || err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    data: null,
    statusCode,
    ...(errorCode && { error_code: errorCode }),
  });
}

module.exports = errorHandler;
