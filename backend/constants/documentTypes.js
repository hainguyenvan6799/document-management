// Document types
const PRIORITIES = ['Normal', 'Urgent'];
const DOCUMENT_TYPES = ["Report", "Paper", "Plan", "Announcement", "Decision"];
const RECEIVING_METHODS = ['Letter', 'Email'];
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