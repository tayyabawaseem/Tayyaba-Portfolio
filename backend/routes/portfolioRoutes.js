import express from "express";
import {
  getAdminPortfolio,
  getPublicProfile,
  getPublicPortfolio,
  updatePortfolioSection
} from "../controllers/portfolioController.js";
import protectAdmin from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getPublicPortfolio);
router.get("/profile", getPublicProfile);
router.get("/admin", protectAdmin, getAdminPortfolio);
router.put("/:section", protectAdmin, updatePortfolioSection);

export default router;
