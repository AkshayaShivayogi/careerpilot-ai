import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const RESUME_UPLOAD_DIR = path.join(__dirname, "..", "uploads", "resumes");

fs.mkdirSync(RESUME_UPLOAD_DIR, { recursive: true });

const ALLOWED = /\.(pdf|docx)$/i;
const MAX_BYTES = 5 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, RESUME_UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^\w.\-]/gi, "_");
    cb(null, `${Date.now()}-${safe}`);
  },
});

function fileFilter(_req, file, cb) {
  if (!ALLOWED.test(file.originalname)) {
    const err = new Error("Only PDF and DOCX files are supported");
    err.statusCode = 400;
    return cb(err);
  }
  cb(null, true);
}

export const resumeUpload = multer({
  storage,
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter,
});

export function handleMulterError(err, _req, res, next) {
  if (!err) return next();
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ success: false, message: "File too large. Maximum size is 5MB." });
  }
  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({ success: false, message: "Unexpected file field. Use field name: resume" });
  }
  next(err);
}
