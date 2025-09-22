const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Default error
  let error = {
    message: 'Internal server error',
    status: 500,
    code: 'INTERNAL_ERROR'
  };

  // MySQL errors
  if (err.code) {
    switch (err.code) {
      case 'ER_DUP_ENTRY':
        error = {
          message: 'Duplicate entry - resource already exists',
          status: 409,
          code: 'DUPLICATE_ENTRY'
        };
        break;
      case 'ER_NO_REFERENCED_ROW_2':
        error = {
          message: 'Referenced resource not found',
          status: 400,
          code: 'INVALID_REFERENCE'
        };
        break;
      case 'ER_ROW_IS_REFERENCED_2':
        error = {
          message: 'Cannot delete - resource is referenced by other records',
          status: 400,
          code: 'REFERENCE_CONSTRAINT'
        };
        break;
      case 'ER_ACCESS_DENIED_ERROR':
        error = {
          message: 'Database access denied',
          status: 500,
          code: 'DB_ACCESS_DENIED'
        };
        break;
      case 'ECONNREFUSED':
        error = {
          message: 'Database connection failed',
          status: 500,
          code: 'DB_CONNECTION_FAILED'
        };
        break;
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      message: 'Invalid token',
      status: 401,
      code: 'INVALID_TOKEN'
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      message: 'Token expired',
      status: 401,
      code: 'TOKEN_EXPIRED'
    };
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error = {
      message: 'Validation failed',
      status: 400,
      code: 'VALIDATION_ERROR',
      details: err.details
    };
  }

  // Custom application errors
  if (err.status && err.message) {
    error = {
      message: err.message,
      status: err.status,
      code: err.code || 'APPLICATION_ERROR'
    };
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && error.status === 500) {
    error.message = 'Internal server error';
    delete error.stack;
  }

  // Add request ID for tracking
  const requestId = req.headers['x-request-id'] || 
                   req.headers['x-correlation-id'] || 
                   Math.random().toString(36).substr(2, 9);

  res.status(error.status).json({
    error: error.message,
    code: error.code,
    requestId,
    timestamp: new Date().toISOString(),
    ...(error.details && { details: error.details }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode, code = 'APPLICATION_ERROR') {
    super(message);
    this.status = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden access') {
    super(message, 403, 'FORBIDDEN');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

module.exports = {
  errorHandler,
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError
};