// Error codes for validation
const ERROR_CODES = {
  INVALID_DATE_FORMAT: 'ERR_INVALID_DATE_FORMAT',
  REQUIRED_FIELD: 'ERR_REQUIRED_FIELD',
  INVALID_STRING: 'ERR_INVALID_STRING',
  INVALID_PRIORITY: 'ERR_INVALID_PRIORITY',
  INVALID_TYPE: 'ERR_INVALID_TYPE',
  INVALID_METHOD: 'ERR_INVALID_METHOD',
  INVALID_STATUS: 'ERR_INVALID_STATUS',
};

const MESSAGE_CODES = {
  VALIDATION_FAILED: 'Validation Failed'
}
module.exports = {ERROR_CODES, MESSAGE_CODES}; 