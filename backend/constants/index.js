const documentTypes = require('./documentTypes');
const { ERROR_CODES } = require('./errorCodes');
const { DATE_FORMATS } = require('./dateFormats');

module.exports = {
  ...documentTypes,
  ERROR_CODES,
  DATE_FORMATS
}; 