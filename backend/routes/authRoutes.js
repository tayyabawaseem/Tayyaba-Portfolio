
import express from "express";

import {
  loginAdmin,
  getAdminProfile,
  logoutAdmin
} from "../controllers/authController.js";

import protectAdmin from "../middleware/authMiddleware.js";
import loginRateLimit from "../middleware/loginRateLimit.js";

const router = express.Router();

// Public login
router.post("/login", loginRateLimit, loginAdmin);

// Protected admin profile
router.get("/me", protectAdmin, getAdminProfile);

// Logout
router.post("/logout", logoutAdmin);

export default router;
