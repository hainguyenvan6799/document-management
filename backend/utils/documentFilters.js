/**
 * Parse a date string from DD/MM/YYYY format to Date object
 * @param {string} dateString - Date in DD/MM/YYYY format
 * @returns {Date|null} Parsed date object or null if invalid
 */
function parseDate(dateString) {
  if (!dateString) return null;
  
  try {
    const [day, month, year] = dateString.split('/');
    // Basic validation
    if (!day || !month || !year) {
      console.log(`Error parsing date: ${dateString} does not have the expected format DD/MM/YYYY`);
      return null;
    }
    
    // Create date with correct format MM/DD/YYYY for JS Date
    const dateObj = new Date(`${month}/${day}/${year}`);
    
    // Verify if the date is valid
    if (isNaN(dateObj.getTime())) {
      console.log(`Error: invalid date created for ${dateString}`);
      return null;
    }
    
    return dateObj;
  } catch (error) {
    console.log(`Error processing date ${dateString}:`, error);
    return null;
  }
}

/**
 * Filter documents by author name
 * @param {Object} doc - Document object
 * @param {string} author - Author name to filter by
 * @returns {boolean} True if document matches filter
 */
function filterByAuthor(doc, author) {
  if (!author) return true;
  if (!doc.author) return false;
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
  if (!doc.issuedDate) return false; // If document has no date, no match
  
  const start = parseDate(issuedDateFrom);
  const docDate = parseDate(doc.issuedDate);
  
  // If either date is invalid
  if (!start || !docDate) {
    console.log(`Date filter from: invalid date - doc: ${doc.issuedDate}, filter: ${issuedDateFrom}`);
    return false;
  }
  
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
  if (!doc.issuedDate) return false; // If document has no date, no match
  
  const end = parseDate(issuedDateTo);
  const docDate = parseDate(doc.issuedDate);
  
  // If either date is invalid
  if (!end || !docDate) {
    console.log(`Date filter to: invalid date - doc: ${doc.issuedDate}, filter: ${issuedDateTo}`);
    return false;
  }
  
  // Set to end of day
  end.setHours(23, 59, 59, 999);
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
  if (!doc.referenceNumber) return false;
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
  if (!doc.summary) return false;
  return doc.summary.toLowerCase().includes(summary.toLowerCase());
}

/**
 * Apply all filters to a document collection
 * @param {Array} documents - Array of documents to filter
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered documents
 */
function applyFilters(documents, { author, issuedDateFrom, issuedDateTo, referenceNumber, summary }) {
  console.log(`Applying filters with the following criteria:`, {
    author: author || 'Not specified',
    issuedDateFrom: issuedDateFrom || 'Not specified',
    issuedDateTo: issuedDateTo || 'Not specified',
    referenceNumber: referenceNumber || 'Not specified',
    summary: summary || 'Not specified'
  });
  
  console.log(`Total documents before filtering: ${documents.length}`);
  
  // Check if there are any active filters
  const hasActiveFilters = author || issuedDateFrom || issuedDateTo || referenceNumber || summary;
  if (!hasActiveFilters) {
    console.log('No active filters, returning all documents');
    return documents;
  }
  
  const filteredDocuments = documents.filter(doc => 
    filterByAuthor(doc, author) &&
    filterByDateFrom(doc, issuedDateFrom) &&
    filterByDateTo(doc, issuedDateTo) &&
    filterByReferenceNumber(doc, referenceNumber) &&
    filterBySummary(doc, summary)
  );
  
  console.log(`Total documents after filtering: ${filteredDocuments.length}`);
  return filteredDocuments;
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