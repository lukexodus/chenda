/**
 * Delivery Proof Photo Upload Middleware
 * Handles single proof-of-delivery image uploads.
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '../../uploads/delivery-proofs');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `delivery-proof-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }

  return cb(new Error('Only jpeg, jpg, png, and webp image files are allowed.'));
};

const upload = multer({
  storage,
  limits: {
    fileSize: 7 * 1024 * 1024,
  },
  fileFilter,
});

const uploadSingleProof = upload.single('proof_photo');

const uploadProofPhoto = (req, res, next) => {
  uploadSingleProof(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 7MB.',
      });
    }

    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    return next();
  });
};

module.exports = {
  uploadProofPhoto,
  uploadsDir,
};
