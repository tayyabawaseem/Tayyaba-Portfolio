import express from "express";
import {
  createContent,
  deleteContent,
  getAdminContent,
  getPublicContent,
  updateContent
} from "../controllers/contentController.js";
import protectAdmin from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getPublicContent);
router.get("/:type", protectAdmin, getAdminContent);
router.post("/:type", protectAdmin, createContent);
router.put("/:type/:id", protectAdmin, updateContent);
router.delete("/:type/:id", protectAdmin, deleteContent);

export default router;
