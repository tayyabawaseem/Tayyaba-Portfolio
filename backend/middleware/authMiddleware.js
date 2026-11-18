
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import { getAllowedClientOrigins } from "../utils/clientOrigins.js";

const protectAdmin = async (req, res, next) => {
  try {
    const origin = req.get("origin");
    if (origin && !["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      if (!getAllowedClientOrigins().includes(origin)) {
        return res.status(403).json({
          success: false,
          message: "Request origin is not allowed."
        });
      }
    }

    const token = req.cookies?.adminToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please login."
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Admin account not found."
      });
    }

    req.admin = admin;

    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token."
    });
  }
};

export default protectAdmin;
