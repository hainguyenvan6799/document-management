/**
 * Get paginated documents from a document array
 * @param {Array} documents - Array of documents to paginate
 * @param {number|string} page - Page number (1-based)
 * @param {number|string} pageSize - Number of items per page
 * @returns {Object} Paginated results and metadata
 */
function getPaginatedDocuments(documents, page = 1, pageSize = 10) {
	const totalItems = documents.length;
	const pageNumber = parseInt(page);
	const limit = parseInt(pageSize);
	const totalPages = Math.ceil(totalItems / limit);

	const startIndex = (pageNumber - 1) * limit;
	const endIndex = pageNumber * limit;

	const paginatedDocuments = documents.slice(startIndex, endIndex);

	return {
		paginatedDocuments,
		pageNumber,
		limit,
		totalPages,
		totalItems
	};
}

module.exports = {
	getPaginatedDocuments
};