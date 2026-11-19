import mongoose from "mongoose";
import ContentItem from "../models/ContentItem.js";
import { normalizeWebUrl } from "../utils/validation.js";

const fieldsByType = {
  skills: ["name", "category", "icon", "proficiency", "categoryOrder", "scrollerOrder"],
  experience: [
    "jobTitle",
    "company",
    "employmentType",
    "location",
    "startDate",
    "endDate",
    "currentlyWorking",
    "description",
    "responsibilities",
    "technologies"
  ],
  services: ["title", "description", "icon"],
  education: ["degree", "institution", "startDate", "endDate", "description"],
  certifications: [
    "title",
    "organization",
    "issueDate",
    "credentialId",
    "credentialUrl",
    "image",
    "imagePublicId"
  ],
  testimonials: [
    "name",
    "designation",
    "company",
    "testimonial",
    "profileImage",
    "profileImagePublicId"
  ]
};

const titleFieldByType = {
  skills: "name",
  experience: "jobTitle",
  services: "title",
  education: "degree",
  certifications: "title",
  testimonials: "name"
};
const publicIdFields = new Set(["imagePublicId", "profileImagePublicId"]);
const skillKey = ({ name, category }) => `${String(category || "").trim().toLowerCase()}::${String(name || "").trim().toLowerCase()}`;
const skillAlreadyExists = async (data, excludeId) => {
  if (!data.name || !data.category) return false;
  const records = await ContentItem.find({ type: "skills", ...(excludeId ? { _id: { $ne: excludeId } } : {}) }).select("data.name data.category").lean();
  const key = skillKey(data);
  return records.some((record) => skillKey(record.data || {}) === key);
};

const validateData = (type, input) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { error: "Content data must be an object." };
  }

  const allowedFields = fieldsByType[type];
  if (!allowedFields) return { error: "Unsupported content type." };

  const data = {};
  for (const [field, value] of Object.entries(input)) {
    if (!allowedFields.includes(field)) {
      return { error: `Unsupported ${type} field: ${field}.` };
    }

    if (field === "proficiency") {
      if (value === "" || !Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 100) {
        return { error: "Proficiency must be between 0 and 100." };
      }
      data[field] = Number(value);
    } else if (["categoryOrder", "scrollerOrder"].includes(field)) {
      if (!Number.isInteger(Number(value)) || Number(value) < 0 || Number(value) > 100000) {
        return { error: `${field} must be a whole number between 0 and 100000.` };
      }
      data[field] = Number(value);
    } else if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length > 5000) return { error: `${field} is too long.` };
      if (publicIdFields.has(field) && trimmed) {
        if (!trimmed.startsWith("tayyaba-portfolio/")) {
          return { error: `${field} is not a valid Cloudinary asset ID.` };
        }
        data[field] = trimmed;
      } else if (["credentialUrl", "image", "profileImage"].includes(field) && trimmed) {
        const url = normalizeWebUrl(trimmed);
        if (!url) return { error: `${field} must be a valid HTTP(S) URL.` };
        data[field] = url;
      } else {
        data[field] = trimmed;
      }
    } else if (Array.isArray(value) && ["responsibilities", "technologies"].includes(field)) {
      if (value.length > 50 || value.some((entry) => typeof entry !== "string")) {
        return { error: `${field} must be a list of up to 50 text values.` };
      }
      data[field] = value.map((entry) => entry.trim().slice(0, 300));
    } else if (field === "currentlyWorking" && typeof value === "boolean") {
      data[field] = value;
    } else {
      return { error: `${field} has an invalid value.` };
    }
  }

  const titleField = titleFieldByType[type];
  if (!data[titleField]) return { error: `${titleField} is required.` };
  return { data };
};

const getType = (req, res) => {
  const { type } = req.params;
  if (!Object.hasOwn(fieldsByType, type)) {
    res.status(400).json({ success: false, message: "Unsupported content type." });
    return null;
  }
  return type;
};

