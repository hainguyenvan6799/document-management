const { validationResult } = require('express-validator');
const { MESSAGE_CODES } = require('../constants/errorCodes');

// Format validation errors for frontend display
const formatValidationErrors = (errors) => {
  const formattedErrors = {};
  errors.array().forEach(error => {
    if (!formattedErrors[error.path]) {
      formattedErrors[error.path] = [];
    }
    // Handle both string and object error messages
    const errorInfo = typeof error.msg === 'object' 
      ? error.msg 
      : { code: 'ERR_VALIDATION_FAILED', message: error.msg };
    
    formattedErrors[error.path].push(errorInfo);
  });
  return formattedErrors;
};

// Handle validation errors in route handlers
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(200).json({ 
      message: MESSAGE_CODES.VALIDATION_FAILED,
      errors: formatValidationErrors(errors)
    });
  }
  next();
};

module.exports = {
  formatValidationErrors,
  handleValidationErrors
}; 