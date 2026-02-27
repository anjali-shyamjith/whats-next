/**
 * Standardizes the API responses.
 *
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {boolean} success - Indicates if the request was successful
 * @param {Object|Array|null} data - The payload
 * @param {string|null} error - Error message, if any
 */
const sendResponse = (res, statusCode, success, data = null, error = null) => {
  return res.status(statusCode).json({
    success,
    data,
    error,
  });
};

module.exports = {
  sendResponse,
};
