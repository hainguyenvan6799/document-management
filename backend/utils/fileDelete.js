const fs = require('fs');
const path = require('path');

const deleteFiles = (filesToDelete, isIncomingDocument = true) => {
  const uploadDir = isIncomingDocument ? '../upload/incoming-documents' : '../upload/outgoing-documents';

  for (const fileName of filesToDelete) {
    const filePath = path.join(__dirname, uploadDir, fileName);
    if (fs.existsSync(filePath) === false) continue;
    fs.unlink(filePath, (err) => {
      if (err) console.error('Error deleting file:', err);
    });
  }
}

module.exports = { deleteFiles };