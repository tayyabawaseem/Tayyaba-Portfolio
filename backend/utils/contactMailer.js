import nodemailer from "nodemailer";
import Portfolio from "../models/Portfolio.js";
import { isValidEmail } from "./validation.js";

const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}[character]));

export const sendContactNotification = async ({ name, email, subject, message }) => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT);
  const secure = String(process.env.SMTP_SECURE).toLowerCase() === "true";
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASS?.replace(/\s+/g, "");
  const from = process.env.SMTP_FROM || user;

  if (!host || !Number.isInteger(port) || port < 1 || port > 65535 || !user || !password || !from) {
    console.warn("Contact notification email skipped: SMTP configuration is incomplete.");
    return false;
  }

  const portfolio = await Portfolio.findOne({ key: "primary" })
    .select("data.contact.formRecipient")
    .lean();
  const configuredRecipient = portfolio?.data?.contact?.formRecipient?.trim();
  const recipient = configuredRecipient || process.env.CONTACT_NOTIFICATION_EMAIL?.trim() || user;
  if (!isValidEmail(recipient)) {
    console.error("Contact notification email skipped: configured recipient is invalid.");
    return false;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass: password },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });
  const safeSubject = subject.replace(/[\r\n]+/g, " ").trim();
  const html = [
    `<p><strong>From:</strong> ${escapeHtml(name)}</p>`,
    `<p><strong>Email:</strong> ${escapeHtml(email)}</p>`,
    `<p><strong>Subject:</strong> ${escapeHtml(safeSubject)}</p>`,
    `<p><strong>Message:</strong></p>`,
    `<p style="white-space:pre-wrap">${escapeHtml(message)}</p>`
  ].join("\n");

  try {
    await transporter.sendMail({
      from,
      to: recipient,
      replyTo: { name, address: email },
      subject: `[Portfolio Contact] ${safeSubject}`,
      text: `From: ${name}\nEmail: ${email}\nSubject: ${safeSubject}\n\n${message}`,
      html
    });
    return true;
  } finally {
    transporter.close();
  }
};
