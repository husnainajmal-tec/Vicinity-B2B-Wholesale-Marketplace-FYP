const path = require("path");
const fs = require("fs");
const multer = require("multer");

/**
 * Local-disk upload middleware (development default).
 * Files are written to /server/uploads and served statically at /uploads.
 * Swap the storage engine for Cloudinary later without touching controllers.
 */

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");

// Ensure the upload directory exists.
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // <field>-<userId>-<timestamp><ext> to avoid collisions
    const ext = path.extname(file.originalname).toLowerCase();
    const base = `${file.fieldname}-${req.user?._id || "anon"}-${Date.now()}`;
    cb(null, `${base}${ext}`);
  },
});

// Allow common image + document types.
const ALLOWED = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];

const fileFilter = (req, file, cb) => {
  if (ALLOWED.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type. Use JPG, PNG, WEBP, GIF, or PDF."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
});

/**
 * Build an absolute, publicly-reachable URL for an uploaded file.
 * @param {import("express").Request} req
 * @param {Express.Multer.File} file
 */
const fileUrl = (req, file) =>
  `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;

module.exports = { upload, fileUrl };
