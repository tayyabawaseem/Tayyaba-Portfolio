import express from "express";
import { rateLimit } from "express-rate-limit";
import {
  getContactMessages,
  submitContactMessage,
  getContactSummary,
  updateContactMessage,
  deleteContactMessage
} from "../controllers/contactController.js";
import protectAdmin from "../middleware/authMiddleware.js";

const router = express.Router();
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many messages. Please try again later." }
});

router.post("/", contactLimiter, submitContactMessage);
router.get("/admin/messages", protectAdmin, getContactMessages);
router.get("/admin/summary", protectAdmin, getContactSummary);
router.patch("/admin/messages/:id", protectAdmin, updateContactMessage);
router.delete("/admin/messages/:id", protectAdmin, deleteContactMessage);

export default router;
