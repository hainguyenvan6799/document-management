const path = require('path');
const fs = require('fs');

// Define path to database file
const DB_FILE = path.join(__dirname, '../db.json');

// Load documents from db.json
const loadIncomingDocuments = () => {
  if (!fs.existsSync(DB_FILE)) {
    return [];
  }
  const data = fs.readFileSync(DB_FILE);
  return JSON.parse(data).incomingDocuments || [];
};

const loadOutgoingDocuments = () => {
  if (!fs.existsSync(DB_FILE)) {
    return [];
  }
  const data = fs.readFileSync(DB_FILE);
  return JSON.parse(data).outgoingDocuments || [];
};

// Save documents to db.json
const saveDocuments = (documents) => {
  fs.writeFileSync(DB_FILE, JSON.stringify({ documents }, null, 2));
};

// Get next document number
const getNextDocumentNumber = () => {
  const documents = loadIncomingDocuments();
  if (documents.length === 0) {
    return "1"; // Start from 1 if there are no documents
  }
  
  const maxNumber = Math.max(...documents.map(doc => parseInt(doc.documentNumber, 10)));
  return (maxNumber + 1).toString();
};

module.exports = {
  DB_FILE,
  loadIncomingDocuments,
  loadOutgoingDocuments,
  saveDocuments,
  getNextDocumentNumber
}; 