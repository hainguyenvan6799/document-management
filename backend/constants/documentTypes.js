// Document types
const PRIORITIES = ['normal', 'urgent'];
const DOCUMENT_TYPES = ["report", "correspondence", "plan", "announcement", "decision"];
const RECEIVING_METHODS = ['letter', 'email'];
const STATUSES = ["finished", "waiting"];
const DOCUMENT_STATUS = {
  FINISHED: "finished",
  WAITING: "waiting"
};
const DOCUMENT_TYPE_SHORTCUTS = {
  INCOMING: "incoming",
  OUTGOING: "outgoing"
};

const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  SEARCH_PAGE_SIZE: 2,  // Special page size for search results
  MAX_ATTACHMENTS: 10   // Maximum number of attachments allowed
};

module.exports = {
  PRIORITIES,
  DOCUMENT_TYPES,
  RECEIVING_METHODS,
  STATUSES,
  DOCUMENT_TYPE_SHORTCUTS,
  PAGINATION,
  DOCUMENT_STATUS
}; 