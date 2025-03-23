const express = require('express');
const {body} = require("express-validator");
const { v4: uuidv4 } = require('uuid');
const { 
  handleValidationErrors
} = require('../utils/validation');
const {
  PRIORITIES, 
  DOCUMENT_TYPES, 
  RECEIVING_METHODS, 
  STATUSES, 
  ERROR_CODES
} = require('../constants');
const {
  loadDocuments,
  saveDocuments,
  getNextDocumentNumber
} = require('../utils/database');
const { configureStorage } = require('../utils/fileUpload');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure file upload with multer
const upload = configureStorage('upload/incoming-documents');

router.get("", (_, res) => {
    const documents = loadDocuments();

    res.status(201).json({ message: 'Get document success', document: documents });
  }
);

// 10 is the maximum files
router.post(
  "/",
  upload.array("attachments", 10),
  [
    body('receivedDate').isISO8601().withMessage({ code: ERROR_CODES.INVALID_DATE_FORMAT, message: 'Invalid received date format' }),
    body('issuedDate').isISO8601().withMessage({ code: ERROR_CODES.INVALID_DATE_FORMAT, message: 'Invalid issued date format' }),
    body('referenceNumber').notEmpty().withMessage({ code: ERROR_CODES.REQUIRED_FIELD, message: 'Reference number is required' }),
    body('author').notEmpty().withMessage({ code: ERROR_CODES.REQUIRED_FIELD, message: 'Author is required' }),
    body('summary').notEmpty().withMessage({ code: ERROR_CODES.REQUIRED_FIELD, message: 'Summary is required' }),
    body('priority').isIn(PRIORITIES).withMessage({ code: ERROR_CODES.INVALID_PRIORITY, message: 'Priority must be "Normal" or "Urgent"' }),
    body('dueDate').isISO8601().withMessage({ code: ERROR_CODES.INVALID_DATE_FORMAT, message: 'Invalid due date format' }),
    body('type').isIn(DOCUMENT_TYPES).withMessage({ code: ERROR_CODES.INVALID_TYPE, message: 'Invalid type' }),
    body('receivingMethod').isIn(RECEIVING_METHODS).withMessage({ code: ERROR_CODES.INVALID_METHOD, message: 'Invalid receiving method' }),
    body('processingOpinion').notEmpty().withMessage({ code: ERROR_CODES.REQUIRED_FIELD, message: 'Processing opinion is required' }),
  ],
  handleValidationErrors,
  (req, res) => {
    console.log('Files received:', req.files);
    console.log('Body received:', req.body);

    const documents = loadDocuments();

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
      status: "Waiting for processing",
    };

    documents.push(newDocument);
    saveDocuments(documents);

    res.status(201).json({ message: 'Document created successfully', document: newDocument });
  }
);

// Update Document Status API
router.patch(
  '/:documentNumber/status',
  [body('status').isIn(STATUSES).withMessage({ code: ERROR_CODES.INVALID_STATUS, message: 'Invalid status' })],
  handleValidationErrors,
  (req, res) => {
    const documents = loadDocuments();

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
    body('receivedDate').isISO8601().withMessage({ code: ERROR_CODES.INVALID_DATE_FORMAT, message: 'Invalid received date format' }),
    body('issuedDate').isISO8601().withMessage({ code: ERROR_CODES.INVALID_DATE_FORMAT, message: 'Invalid issued date format' }),
    body('referenceNumber').notEmpty().withMessage({ code: ERROR_CODES.REQUIRED_FIELD, message: 'Reference number is required' }),
    body('author').notEmpty().withMessage({ code: ERROR_CODES.REQUIRED_FIELD, message: 'Author is required' }),
    body('summary').notEmpty().withMessage({ code: ERROR_CODES.REQUIRED_FIELD, message: 'Summary is required' }),
    body('priority').isIn(PRIORITIES).withMessage({ code: ERROR_CODES.INVALID_PRIORITY, message: 'Invalid priority' }),
    body('dueDate').isISO8601().withMessage({ code: ERROR_CODES.INVALID_DATE_FORMAT, message: 'Invalid due date format' }),
    body('type').isIn(DOCUMENT_TYPES).withMessage({ code: ERROR_CODES.INVALID_TYPE, message: 'Invalid type' }),
    body('receivingMethod').isIn(RECEIVING_METHODS).withMessage({ code: ERROR_CODES.INVALID_METHOD, message: 'Invalid receiving method' }),
    body('processingOpinion').notEmpty().withMessage({ code: ERROR_CODES.REQUIRED_FIELD, message: 'Processing opinion is required' }),
    body('status').isIn(STATUSES).withMessage({ code: ERROR_CODES.INVALID_STATUS, message: 'Invalid status' }),
  ],
  handleValidationErrors,
  (req, res) => {
    const documents = loadDocuments();
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

  const filePath = path.join(__dirname, '..', 'upload', 'incoming-documents', filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found on server' });
  }

  res.download(filePath);
});

module.exports = router;