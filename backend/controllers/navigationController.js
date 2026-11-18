import { randomUUID } from "node:crypto";
import Portfolio from "../models/Portfolio.js";
import {
  defaultNavigationSettings,
  validateNavigationAppearance,
  validateNavigationItem,
  validateNavigationItems
} from "../utils/siteConfig.js";

const mergeNavigationSettings = (stored = {}) => {
  const defaults = defaultNavigationSettings();
  const appearance = stored.appearance || {};
  return {
    ...defaults,
    ...stored,
    items: Array.isArray(stored.items) ? stored.items : defaults.items,
    appearance: {
      ...defaults.appearance,
      ...appearance,
      colors: {
        dark: { ...defaults.appearance.colors.dark, ...appearance.colors?.dark },
        light: { ...defaults.appearance.colors.light, ...appearance.colors?.light }
      },
      position: appearance.position || (stored.sticky === false ? "static" : defaults.appearance.position)
    }
  };
};

const readSettings = async () => {
  const portfolio = await Portfolio.findOne({ key: "primary" }).lean();
  return mergeNavigationSettings(portfolio?.data?.settings?.navbar);
};

const writeSettings = (settings) => Portfolio.findOneAndUpdate(
  { key: "primary" },
  { $set: { "data.settings.navbar": settings } },
  { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
);

const buildTree = (items) => {
  const enabled = items.filter((item) => item.enabled);
  const nodes = enabled.map((item) => ({ ...item, children: [] }));
  const byId = new Map(nodes.map((item) => [item.id, item]));
  const roots = [];
  for (const item of nodes) {
    const parent = item.parentId && byId.get(item.parentId);
    if (parent) parent.children.push(item);
    else roots.push(item);
  }
  const sort = (itemsToSort) => {
    itemsToSort.sort((left, right) => left.order - right.order || left.label.localeCompare(right.label));
    itemsToSort.forEach((item) => sort(item.children));
  };
  sort(roots);
  return roots;
};

export const getPublicNavigation = async (req, res) => {
  try {
    const config = await readSettings();
    res.json({
      success: true,
      navigation: {
        items: buildTree(config.items),
        appearance: config.appearance,
        showBrand: config.showBrand !== false,
        showLinks: config.showLinks !== false,
        showContact: config.showContact !== false
      }
    });
  } catch (error) {
    console.error("Public Navigation Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch public navigation." });
  }
};

export const getAdminNavigation = async (req, res) => {
  try {
    res.json({ success: true, navigation: await readSettings() });
  } catch (error) {
    console.error("Admin Navigation Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch navigation settings." });
  }
};

export const createNavigationItem = async (req, res) => {
  const validated = validateNavigationItem(req.body);
  if (validated.error) {
    res.status(400).json({ success: false, message: validated.error });
    return;
  }
  try {
    const config = await readSettings();
    const item = { ...validated.data, id: randomUUID(), system: false };
    const checked = validateNavigationItems([...config.items, item]);
    if (checked.error) {
      res.status(400).json({ success: false, message: checked.error });
      return;
    }
    config.items = checked.data;
    await writeSettings(config);
    res.status(201).json({ success: true, item, message: "Navigation item created." });
  } catch (error) {
    console.error("Create Navigation Item Error:", error.message);
    res.status(500).json({ success: false, message: "Unable to create navigation item." });
  }
};

export const updateNavigationItem = async (req, res) => {
  const validated = validateNavigationItem(req.body);
  if (validated.error) {
    res.status(400).json({ success: false, message: validated.error });
    return;
  }
  try {
    const config = await readSettings();
    const index = config.items.findIndex((item) => item.id === req.params.id);
    if (index < 0) {
      res.status(404).json({ success: false, message: "Navigation item not found." });
      return;
    }
    const item = { ...validated.data, id: req.params.id, system: config.items[index].system === true };
    const updatedItems = [...config.items];
    updatedItems[index] = item;
    const checked = validateNavigationItems(updatedItems);
    if (checked.error) {
      res.status(400).json({ success: false, message: checked.error });
      return;
    }
    config.items = checked.data;
    await writeSettings(config);
    res.json({ success: true, item, message: "Navigation item updated." });
  } catch (error) {
    console.error("Update Navigation Item Error:", error.message);
    res.status(500).json({ success: false, message: "Unable to update navigation item." });
  }
};

export const deleteNavigationItem = async (req, res) => {
  try {
    const config = await readSettings();
    const item = config.items.find((candidate) => candidate.id === req.params.id);
    if (!item) {
      res.status(404).json({ success: false, message: "Navigation item not found." });
      return;
    }
    if (item.system) {
      res.status(409).json({ success: false, message: "This system navigation item cannot be deleted." });
      return;
    }
    const removed = new Set([item.id]);
    let expanded = true;
    while (expanded) {
      expanded = false;
      for (const candidate of config.items) {
        if (candidate.parentId && removed.has(candidate.parentId) && !removed.has(candidate.id)) {
          if (candidate.system) {
            res.status(409).json({ success: false, message: "This dropdown contains a protected system item." });
            return;
          }
          removed.add(candidate.id);
          expanded = true;
        }
      }
    }
    config.items = config.items.filter((candidate) => !removed.has(candidate.id));
    await writeSettings(config);
    res.json({ success: true, deletedCount: removed.size, message: "Navigation item and its nested items deleted." });
  } catch (error) {
    console.error("Delete Navigation Item Error:", error.message);
    res.status(500).json({ success: false, message: "Unable to delete navigation item." });
  }
};

export const updateNavigationAppearance = async (req, res) => {
  const validated = validateNavigationAppearance(req.body);
  if (validated.error) {
    res.status(400).json({ success: false, message: validated.error });
    return;
  }
  try {
    const config = await readSettings();
    config.appearance = {
      ...config.appearance,
      ...validated.data,
      colors: {
        ...config.appearance.colors,
        ...validated.data.colors,
        dark: { ...config.appearance.colors.dark, ...validated.data.colors?.dark },
        light: { ...config.appearance.colors.light, ...validated.data.colors?.light }
      }
    };
    await writeSettings(config);
    res.json({ success: true, appearance: config.appearance, message: "Navigation appearance saved." });
  } catch (error) {
    console.error("Update Navigation Appearance Error:", error.message);
    res.status(500).json({ success: false, message: "Unable to save navigation appearance." });
  }
};

export const resetNavigation = async (req, res) => {
  try {
    const navigation = defaultNavigationSettings();
    await writeSettings(navigation);
    res.json({ success: true, navigation, message: "Navigation restored to defaults." });
  } catch (error) {
    console.error("Reset Navigation Error:", error.message);
    res.status(500).json({ success: false, message: "Unable to reset navigation settings." });
  }
};
