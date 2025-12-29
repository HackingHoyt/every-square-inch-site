/**
 * server/server.js
 *
 * Plain HTML/CSS/JS site + Node/Express backend for contact form.
 *
 * ✅ Always works (no accounts, no services):
 *    - Writes each submission to: server/inbox.jsonl
 *
 * ✅ Optional email sending (later, if you want):
 *    - Configure SMTP_* env vars and it will email too.
 *
 * Frontend POSTs to:  /api/contact
 * Frontend files live in project root: ../contact.html, ../script.js, ../styles.css, etc.
 */

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");

// Optional dependency: nodemailer (we only require it if SMTP is configured)
let nodemailer = null;

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Serve your static site from the project root folder (one level above /server)
app.use(express.static(path.join(__dirname, "..")));

// --- Utility: write message to local "inbox" file ---
const inboxPath = path.join(__dirname, "inbox.jsonl");

function appendToInbox(payload) {
  const line = JSON.stringify({ ...payload, receivedAt: new Date().toISOString() }) + "\n";
  fs.appendFileSync(inboxPath, line, "utf8");
}

// --- Optional email sender (SMTP) ---
async function trySendEmail(payload) {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS,
    TO_EMAIL,
    FROM_EMAIL,
  } = process.env;

  // If any essential SMTP config is missing, we skip emailing.
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return { sent: false, reason: "SMTP not configured (saving to inbox file only)." };
  }

  // Lazy-load nodemailer only if needed
  if (!nodemailer) nodemailer = require("nodemailer");

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: String(SMTP_SECURE).toLowerCase() === "true", // true for 465, false for 587
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  const to = TO_EMAIL || SMTP_USER;
  const from = FROM_EMAIL || SMTP_USER;

  const subject = `ESI Website Contact: ${payload.name || "New Message"}`;

  const text = [
    "New contact form submission:",
    "",
    `Name: ${payload.name || ""}`,
    `Email: ${payload.email || ""}`,
    `Phone: ${payload.phone || ""}`,
    `Service: ${payload.service || ""}`,
    "",
    "Message:",
    payload.message || "",
    "",
    `Received: ${new Date().toISOString()}`,
  ].join("\n");

  await transporter.sendMail({
    from,
    to,
    replyTo: payload.email || undefined,
    subject,
    text,
  });

  return { sent: true };
}

// --- Health check ---
app.get("/api/health", (req, res) => {
  res.json({ ok: true, port: PORT });
});

// --- Contact endpoint ---
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, phone, service, message } = req.body || {};

    // Very basic validation (matches your script.js expectations)
    if (!name || !email || !message) {
      return res.status(400).json({
        ok: false,
        error: "Missing required fields: name, email, message",
      });
    }

    const payload = {
      name: String(name).trim(),
      email: String(email).trim(),
      phone: phone ? String(phone).trim() : "",
      service: service ? String(service).trim() : "",
      message: String(message).trim(),
      userAgent: req.get("user-agent") || "",
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "",
    };

    // 1) Always save locally so nothing is ever lost
    appendToInbox(payload);

    // 2) Try email if SMTP is configured
    let emailResult = null;
    try {
      emailResult = await trySendEmail(payload);
    } catch (emailErr) {
      // We do NOT fail the request if email fails — we already saved the message.
      console.error("EMAIL SEND FAILED (saved to inbox.jsonl):", emailErr?.message || emailErr);
      emailResult = { sent: false, reason: "Email send failed (saved to inbox file)." };
    }

    return res.json({
      ok: true,
      saved: true,
      emailed: Boolean(emailResult?.sent),
      emailNote: emailResult?.sent ? "Email sent." : emailResult?.reason,
    });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`✅ Server running: http://localhost:${PORT}`);
  console.log(`✅ Site:          http://localhost:${PORT}/contact.html`);
  console.log(`✅ Inbox file:    ${inboxPath}`);
});
