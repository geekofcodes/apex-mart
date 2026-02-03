/**
 * API Response Utility - Ensures all responses follow a standard format
 */
class ApiResponse {
  constructor(success, message, data = null) {
    this.success = success;
    this.message = message;
    if (data !== null) this.data = data;
  }

  /**
   * Send success response
   */
  static success(res, message = "Success", data = null, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  /**
   * Send error response
   */
  static error(res, message = "Error", statusCode = 500, errors = null) {
    const response = {
      success: false,
      message,
    };

    if (errors) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Send paginated response
   */
  static paginated(
    res,
    message = "Success",
    data = null,
    statusCode = 200,
    pagination = {},
  ) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      meta: pagination,
    });
  }
}

export default ApiResponse;
