const express = require('express');
const cors = require('cors');
const fs = require('fs');
const incomingDocumentRouter = require("./router/incoming-document");
const outgoingDocumentRouter = require("./router/outgoing-document");

const app = express();
app.use(cors());
app.use(express.json());

app.use('', (req, res) => {
  res.send('Hello World!');
});

app.use("/incoming-documents", incomingDocumentRouter);
app.use("/outgoing-documents", outgoingDocumentRouter);

// Read database function
const readDB = () => {
  const data = fs.readFileSync(DB_FILE);
  return JSON.parse(data);
};

// Get all documents
app.get('/documents', (req, res) => {
  const db = readDB();
  res.json(db.documents);
});

// Get a document by ID
app.get('/documents/:id', (req, res) => {
  const db = readDB();
  const doc = db.documents.find((d) => d.id == req.params.id);
  res.json(doc || {});
});

// Add a new document
app.post('/documents', (req, res) => {
  const db = readDB();
  const newDoc = { id: Date.now(), ...req.body };
  db.documents.push(newDoc);
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  res.status(201).json(newDoc);
});

// Delete a document
app.delete('/documents/:id', (req, res) => {
  let db = readDB();
  db.documents = db.documents.filter((d) => d.id != req.params.id);
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  res.status(200).json({ message: 'Deleted successfully' });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
