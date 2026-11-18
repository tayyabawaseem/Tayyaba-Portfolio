
import Admin from "../models/Admin.js";
import jwt from "jsonwebtoken";

const generateToken = (adminId) => {
  return jwt.sign(
    { id: adminId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000
};

// Admin Login
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" || typeof password !== "string" ||
      email.length > 254 || password.length > 200
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
    }

    const admin = await Admin.findOne({
      email: email.toLowerCase().trim()
    }).select("+password");

    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    const token = generateToken(admin._id);

    res.cookie("adminToken", token, cookieOptions);

    return res.status(200).json({
      success: true,
      message: "Login successful!",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email
      }
    });

  } catch (error) {
    console.error("Admin Login Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Login failed."
    });
  }
};


// Get Logged-in Admin Profile
export const getAdminProfile = async (req, res) => {
  res.status(200).json({
    success: true,
    admin: {
      id: req.admin._id,
      name: req.admin.name,
      email: req.admin.email
    }
  });
};

// Admin Logout
export const logoutAdmin = async (req, res) => {
  res.clearCookie("adminToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
  });

  res.status(200).json({
    success: true,
    message: "Logout successful!"
  });
};
