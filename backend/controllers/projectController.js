
import mongoose from "mongoose";
import Project from "../models/Project.js";
import { normalizeWebUrl } from "../utils/validation.js";

// Only these fields can be created or updated through the API
const allowedFields = [
  "title",
  "slug",
  "shortDescription",
  "description",
  "category",
  "techStack",
  "thumbnail",
  "thumbnailPublicId",
  "gallery",
  "galleryAssets",
  "liveUrl",
  "githubUrl",
  "featured",
  "status",
  "displayOrder"
];

const validateProjectData = (body) => {
  const data = {};
  const allowed = new Set(allowedFields);

  for (const [field, value] of Object.entries(body || {})) {
    if (!allowed.has(field)) return { error: `Unsupported project field: ${field}.` };
    if (field === "galleryAssets") {
      if (!Array.isArray(value) || value.length > 30 || value.some((image) =>
        !image || typeof image.url !== "string" || typeof image.publicId !== "string" ||
        !normalizeWebUrl(image.url) || !image.publicId.startsWith("tayyaba-portfolio/")
      )) return { error: "Gallery assets must be a list of uploaded images." };
      data[field] = value.map(({ url, publicId }) => ({
          url: url.trim(),
          publicId: publicId.trim()
        }));
      continue;
    }
    if (["techStack", "gallery"].includes(field)) {
      if (!Array.isArray(value) || value.length > 50 || value.some((entry) => typeof entry !== "string" || entry.length > 160)) {
        return { error: `${field} must be a list of up to 50 text values.` };
      }
      if (field === "gallery" && value.some((entry) => !normalizeWebUrl(entry))) {
        return { error: "Gallery images must use valid HTTP(S) URLs." };
      }
      data[field] = value.map((entry) => entry.trim());
      continue;
    }
    if (["title", "slug", "shortDescription", "description", "category", "thumbnail",
      "thumbnailPublicId", "liveUrl", "githubUrl"].includes(field)) {
      if (typeof value !== "string" || value.length > (field === "description" ? 10000 : 1000)) {
        return { error: `${field} must be valid text.` };
      }
      data[field] = value.trim();
      if (["thumbnail"].includes(field) && value && !normalizeWebUrl(value)) {
        return { error: "Thumbnail must be a valid HTTP(S) image URL." };
      }
      if (field === "thumbnailPublicId" && value && !value.startsWith("tayyaba-portfolio/")) {
        return { error: "Thumbnail public ID is invalid." };
      }
      continue;
    }
    if (field === "featured") {
      if (typeof value !== "boolean") return { error: "featured must be true or false." };
      data[field] = value;
      continue;
    }
    if (field === "status") {
      if (!["draft", "published"].includes(value)) return { error: "Project status must be draft or published." };
      data[field] = value;
      continue;
    }
    if (field === "displayOrder") {
      if (!Number.isFinite(Number(value))) return { error: "displayOrder must be a number." };
      data[field] = Number(value);
    }
  }

  if (data.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) {
    return { error: "Slug may contain lowercase letters, numbers, and single hyphens." };
  }
  for (const field of ["liveUrl", "githubUrl"]) {
    if (data[field] && !normalizeWebUrl(data[field])) {
      return { error: `${field} must be a valid HTTP(S) URL.` };
    }
  }
  return { data };
};

// CREATE PROJECT (Admin only)
export const createProject = async (req, res) => {
  try {
    const validated = validateProjectData(req.body);
    if (validated.error) {
      return res.status(400).json({ success: false, message: validated.error });
    }

    const project = await Project.create(validated.data);

    return res.status(201).json({
      success: true,
      message: "Project created successfully!",
      project
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.code === 11000 ? "Project slug already exists." : error.message
    });
  }
};

// GET PUBLISHED PROJECTS (Public)
export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      status: "published"
    }).sort({
      displayOrder: 1,
      createdAt: -1
    });

    return res.status(200).json({
      success: true,
      count: projects.length,
      projects
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch projects."
    });
  }
};

// GET ALL PROJECTS INCLUDING DRAFTS (Admin only)
export const getAdminProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({
      displayOrder: 1,
      createdAt: -1
    });

    return res.status(200).json({
      success: true,
      count: projects.length,
      projects
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin projects."
    });
  }
};

// GET SINGLE PUBLISHED PROJECT (Public)
export const getProjectById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID."
      });
    }

    const project = await Project.findOne({
      _id: req.params.id,
      status: "published"
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found."
      });
    }

    return res.status(200).json({
      success: true,
      project
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch project."
    });
  }
};

// UPDATE PROJECT (Admin only)
export const updateProject = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID."
      });
    }

    const validated = validateProjectData(req.body);
    if (validated.error) {
      return res.status(400).json({ success: false, message: validated.error });
    }
    const updateData = validated.data;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid project fields provided."
      });
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      {
        new: true,
        runValidators: true
      }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Project updated successfully!",
      project
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error.code === 11000
          ? "Project slug already exists."
          : error.message
    });
  }
};

// DELETE PROJECT (Admin only)
export const deleteProject = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID."
      });
    }

    const project = await Project.findByIdAndDelete(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully!"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete project."
    });
  }
};
