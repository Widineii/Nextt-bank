const fs = require("fs");
const path = require("path");

const OUTBOX_DIR = path.join(__dirname, "data", "outbox");

function ensureOutbox() {
  if (!fs.existsSync(OUTBOX_DIR)) fs.mkdirSync(OUTBOX_DIR, { recursive: true });
}

function sendMail({ to, subject, text }) {
  ensureOutbox();
  const filename = `${Date.now()}-${String(to || "unknown").replace(/[^a-z0-9]/gi, "_")}.txt`;
  const body = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "",
    text,
    "",
    "This is a local development outbox. Configure a real provider in production.",
  ].join("\n");
  fs.writeFileSync(path.join(OUTBOX_DIR, filename), body);
  return { queued: true, provider: "local-outbox", file: filename };
}

module.exports = { sendMail };
