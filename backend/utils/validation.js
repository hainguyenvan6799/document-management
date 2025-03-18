const { validationResult } = require('express-validator');

// Format validation errors for frontend display
const formatValidationErrors = (errors) => {
  const formattedErrors = {};
  errors.array().forEach(error => {
    if (!formattedErrors[error.param]) {
      formattedErrors[error.param] = [];
    }
    // Handle both string and object error messages
    const errorInfo = typeof error.msg === 'object' 
      ? error.msg 
      : { code: 'ERR_VALIDATION_FAILED', message: error.msg };
    
    formattedErrors[error.param].push(errorInfo);
  });
  return formattedErrors;
};

// Handle validation errors in route handlers
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed',
      errors: formatValidationErrors(errors)
    });
  }
  next();
};

module.exports = {
  formatValidationErrors,
  handleValidationErrors
}; 