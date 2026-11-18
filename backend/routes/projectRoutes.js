
import express from "express";

import {
  createProject,
  getProjects,
  getAdminProjects,
  getProjectById,
  updateProject,
  deleteProject
} from "../controllers/projectController.js";

import protectAdmin from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", getProjects);

// Protected admin routes
router.get("/admin/all", protectAdmin, getAdminProjects);
router.post("/", protectAdmin, createProject);
router.put("/:id", protectAdmin, updateProject);
router.delete("/:id", protectAdmin, deleteProject);

// Keep the dynamic route after static routes.
router.get("/:id", getProjectById);

export default router;
