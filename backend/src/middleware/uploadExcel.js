const multer = require('multer');
const path = require('path');
const fs = require('fs');

const tempUploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

const storage = multer.memoryStorage(); // Store in memory buffer so we can parse directly with xlsx

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.xlsx' || ext === '.xls' || ext === '.csv') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Please upload an Excel (.xlsx, .xls) file.'), false);
  }
};

const uploadExcel = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB limit
  },
  fileFilter
});

module.exports = uploadExcel;
