import ContactMessage from "../models/ContactMessage.js";
import mongoose from "mongoose";

export const submitContactMessage = async (req, res) => {
  const { name, email, subject, message } = req.body || {};
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (
    typeof name !== "string" || name.trim().length < 2 || name.length > 100 ||
    typeof email !== "string" || !emailPattern.test(email) || email.length > 254 ||
    typeof subject !== "string" || subject.trim().length < 2 || subject.length > 160 ||
    typeof message !== "string" || message.trim().length < 10 || message.length > 5000
  ) {
    res.status(400).json({ success: false, message: "Please provide valid contact details and a message." });
    return;
  }

  try {
    await ContactMessage.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim()
    });
    res.status(201).json({ success: true, message: "Your message has been received." });
  } catch (error) {
    console.error("Contact Submission Error:", error.message);
    res.status(500).json({ success: false, message: "Unable to send your message right now." });
  }
};

export const getContactMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, messages });
  } catch (error) {
    console.error("Contact Inbox Error:", error.message);
    res.status(500).json({ success: false, message: "Unable to fetch contact messages." });
  }
};

export const getContactSummary = async (req, res) => {
  try {
    const [total, unread, recent] = await Promise.all([
      ContactMessage.countDocuments(),
      ContactMessage.countDocuments({ read: false }),
      ContactMessage.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name subject read createdAt")
        .lean()
    ]);
    res.json({ success: true, total, unread, recent });
  } catch (error) {
    console.error("Contact Summary Error:", error.message);
    res.status(500).json({ success: false, message: "Unable to fetch contact summary." });
  }
};

export const updateContactMessage = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id) || typeof req.body?.read !== "boolean") {
    res.status(400).json({ success: false, message: "A valid message ID and read status are required." });
    return;
  }
  try {
    const message = await ContactMessage.findByIdAndUpdate(
      id,
      { $set: { read: req.body.read } },
      { new: true, runValidators: true }
    );
    if (!message) {
      res.status(404).json({ success: false, message: "Contact message not found." });
      return;
    }
    res.json({ success: true, message });
  } catch (error) {
    console.error("Contact Message Update Error:", error.message);
    res.status(500).json({ success: false, message: "Unable to update contact message." });
  }
};

export const deleteContactMessage = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ success: false, message: "Invalid contact message ID." });
    return;
  }
  try {
    const message = await ContactMessage.findByIdAndDelete(id);
    if (!message) {
      res.status(404).json({ success: false, message: "Contact message not found." });
      return;
    }
    res.json({ success: true, message: "Contact message deleted." });
  } catch (error) {
    console.error("Contact Message Delete Error:", error.message);
    res.status(500).json({ success: false, message: "Unable to delete contact message." });
  }
};
