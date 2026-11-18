import express from "express";
import {
  createNavigationItem,
  deleteNavigationItem,
  getAdminNavigation,
  getPublicNavigation,
  resetNavigation,
  updateNavigationAppearance,
  updateNavigationItem
} from "../controllers/navigationController.js";
import protectAdmin from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getPublicNavigation);
router.get("/admin", protectAdmin, getAdminNavigation);
router.post("/items", protectAdmin, createNavigationItem);
router.put("/items/:id", protectAdmin, updateNavigationItem);
router.delete("/items/:id", protectAdmin, deleteNavigationItem);
router.put("/appearance", protectAdmin, updateNavigationAppearance);
router.put("/reset", protectAdmin, resetNavigation);

export default router;
