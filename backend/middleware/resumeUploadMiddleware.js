import multer from "multer";

const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (file.mimetype !== "application/pdf" || !file.originalname.toLowerCase().endsWith(".pdf")) {
      callback(new Error("Only PDF resumes are allowed."));
      return;
    }

    callback(null, true);
  }
});

export default resumeUpload;
