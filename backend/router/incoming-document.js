const express = require('express');
const { body } = require("express-validator");
const { v4: uuidv4 } = require('uuid');
const {
  handleValidationErrors
} = require('../utils/validation');
const {
  PRIORITIES,
  DOCUMENT_TYPES,
  RECEIVING_METHODS,
  STATUSES,
  ERROR_CODES,
  PAGINATION,
  DOCUMENT_TYPE_SHORTCUTS,
  DOCUMENT_STATUS,
  DATE_FORMATS
} = require('../constants');
const {
  loadIncomingDocuments,
  saveDocuments,
  getNextDocumentNumber
} = require('../utils/database');
const { configureStorage } = require('../utils/fileUpload');
const { downloadAttachment } = require('../utils/fileDownload');
const { applyFilters } = require('../utils/documentFilters');
const { getPaginatedDocuments } = require('../utils/paginateDocuments');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Configure file upload with multer
const upload = configureStorage('upload/incoming-documents');

router.get("/", (req, res) => {
  const documents = loadIncomingDocuments();
  const {
    page = PAGINATION.DEFAULT_PAGE,
    pageSize = PAGINATION.DEFAULT_PAGE_SIZE
  } = req.query;

  const {
    paginatedDocuments,
    pageNumber,
    limit,
    totalPages,
    totalItems
  } = getPaginatedDocuments(documents, page, pageSize);

  res.status(200).json({
    message: 'Get documents success',
    data: {
      documents: paginatedDocuments,
      pagination: {
        totalItems,
        totalPages,
        currentPage: pageNumber,
        pageSize: limit
      }
    }
  });
});

// Use MAX_ATTACHMENTS constant
router.post(
  "/",
  upload.array("attachments", PAGINATION.MAX_ATTACHMENTS),
  [
    body('receivedDate').notEmpty().withMessage({ code: ERROR_CODES.REQUIRED_FIELD, message: `Not empty` }),
    body('issuedDate').notEmpty().withMessage({ code: ERROR_CODES.REQUIRED_FIELD, message: `Not empty` }),
    body('referenceNumber').notEmpty().withMessage({ code: ERROR_CODES.REQUIRED_FIELD, message: 'Reference number is required' }),
    body('author').notEmpty().withMessage({ code: ERROR_CODES.REQUIRED_FIELD, message: 'Author is required' }),
    body('summary').notEmpty().withMessage({ code: ERROR_CODES.REQUIRED_FIELD, message: 'Summary is required' }),
    body('priority').isIn(PRIORITIES).withMessage({ code: ERROR_CODES.INVALID_PRIORITY, message: 'Priority must be "Normal" or "Urgent"' }),
    body('dueDate').notEmpty().withMessage({ code: ERROR_CODES.REQUIRED_FIELD, message: `Not empty` }),
    body('type').isIn(DOCUMENT_TYPES).withMessage({ code: ERROR_CODES.INVALID_TYPE, message: 'Invalid type' }),
    body('receivingMethod').isIn(RECEIVING_METHODS).withMessage({ code: ERROR_CODES.INVALID_METHOD, message: 'Invalid receiving method' }),
    body('processingOpinion').notEmpty().withMessage({ code: ERROR_CODES.REQUIRED_FIELD, message: 'Processing opinion is required' }),
  ],
  handleValidationErrors,
  (req, res) => {
    const documents = loadIncomingDocuments();

    const newDocument = {
      id: uuidv4(),
      documentNumber: getNextDocumentNumber(),
      receivedDate: req.body.receivedDate,
      issuedDate: req.body.issuedDate,
      referenceNumber: req.body.referenceNumber,
      author: req.body.author,
      summary: req.body.summary,
      priority: req.body.priority,
      dueDate: req.body.dueDate,
      type: req.body.type,
      receivingMethod: req.body.receivingMethod,
      attachments: req.files ? req.files.map(file => file.filename) : [],
      processingOpinion: req.body.processingOpinion,
      status: DOCUMENT_STATUS.WAITING,
      internalRecipient: "",
    };

    documents.push(newDocument);
    saveDocuments(documents, true);

    res.status(201).json({ message: 'Document created successfully', document: newDocument });
  }
);

// Update Document Status API
router.patch(
  '/:documentNumber/status',
  [body('status').isIn(STATUSES).withMessage({ code: ERROR_CODES.INVALID_STATUS, message: 'Invalid status' })],
  handleValidationErrors,
  (req, res) => {
    const documents = loadIncomingDocuments();

    const { documentNumber } = req.params;
    const { status } = req.body;
    const document = documents.find(doc => doc.documentNumber === documentNumber);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    document.status = status;
    saveDocuments(documents, true);
    res.status(200).json({ message: 'Status updated successfully', document });
  }
);

router.get('/:documentNumber', (req, res) => {
  const { documentNumber } = req.params;
  const documents = loadIncomingDocuments();
  const document = documents.find(doc => doc.documentNumber === documentNumber);
  if (!document) {
    return res.status(404).json({ message: 'Document not found' });
  }

  res.status(200).json({ message: 'Get documents successfully', document });
});

