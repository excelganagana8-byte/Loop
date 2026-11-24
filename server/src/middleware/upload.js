import multer from 'multer';
import { sendError } from '../utils/apiResponse.js';

const storage = multer.memoryStorage();

export const uploadCsv = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype === 'text/plain' ||
      file.originalname.toLowerCase().endsWith('.csv')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only .csv files are supported'));
    }
  }
}).single('file');

export const handleCsvUpload = (req, res, next) => {
  uploadCsv(req, res, (err) => {
    if (err) {
      return sendError(res, {
        code: 'BAD_REQUEST',
        message: err.message
      }, 400);
    }
    if (!req.file) {
      return sendError(res, {
        code: 'BAD_REQUEST',
        message: 'No CSV file was uploaded. Please attach a file under form field "file".'
      }, 400);
    }
    next();
  });
};
