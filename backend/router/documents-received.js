const express = require('express');
const {body, validationResult} = require("express-validator");
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Load documents from db.json
const loadDocuments = () => {
  if (!fs.existsSync(DB_FILE)) {
    return [];
  }
  const data = fs.readFileSync(DB_FILE);
  return JSON.parse(data).documents || [];
};

// Save documents to db.json
const saveDocuments = (documents) => {
  fs.writeFileSync(DB_FILE, JSON.stringify({ documents }, null, 2));
};

// Setup storage for file uploads
const storage = multer.diskStorage({
  destination: (_, _, cb) => {
    const uploadPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (_, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({storage});

// 10 is the maximum files
router.post(
  "/",
  upload.array("attachments", 10),
  [
    body('receivedDate').isISO8601().withMessage('Invalid received date format'),
    body('issuedDate').isISO8601().withMessage('Invalid issued date format'),
    body('referenceNumber').notEmpty().withMessage('Reference number is required'),
    body('author').notEmpty().withMessage('Author is required'),
    body('summary').notEmpty().withMessage('Summary is required'),
    body('priority').isIn(['Normal', 'Urgent']).withMessage('Invalid priority'),
    body('dueDate').isISO8601().withMessage('Invalid due date format'),
    body('type').isIn(["Report", "Paper", "Plan", "Announcement", "Decision"]).withMessage('Invalid type'),
    body('receivingMethod').isIn(['Letter', 'Email']).withMessage('Invalid receiving method'),
    body('processingOpinion').optional().isString(),
    body('status').isIn(['Finished', "Waiting for processing"]).withMessage('Invalid status'),
  ],
  (req, res) => createNewDocument(req, res)
);

function createNewDocument(req, res) {
  const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

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

function getNextDocumentNumber() {
  if (documents.length === 0) {
    return "1"; // Start from 1 if there are no documents
  }
  
  const maxNumber = Math.max(...documents.map(doc => parseInt(doc.documentNumber, 10)));
  return (maxNumber + 1).toString();
};

// Update Document Status API
router.put(
  '/:documentNumber/status',
  [body('status').isIn(['Finished', "Waiting for processing"]).withMessage('Invalid status')],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

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
router.put(
  '/:documentNumber',
  upload.array('attachments', 10),
  [
    body('receivedDate').isISO8601().withMessage('Invalid received date format'),
    body('issuedDate').isISO8601().withMessage('Invalid issued date format'),
    body('referenceNumber').notEmpty().withMessage('Reference number is required'),
    body('author').notEmpty().withMessage('Author is required'),
    body('summary').notEmpty().withMessage('Summary is required'),
    body('priority').isIn(['Normal', 'Urgent']).withMessage('Invalid priority'),
    body('dueDate').isISO8601().withMessage('Invalid due date format'),
    body('type').isIn(["Report", "Paper", "Plan", "Announcement", "Decision"]).withMessage('Invalid type'),
    body('receivingMethod').isIn(['Letter', 'Email']).withMessage('Invalid receiving method'),
    body('processingOpinion').optional().isString(),
    body('status').isIn(['Finished', "Waiting for processing"]).withMessage('Invalid status'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

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

module.exports = router;