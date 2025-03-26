/**
 * Parse a date string from DD/MM/YYYY format to Date object
 * @param {string} dateString - Date in DD/MM/YYYY format
 * @returns {Date} Parsed date object
 */
function parseDate(dateString) {
  const [day, month, year] = dateString.split('/');
  return new Date(`${month}/${day}/${year}`);
}

/**
 * Filter documents by author name
 * @param {Object} doc - Document object
 * @param {string} author - Author name to filter by
 * @returns {boolean} True if document matches filter
 */
function filterByAuthor(doc, author) {
  if (!author) return true;
  return doc.author.toLowerCase().includes(author.toLowerCase());
}

/**
 * Filter documents by start date
 * @param {Object} doc - Document object
 * @param {string} issuedDateFrom - Start date in DD/MM/YYYY format
 * @returns {boolean} True if document matches filter
 */
function filterByDateFrom(doc, issuedDateFrom) {
  if (!issuedDateFrom) return true;
  const start = parseDate(issuedDateFrom);
  const docDate = parseDate(doc.issuedDate);
  return docDate >= start;
}

/**
 * Filter documents by end date
 * @param {Object} doc - Document object
 * @param {string} issuedDateTo - End date in DD/MM/YYYY format
 * @returns {boolean} True if document matches filter
 */
function filterByDateTo(doc, issuedDateTo) {
  if (!issuedDateTo) return true;
  const end = parseDate(issuedDateTo);
  end.setHours(23, 59, 59, 999); // Set to end of day
  const docDate = parseDate(doc.issuedDate);
  return docDate <= end;
}

/**
 * Filter documents by reference number
 * @param {Object} doc - Document object
 * @param {string} referenceNumber - Reference number to filter by
 * @returns {boolean} True if document matches filter
 */
function filterByReferenceNumber(doc, referenceNumber) {
  if (!referenceNumber) return true;
  return doc.referenceNumber.toLowerCase().includes(referenceNumber.toLowerCase());
}

/**
 * Filter documents by summary text
 * @param {Object} doc - Document object
 * @param {string} summary - Summary text to filter by
 * @returns {boolean} True if document matches filter
 */
function filterBySummary(doc, summary) {
  if (!summary) return true;
  return doc.summary.toLowerCase().includes(summary.toLowerCase());
}

/**
 * Apply all filters to a document collection
 * @param {Array} documents - Array of documents to filter
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered documents
 */
function applyFilters(documents, { author, issuedDateFrom, issuedDateTo, referenceNumber, summary }) {
  return documents.filter(doc => 
    filterByAuthor(doc, author) &&
    filterByDateFrom(doc, issuedDateFrom) &&
    filterByDateTo(doc, issuedDateTo) &&
    filterByReferenceNumber(doc, referenceNumber) &&
    filterBySummary(doc, summary)
  );
}

module.exports = {
  parseDate,
  filterByAuthor,
  filterByDateFrom,
  filterByDateTo,
  filterByReferenceNumber,
  filterBySummary,
  applyFilters
}; 

// function filterByAuthor(doc, author) {
//     if (!author) return true;
//     return doc.author.toLowerCase().includes(author.toLowerCase());
//   }
  
//   function parseDate(dateString) {
//     const [day, month, year] = dateString.split('/');
//     return new Date(`${month}/${day}/${year}`);
//   }
  
//   function filterByDateFrom(doc, issuedDateFrom) {
//     if (!issuedDateFrom) return true;
//     const start = parseDate(issuedDateFrom);
//     const docDate = parseDate(doc.issuedDate);
//     return docDate >= start;
//   }
  
//   function filterByDateTo(doc, issuedDateTo) {
//     if (!issuedDateTo) return true;
//     const end = parseDate(issuedDateTo);
//     end.setHours(23, 59, 59, 999); // Set to end of day
//     const docDate = parseDate(doc.issuedDate);
//     return docDate <= end;
//   }
  
//   function filterByReferenceNumber(doc, referenceNumber) {
//     if (!referenceNumber) return true;
//     return doc.referenceNumber.toLowerCase().includes(referenceNumber.toLowerCase());
//   }
  
//   function filterBySummary(doc, summary) {
//     if (!summary) return true;
//     return doc.summary.toLowerCase().includes(summary.toLowerCase());
//   }