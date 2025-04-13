const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Setup storage for file uploads
const configureStorage = (uploadDir = 'upload') => {
  const storage = multer.diskStorage({
    destination: (_, __, cb) => {
      const uploadPath = path.join(__dirname, '..', uploadDir);
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (_, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  });

  const fileFilter = (_, file, cb) => {
    // Check if the file name is exist in the upload directory
    const regex = /(\d+)-(.*)/;
    const matchedContent = file.originalname.match(regex);
    cb(null, matchedContent ? false : true);
  }

  return multer({ storage, fileFilter });
};

module.exports = {
  configureStorage
}; 