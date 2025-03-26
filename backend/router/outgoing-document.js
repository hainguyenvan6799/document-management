const express = require('express');
const {body} = require("express-validator");
const { v4: uuidv4 } = require('uuid');
const { 
  handleValidationErrors
} = require('../utils/validation');
const {
  PRIORITIES, 
  DOCUMENT_TYPES, 
  STATUSES, 
  ERROR_CODES
} = require('../constants');
const {
  loadOutgoingDocuments,
  saveDocuments,
  getNextDocumentNumber
} = require('../utils/database');
const { configureStorage } = require('../utils/fileUpload');
const { downloadAttachment } = require('../utils/fileDownload');
const { applyFilters } = require('../utils/documentFilters');
const { getPaginatedDocuments } = require('../utils/paginateDocuments');

const router = express.Router();

// Configure file upload with multer
const upload = configureStorage('upload/outgoing-documents');

router.get("/", (req, res) => {
  const documents = loadOutgoingDocuments();
  const { page = 1, pageSize = 10 } = req.query;
  
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

// 10 is the maximum files
router.post(
  "/",
  upload.array("attachments", 10),
  [
    body('issuedDate').isISO8601().withMessage({ code: ERROR_CODES.INVALID_DATE_FORMAT, message: 'Invalid issued date format' }),
    body('referenceNumber').notEmpty().withMessage({ code: ERROR_CODES.REQUIRED_FIELD, message: 'Reference number is required' }),
    body('priority').isIn(PRIORITIES).withMessage({ code: ERROR_CODES.INVALID_PRIORITY, message: 'Invalid priority' }),
    body('type').isIn(DOCUMENT_TYPES).withMessage({ code: ERROR_CODES.INVALID_TYPE, message: 'Invalid type' }),
    body('signedBy').notEmpty().withMessage({ code: ERROR_CODES.REQUIRED_FIELD, message: 'Signer is required' }),
    body('signerPosition').notEmpty().withMessage({ code: ERROR_CODES.REQUIRED_FIELD, message: 'Signer position is required' }),
    body('summary').notEmpty().withMessage({ code: ERROR_CODES.REQUIRED_FIELD, message: 'Summary is required' }),
    body('externalRecipient').notEmpty().withMessage({ code: ERROR_CODES.REQUIRED_FIELD, message: 'External recipient is required' }),
    body('internalRecipient').notEmpty().withMessage({ code: ERROR_CODES.REQUIRED_FIELD, message: 'Internal recipient is required' }),
    body('status').isIn(STATUSES).withMessage({ code: ERROR_CODES.INVALID_STATUS, message: 'Invalid status' }),
  ],
  handleValidationErrors,
  (req, res) => {
    console.log('Files received:', req.files);
    console.log('Body received:', req.body);

    const documents = loadOutgoingDocuments();

    const newDocument = {
      id: uuidv4(),
      documentNumber: getNextDocumentNumber(),
      issuedDate: req.body.issuedDate,
      referenceNumber: req.body.referenceNumber,
      priority: req.body.priority,
      type: req.body.type,
      signedBy: req.body.signedBy,
      signerPosition: req.body.signerPosition,
      summary: req.body.summary,
      externalRecipient: req.body.externalRecipient,
      internalRecipient: req.body.internalRecipient,
      attachments: req.files ? req.files.map(file => file.filename) : [],
      status: "waiting",
    };

    documents.push(newDocument);
    saveDocuments(documents);

    res.status(201).json({ message: 'Document created successfully', document: newDocument });
  }
);

// Update Document Status API
router.patch(
  '/:documentNumber/status',
  [body('status').isIn(STATUSES).withMessage({ code: ERROR_CODES.INVALID_STATUS, message: 'Invalid status. Status must be "finished" or "waiting"' })],
  handleValidationErrors,
  (req, res) => {
    const documents = loadOutgoingDocuments();

    const { documentNumber } = req.params;
    const { status } = req.body;
    const document = documents.find(doc => doc.documentNumber === documentNumber);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    document.status = status;
    saveDocuments(documents);
    res.status(200).json({ message: 'Status updated successfully', document });
  }
);

// Edit Document API
router.patch(
  '/:documentNumber',
  upload.array('attachments', 10),
  [
    body('issuedDate')
      .optional()
      .isISO8601()
      .withMessage({ code: ERROR_CODES.INVALID_DATE_FORMAT, message: 'Invalid issued date format' }),
    body('referenceNumber')
      .optional()
      .notEmpty()
      .withMessage({ code: ERROR_CODES.REQUIRED_FIELD, message: 'Reference number cannot be empty if provided' }),
    body('priority')
      .optional()
      .isIn(PRIORITIES)
      .withMessage({ code: ERROR_CODES.INVALID_PRIORITY, message: 'Invalid priority' }),
    body('type')
      .optional()
      .isIn(DOCUMENT_TYPES)
      .withMessage({ code: ERROR_CODES.INVALID_TYPE, message: 'Invalid type' }),
    body('signedBy')
      .optional()
      .notEmpty()
      .withMessage({ code: ERROR_CODES.REQUIRED_FIELD, message: 'Signer cannot be empty if provided' }),
    body('signerPosition')
      .optional()
      .notEmpty()
      .withMessage({ code: ERROR_CODES.REQUIRED_FIELD, message: 'Signer position cannot be empty if provided' }),
    body('summary')
      .optional()
      .notEmpty()
      .withMessage({ code: ERROR_CODES.REQUIRED_FIELD, message: 'Summary cannot be empty if provided' }),
    body('externalRecipient')
      .optional()
      .notEmpty()
      .withMessage({ code: ERROR_CODES.REQUIRED_FIELD, message: 'External recipient cannot be empty if provided' }),
    body('internalRecipient')
      .optional()
      .notEmpty()
      .withMessage({ code: ERROR_CODES.REQUIRED_FIELD, message: 'Internal recipient cannot be empty if provided' }),
    body('status')
      .optional()
      .isIn(STATUSES)
      .withMessage({ code: ERROR_CODES.INVALID_STATUS, message: 'Invalid status' }),
  ],
  handleValidationErrors,
  (req, res) => {
    const documents = loadOutgoingDocuments();
    const { documentNumber } = req.params;
    const documentIndex = documents.findIndex(doc => doc.documentNumber === documentNumber);

    if (documentIndex === -1) {
      return res.status(404).json({ message: 'Document not found' });
    }

    documents[documentIndex] = {
      ...documents[documentIndex],
      ...req.body,
      attachments: req.files ? req.files.map(file => file.filename) : documents[documentIndex].attachments,
    };

    saveDocuments(documents);
    res.status(200).json({ message: 'Document updated successfully', document: documents[documentIndex] });
  }
);

// Download Attachment API
router.get('/attachments/:filename', (req, res) => {
  const { filename } = req.params;
  downloadAttachment(filename, 'outgoing', res);
});

// Search API
router.get('/search', (req, res) => {
  const documents = loadOutgoingDocuments();
  
  const {
    issuedDateFrom,
    issuedDateTo,
    author,
    referenceNumber,
    summary,
    page = 1,
    pageSize = 2
  } = req.query;
  
  let filteredDocuments = applyFilters(documents, { author, issuedDateFrom, issuedDateTo, referenceNumber, summary });
  
  // Pagination
  const {paginatedDocuments, pageNumber, limit, totalPages, totalItems} = getPaginatedDocuments(filteredDocuments, page, pageSize);
  
  res.status(200).json({
    message: 'Documents found',
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

module.exports = router;