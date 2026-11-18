
import express from "express";

import {
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  deleteMultipleImages,
  uploadResume,
  deleteResume
} from "../controllers/uploadController.js";

import upload from "../middleware/uploadMiddleware.js";
import resumeUpload from "../middleware/resumeUploadMiddleware.js";
import protectAdmin from "../middleware/authMiddleware.js";

const router = express.Router();

// All upload and delete routes require admin authentication

router.post(
  "/image",
  protectAdmin,
  upload.single("image"),
  uploadImage
);

router.post(
  "/multiple",
  protectAdmin,
  upload.array("images", 10),
  uploadMultipleImages
);

router.delete(
  "/image",
  protectAdmin,
  deleteImage
);

router.delete(
  "/multiple",
  protectAdmin,
  deleteMultipleImages
);

router.post(
  "/resume",
  protectAdmin,
  resumeUpload.single("resume"),
  uploadResume
);

router.delete("/resume", protectAdmin, deleteResume);

export default router;
