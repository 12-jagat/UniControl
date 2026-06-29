import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import { authenticate } from "../middleware/auth.middleware";
import { AppError } from "../middleware/error.middleware";

const router = Router();

// Check if Cloudinary credentials are provided in the environment
const useCloudinary = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Local uploads directory config
const uploadDir = path.join(__dirname, "../../public/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage config: Memory storage for Cloudinary, disk storage for local dev
const storage = useCloudinary
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + "-" + uniqueSuffix + ext);
      },
    });

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedExtensions = [".png", ".jpg", ".jpeg", ".pdf"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new AppError("Only PNG, JPG, JPEG, and PDF files are allowed", 400), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

router.post("/", authenticate, upload.single("file"), async (req: any, res: any, next: any) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }

  try {
    if (useCloudinary) {
      // Upload to Cloudinary from memory buffer
      const streamUpload = () => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "unicontrol_assignments",
              resource_type: "auto",
            },
            (error, result) => {
              if (result) {
                resolve(result);
              } else {
                reject(error);
              }
            }
          );
          stream.end(req.file.buffer);
        });
      };

      const result: any = await streamUpload();
      res.status(200).json({
        success: true,
        message: "File uploaded to Cloudinary",
        fileUrl: result.secure_url,
      });
    } else {
      // Local server fallback URL path
      const fileUrl = `/uploads/${req.file.filename}`;
      res.status(200).json({
        success: true,
        message: "File uploaded to local disk storage",
        fileUrl,
      });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