// Edit Document API
router.patch(
  '/:documentNumber',
  upload.array('attachments', PAGINATION.MAX_ATTACHMENTS),
  [
    body('receivedDate')
      .optional()
      .notEmpty()
      .withMessage({ code: ERROR_CODES.REQUIRED_FIELD, message: `Not empty` }),
    body('issuedDate')
      .optional()
      .notEmpty()
      .withMessage({ code: ERROR_CODES.REQUIRED_FIELD, message: `Not empty` }),
    body('referenceNumber')
      .optional()
      .notEmpty()
      .withMessage({ code: ERROR_CODES.REQUIRED_FIELD, message: 'Reference number cannot be empty if provided' }),
    body('author')
      .optional()
      .notEmpty()
      .withMessage({ code: ERROR_CODES.REQUIRED_FIELD, message: 'Author cannot be empty if provided' }),
    body('summary')
      .optional()
      .notEmpty()
      .withMessage({ code: ERROR_CODES.REQUIRED_FIELD, message: 'Summary cannot be empty if provided' }),
    body('priority')
      .optional()
      .isIn(PRIORITIES)
      .withMessage({ code: ERROR_CODES.INVALID_PRIORITY, message: 'Invalid priority' }),
    body('dueDate')
      .optional()
      .notEmpty()
      .withMessage({ code: ERROR_CODES.REQUIRED_FIELD, message: `Not empty` }),
    body('type')
      .optional()
      .isIn(DOCUMENT_TYPES)
      .withMessage({ code: ERROR_CODES.INVALID_TYPE, message: 'Invalid type' }),
    body('receivingMethod')
      .optional()
      .isIn(RECEIVING_METHODS)
      .withMessage({ code: ERROR_CODES.INVALID_METHOD, message: 'Invalid receiving method' }),
    body('processingOpinion')
      .optional()
      .notEmpty()
      .withMessage({ code: ERROR_CODES.REQUIRED_FIELD, message: 'Processing opinion cannot be empty if provided' }),
    body('status')
      .optional()
      .isIn(STATUSES)
      .withMessage({ code: ERROR_CODES.INVALID_STATUS, message: 'Invalid status' }),
    body('internalRecipient')
      .optional()
      .notEmpty()
      .withMessage({ code: ERROR_CODES.REQUIRED_FIELD, message: 'Internal recipient cannot be empty if provided' }),
  ],
  handleValidationErrors,
  (req, res) => {
    const documents = loadIncomingDocuments();
    const { documentNumber } = req.params;
    const documentIndex = documents.findIndex(doc => doc.documentNumber === documentNumber);

    if (documentIndex === -1) {
      return res.status(404).json({ message: 'Document not found' });
    }

    documents[documentIndex] = {
      ...documents[documentIndex],
      ...req.body,
      attachments: req.files
        ? [
          ...documents[documentIndex].attachments,
          ...req.files.map(file => file.filename),
        ]
        : documents[documentIndex].attachments
    };
    saveDocuments(documents, true);
    res.status(200).json({ message: 'Document updated successfully', document: documents[documentIndex] });
  }
);

// Download Attachment API
router.get('/attachments/:filename', (req, res) => {
  const { filename } = req.params;
  downloadAttachment(filename, DOCUMENT_TYPE_SHORTCUTS.INCOMING, res);
});

// Search API
router.get('/search', (req, res) => {
  const documents = loadIncomingDocuments();

  const {
    issuedDateFrom,
    issuedDateTo,
    author,
    referenceNumber,
    summary,
    page = PAGINATION.DEFAULT_PAGE,
    pageSize = PAGINATION.SEARCH_PAGE_SIZE
  } = req.query;

  let filteredDocuments = applyFilters(documents, { author, issuedDateFrom, issuedDateTo, referenceNumber, summary });

  const { paginatedDocuments, pageNumber, limit, totalPages, totalItems } = getPaginatedDocuments(filteredDocuments, page, pageSize);

  res.status(200).json({
    message: 'Documents found',
    data: {
      paginatedDocuments,
      filteredDocuments,
      pagination: {
        totalItems,
        totalPages,
        currentPage: pageNumber,
        pageSize: limit
      }
    }
  });
});

router.delete('/:documentNumber/:filename', (req, res) => {
  const { documentNumber, filename } = req.params;
  const filePath = path.join(__dirname, '../upload/incoming-documents', filename);

  const documents = loadIncomingDocuments();
  const documentIndex = documents.findIndex(doc => doc.documentNumber === documentNumber);

  if (documentIndex === -1) {
    return res.status(404).json({ message: 'Document not found' });
  }

  fs.unlink(filePath, (err) => {
    // if (err) {
    //   return res.status(500).json({ message: 'Error deleting file', error: err });
    // }
    documents[documentIndex].attachments = documents[documentIndex].attachments.filter((doc) => doc !== filename);
    saveDocuments(documents);

    res.status(200).json({ message: 'Document and file deleted successfully!', attachments: documents[documentIndex].attachments });
  })
})

module.exports = router;