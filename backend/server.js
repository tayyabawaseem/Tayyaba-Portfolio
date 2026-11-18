import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import contentRoutes from "./routes/contentRoutes.js";
import portfolioRoutes from "./routes/portfolioRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import navigationRoutes from "./routes/navigationRoutes.js";
import animationRoutes from "./routes/animationRoutes.js";
import { getAllowedClientOrigins } from "./utils/clientOrigins.js";
import { rateLimit } from "express-rate-limit";

dotenv.config();

const app = express();
app.set("trust proxy", 1);
const allowedOrigins = getAllowedClientOrigins();

app.use(helmet());

app.use(cors({
  origin: (origin, callback) => {
    callback(null, Boolean(origin && allowedOrigins.includes(origin)));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204
}));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
app.use("/api", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false
}));
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/navigation", navigationRoutes);
app.use("/api/animations", animationRoutes);
app.use("/api/contact", contactRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Tayyaba Portfolio Backend is running!"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Tayyaba Portfolio API is working!"
  });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }
  if (error.name === "MulterError" || error.message?.startsWith("Only ")) {
    res.status(400).json({ success: false, message: error.message });
    return;
  }
  console.error("API Error:", error.message);
  res.status(500).json({ success: false, message: "An unexpected server error occurred." });
});

const startServer = async () => {
  try {
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required.");
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      throw new Error("JWT_SECRET must be set to at least 32 characters.");
    }
    await connectDB();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error("Server Startup Error:", error.message);
    process.exit(1);
  }
};

startServer();

export default app;