/**
 * Unified response utilities
 */

/**
 * Send successful response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {*} data - Response data
 */
function sendResponse(res, statusCode = 200, message = 'Success', data = null) {
  const response = {
    success: true,
    message,
    data
  };
  
  res.status(statusCode).json(response);
}

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {*} errors - Error details
 */
function sendErrorResponse(res, statusCode = 500, message = 'Internal Server Error', errors = null) {
  const response = {
    success: false,
    message,
    ...(errors && { errors })
  };
  
  res.status(statusCode).json(response);
}

/**
 * Send paginated response
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 * @param {Array} data - Data array
 * @param {Object} pagination - Pagination info
 */
function sendPaginatedResponse(res, message = 'Data retrieved successfully', data = [], pagination = {}) {
  const response = {
    success: true,
    message,
    data,
    pagination
  };
  
  res.status(200).json(response);
}

module.exports = {
  sendResponse,
  sendErrorResponse,
  sendPaginatedResponse
};