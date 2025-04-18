const express = require('express');
const { body } = require("express-validator");
const { v4: uuidv4 } = require('uuid');
const {
  handleValidationErrors
} = require('../utils/validation');
const {
  PRIORITIES,
  DOCUMENT_TYPES,
  STATUSES,
  ERROR_CODES,
  PAGINATION,
  DOCUMENT_TYPE_SHORTCUTS,
  DOCUMENT_STATUS,
  DATE_FORMATS
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
const path = require('path');
const fs = require('fs');
const { MESSAGE_CODES } = require('../constants/errorCodes');
const { deleteFiles } = require('../utils/fileDelete');
const router = express.Router();

// Configure file upload with multer
const upload = configureStorage('upload/outgoing-documents');

router.get("/", (req, res) => {
  const documents = loadOutgoingDocuments();
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
    body('issuedDate')
      .notEmpty().withMessage({ code: ERROR_CODES.REQUIRED_FIELD, message: `Not empty` }),
    body('referenceNumber').notEmpty().withMessage({ code: ERROR_CODES.REQUIRED_FIELD, message: 'Reference number is required' }),
    body('priority').isIn(PRIORITIES).withMessage({ code: ERROR_CODES.INVALID_PRIORITY, message: 'Invalid priority' }),
    body('type').isIn(DOCUMENT_TYPES).withMessage({ code: ERROR_CODES.INVALID_TYPE, message: 'Invalid type' }),
    body('signedBy').notEmpty().withMessage({ code: ERROR_CODES.REQUIRED_FIELD, message: 'Signer is required' }),
    body('signerPosition').notEmpty().withMessage({ code: ERROR_CODES.REQUIRED_FIELD, message: 'Signer position is required' }),
    body('summary').notEmpty().withMessage({ code: ERROR_CODES.REQUIRED_FIELD, message: 'Summary is required' }),
    body('internalRecipients').notEmpty().withMessage({ code: ERROR_CODES.REQUIRED_FIELD, message: 'Internal recipient is required' }),
    body('status').isIn(STATUSES).withMessage({ code: ERROR_CODES.INVALID_STATUS, message: 'Invalid status' }),
  ],
  handleValidationErrors,
  (req, res) => {

    const documents = loadOutgoingDocuments();

    if (Array.isArray(req.body.internalRecipients) && req.body.internalRecipients.length === 0) {
      return res.status(200).json({
        message: MESSAGE_CODES.VALIDATION_FAILED,
        errors: {
          internalRecipients: [{
            code: 'ERR_REQUIRED_FIELD'
          }]
        }
      });
    }
    const newDocument = {
      id: uuidv4(),
      documentNumber: getNextDocumentNumber(false),
      issuedDate: req.body.issuedDate,
      referenceNumber: req.body.referenceNumber,
      priority: req.body.priority,
      type: req.body.type,
      signedBy: req.body.signedBy,
      signerPosition: req.body.signerPosition,
      summary: req.body.summary,
      internalRecipients: req.body.internalRecipients,
      attachments: req.files ? req.files.map(file => file.filename) : [],
      status: DOCUMENT_STATUS.WAITING,
    };

    documents.push(newDocument);
    saveDocuments(documents, false);

    res.status(201).json({ message: 'Document created successfully', document: newDocument });
  }
);
router.get('/detail/:documentNumber', (req, res) => {
  const { documentNumber } = req.params;
  const documents = loadOutgoingDocuments();
  const document = documents.find(doc => doc.documentNumber === documentNumber);
  if (!document) {
    return res.status(404).json({ message: 'Document not found' });
  }

  res.status(200).json({ message: 'Get documents successfully', document });
});

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
    saveDocuments(documents, false);
    res.status(200).json({ message: 'Status updated successfully', document });
  }
);

// Edit Document API
router.patch(
  '/:documentNumber',
  upload.array('attachments', PAGINATION.MAX_ATTACHMENTS),
  [
    body('issuedDate')
      .optional()
      .matches(DATE_FORMATS.DD_MM_YYYY_REGEX)
      .withMessage({ code: ERROR_CODES.INVALID_DATE_FORMAT, message: `Invalid issued date format. Use ${DATE_FORMATS.DD_MM_YYYY_FORMAT}` }),
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
    body('internalRecipients')
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

    if (Array.isArray(req.body.internalRecipients) && req.body.internalRecipients.length === 0) {
      return res.status(200).json({
        message: MESSAGE_CODES.VALIDATION_FAILED,
        errors: {
          internalRecipients: [{
            code: 'ERR_REQUIRED_FIELD'
          }]
        }
      });
    }

    const documents = loadOutgoingDocuments();
    const { documentNumber } = req.params;
    const documentIndex = documents.findIndex(doc => doc.documentNumber === documentNumber);

    if (documentIndex === -1) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const filesToDelete = getFilesToDelete(req.body.filesToDelete);
    if (filesToDelete.length > 0) {
      deleteFiles(filesToDelete, false);
      documents[documentIndex].attachments = documents[documentIndex].attachments.filter(attachment => !filesToDelete.includes(attachment));
    }

    // make sure document not have "filesToDelete" when saving
    delete (req.body.filesToDelete);

    const oldInternalRecipients = documents[documentIndex].internalRecipients;
    const oldAttachments = documents[documentIndex].attachments;
    console.log(oldInternalRecipients);

    documents[documentIndex] = {
      ...documents[documentIndex],
      ...req.body,
      attachments: req.files ? [...oldAttachments, ...req.files.map(file => file.filename)] : oldAttachments,
      internalRecipients: mappingInternalRecipients(req.body.internalRecipients, oldInternalRecipients),
    };

    saveDocuments(documents, false);
    res.status(200).json({ message: 'Document updated successfully', document: documents[documentIndex] });
  }
);

function getFilesToDelete(filesToDelete) {
  if (Array.isArray(filesToDelete)) return filesToDelete;
  return [];
}

function mappingInternalRecipients(internalRecipients, oldInternalRecipients) {
  if (!internalRecipients) return oldInternalRecipients;
  if (Array.isArray(internalRecipients)) return internalRecipients;
  return [];
}

// Download Attachment API
router.get('/attachments/:filename', (req, res) => {
  const { filename } = req.params;
  downloadAttachment(filename, DOCUMENT_TYPE_SHORTCUTS.OUTGOING, res);
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

  const documents = loadOutgoingDocuments();
  const documentIndex = documents.findIndex(doc => doc.documentNumber === documentNumber);

  if (documentIndex === -1) {
    return res.status(404).json({ message: 'Document not found' });
  }

  fs.unlink(filePath, (err) => {
    // if (err) {
    //   return res.status(500).json({ message: 'Error deleting file', error: err });
    // }
    documents[documentIndex].attachments = documents[documentIndex].attachments.filter((doc) => doc !== filename);
    saveDocuments(documents, false);

    res.status(200).json({ message: 'Document and file deleted successfully!', attachments: documents[documentIndex].attachments });
  })
})

module.exports = router;