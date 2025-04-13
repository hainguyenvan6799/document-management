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
const saveDocuments = (documents, isIncoming = true) => {
  // Đọc dữ liệu hiện tại từ file
  let currentData = {};
  if (fs.existsSync(DB_FILE)) {
    const data = fs.readFileSync(DB_FILE);
    currentData = JSON.parse(data);
  }

  // Cập nhật dữ liệu mới vào đối tượng hiện tại
  if (isIncoming) {
    currentData.incomingDocuments = documents;
  } else {
    currentData.outgoingDocuments = documents;
  }

  // Ghi dữ liệu đã cập nhật vào file
  fs.writeFileSync(DB_FILE, JSON.stringify(currentData, null, 2));
};

// Get next document number
const getNextDocumentNumber = (isIncoming = true) => {
  const documents = isIncoming ? loadIncomingDocuments() : loadOutgoingDocuments();
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