const path = require('path');
const fs = require('fs');

/**
 * Download a file attachment
 * @param {string} filename - The name of the file to download
 * @param {string} documentType - The type of document ('incoming' or 'outgoing')
 * @param {object} res - Express response object
 * @returns {void}
 */
function downloadAttachment(filename, documentType, res) {
  try {
    const uploadDir = documentType === 'incoming' ? 'incoming-documents' : 'outgoing-documents';
    const filePath = path.join(__dirname, '..', 'upload', uploadDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }
    
    res.download(filePath);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ message: 'Error downloading file' });
  }
}

module.exports = {
  downloadAttachment
}; 