export const getPublicContent = async (req, res) => {
  try {
    const items = await ContentItem.find({ visible: true })
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();
    const content = Object.fromEntries(Object.keys(fieldsByType).map((type) => [type, []]));

    for (const item of items) {
      content[item.type].push({
        ...item.data,
        _id: item._id,
        type: item.type,
        title: item.title,
        displayOrder: item.displayOrder
      });
    }

    res.json({ success: true, content });
  } catch (error) {
    console.error("Public Content Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch portfolio content." });
  }
};

export const getAdminContent = async (req, res) => {
  const type = getType(req, res);
  if (!type) return;

  try {
    const items = await ContentItem.find({ type }).sort({ displayOrder: 1, createdAt: -1 });
    res.json({
      success: true,
      items: items.map((item) => ({
        ...item.data,
        _id: item._id,
        type: item.type,
        title: item.title,
        visible: item.visible,
        displayOrder: item.displayOrder
      }))
    });
  } catch (error) {
    console.error("Admin Content Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch content." });
  }
};

export const createContent = async (req, res) => {
  const type = getType(req, res);
  if (!type) return;
  const body = req.body || {};
  const validated = validateData(type, body.data);
  if (validated.error) {
    res.status(400).json({ success: false, message: validated.error });
    return;
  }

  const { visible = true, displayOrder = 0 } = body;
  if (typeof visible !== "boolean" || !Number.isFinite(Number(displayOrder))) {
    res.status(400).json({ success: false, message: "Invalid visibility or display order." });
    return;
  }

  try {
    if (type === "skills" && await skillAlreadyExists(validated.data)) {
      res.status(409).json({ success: false, message: "A skill with this name already exists in that category." });
      return;
    }
    const item = await ContentItem.create({
      type,
      title: validated.data[titleFieldByType[type]],
      data: validated.data,
      visible,
      displayOrder: Number(displayOrder)
    });
    res.status(201).json({ success: true, item });
  } catch (error) {
    console.error("Create Content Error:", error.message);
    res.status(400).json({ success: false, message: "Unable to create content item." });
  }
};

export const updateContent = async (req, res) => {
  const type = getType(req, res);
  if (!type) return;
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ success: false, message: "Invalid content ID." });
    return;
  }

  const body = req.body || {};
  const updates = {};
  if (Object.hasOwn(body, "data")) {
    const validated = validateData(type, body.data);
    if (validated.error) {
      res.status(400).json({ success: false, message: validated.error });
      return;
    }
    updates.data = validated.data;
    updates.title = validated.data[titleFieldByType[type]];
  }
  if (Object.hasOwn(body, "visible")) {
    if (typeof body.visible !== "boolean") {
      res.status(400).json({ success: false, message: "Visibility must be true or false." });
      return;
    }
    updates.visible = body.visible;
  }
  if (Object.hasOwn(body, "displayOrder")) {
    if (!Number.isFinite(Number(body.displayOrder))) {
      res.status(400).json({ success: false, message: "Display order must be a number." });
      return;
    }
    updates.displayOrder = Number(body.displayOrder);
  }
  if (!Object.keys(updates).length) {
    res.status(400).json({ success: false, message: "No editable fields were provided." });
    return;
  }

  try {
    if (type === "skills" && Object.hasOwn(updates, "data") && await skillAlreadyExists(updates.data, req.params.id)) {
      res.status(409).json({ success: false, message: "A skill with this name already exists in that category." });
      return;
    }
    const item = await ContentItem.findOneAndUpdate(
      { _id: req.params.id, type },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!item) {
      res.status(404).json({ success: false, message: "Content item not found." });
      return;
    }
    res.json({ success: true, item });
  } catch (error) {
    console.error("Update Content Error:", error.message);
    res.status(400).json({ success: false, message: "Unable to update content item." });
  }
};

export const deleteContent = async (req, res) => {
  const type = getType(req, res);
  if (!type) return;
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ success: false, message: "Invalid content ID." });
    return;
  }

  try {
    const item = await ContentItem.findOneAndDelete({ _id: req.params.id, type });
    if (!item) {
      res.status(404).json({ success: false, message: "Content item not found." });
      return;
    }
    res.json({ success: true, message: "Content item deleted." });
  } catch (error) {
    console.error("Delete Content Error:", error.message);
    res.status(500).json({ success: false, message: "Unable to delete content item." });
  }
};
