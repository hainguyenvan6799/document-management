function getPaginatedDocuments(documents, page, pageSize) {
	const totalItems = documents.length;
	const totalPages = Math.ceil(totalItems / pageSize);
	const pageNumber = parseInt(page);
	const limit = parseInt(pageSize);

	const startIndex = (pageNumber - 1) * limit;
	const endIndex = pageNumber * limit;

	const paginatedDocuments = documents.slice(startIndex, endIndex);

	return {paginatedDocuments, pageNumber, limit, totalPages, totalItems}
};

module.exports = {
  getPaginatedDocuments
};