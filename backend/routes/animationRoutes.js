import express from "express";
import {
  createAnimation,
  deleteAnimation,
  getAdminAnimations,
  getPublicAnimations,
  resetAnimations,
  updateAnimation
} from "../controllers/animationController.js";
import protectAdmin from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getPublicAnimations);
router.get("/admin", protectAdmin, getAdminAnimations);
router.post("/", protectAdmin, createAnimation);
router.put("/reset", protectAdmin, resetAnimations);
router.put("/:id", protectAdmin, updateAnimation);
router.delete("/:id", protectAdmin, deleteAnimation);

export default router;
