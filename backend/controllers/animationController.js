import { randomUUID } from "node:crypto";
import Portfolio from "../models/Portfolio.js";
import { defaultAnimations, validateAnimation, validateAnimations } from "../utils/siteConfig.js";

const readAnimations = async () => {
  const portfolio = await Portfolio.findOne({ key: "primary" }).lean();
  return Array.isArray(portfolio?.data?.settings?.animations)
    ? portfolio.data.settings.animations
    : structuredClone(defaultAnimations);
};

const writeAnimations = (animations) => Portfolio.findOneAndUpdate(
  { key: "primary" },
  { $set: { "data.settings.animations": animations } },
  { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
);

export const getPublicAnimations = async (req, res) => {
  try {
    const animations = await readAnimations();
    res.json({ success: true, animations: animations.filter((animation) => animation.enabled) });
  } catch (error) {
    console.error("Public Animations Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch public animations." });
  }
};

export const getAdminAnimations = async (req, res) => {
  try {
    res.json({ success: true, animations: await readAnimations() });
  } catch (error) {
    console.error("Admin Animations Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch animations." });
  }
};

export const createAnimation = async (req, res) => {
  const validated = validateAnimation(req.body);
  if (validated.error) {
    res.status(400).json({ success: false, message: validated.error });
    return;
  }
  try {
    const animations = await readAnimations();
    const animation = { ...validated.data, id: randomUUID() };
    const checked = validateAnimations([...animations, animation]);
    if (checked.error) {
      res.status(400).json({ success: false, message: checked.error });
      return;
    }
    await writeAnimations(checked.data);
    res.status(201).json({ success: true, animation, message: "Animation created." });
  } catch (error) {
    console.error("Create Animation Error:", error.message);
    res.status(500).json({ success: false, message: "Unable to create animation." });
  }
};

export const updateAnimation = async (req, res) => {
  const validated = validateAnimation(req.body);
  if (validated.error) {
    res.status(400).json({ success: false, message: validated.error });
    return;
  }
  try {
    const animations = await readAnimations();
    const index = animations.findIndex((animation) => animation.id === req.params.id);
    if (index < 0) {
      res.status(404).json({ success: false, message: "Animation not found." });
      return;
    }
    const updated = [...animations];
    updated[index] = { ...validated.data, id: req.params.id };
    const checked = validateAnimations(updated);
    if (checked.error) {
      res.status(400).json({ success: false, message: checked.error });
      return;
    }
    await writeAnimations(checked.data);
    res.json({ success: true, animation: updated[index], message: "Animation updated." });
  } catch (error) {
    console.error("Update Animation Error:", error.message);
    res.status(500).json({ success: false, message: "Unable to update animation." });
  }
};

export const deleteAnimation = async (req, res) => {
  try {
    const animations = await readAnimations();
    const remaining = animations.filter((animation) => animation.id !== req.params.id);
    if (remaining.length === animations.length) {
      res.status(404).json({ success: false, message: "Animation not found." });
      return;
    }
    await writeAnimations(remaining);
    res.json({ success: true, message: "Animation deleted." });
  } catch (error) {
    console.error("Delete Animation Error:", error.message);
    res.status(500).json({ success: false, message: "Unable to delete animation." });
  }
};

export const resetAnimations = async (req, res) => {
  try {
    const animations = structuredClone(defaultAnimations);
    await writeAnimations(animations);
    res.json({ success: true, animations, message: "Animations restored to defaults." });
  } catch (error) {
    console.error("Reset Animations Error:", error.message);
    res.status(500).json({ success: false, message: "Unable to reset animations." });
  }
};
