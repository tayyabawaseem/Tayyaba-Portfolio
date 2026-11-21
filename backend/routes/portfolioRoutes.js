import express from "express";
import {
  getAdminPortfolio,
  getPublicResume,
  getPublicProfile,
  getPublicPortfolio,
  updatePortfolioSection
} from "../controllers/portfolioController.js";
import protectAdmin from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getPublicPortfolio);
router.get("/resume", getPublicResume);
router.get("/profile", getPublicProfile);
router.get("/admin", protectAdmin, getAdminPortfolio);
router.put("/:section", protectAdmin, updatePortfolioSection);

export default router;
