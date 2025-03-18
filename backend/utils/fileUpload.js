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
      console.log('Processing file upload:', file.originalname);
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  });

  return multer({ storage });
};

module.exports = {
  configureStorage
}; 