const fs = require("fs");
const path = require("path");
const { config } = require("./config");

function ensureLogDir() {
  fs.mkdirSync(config.logDir, { recursive: true });
}

function log(event, details = {}) {
  ensureLogDir();
  const entry = {
    time: new Date().toISOString(),
    event,
    ...details,
  };
  fs.appendFileSync(path.join(config.logDir, "app.log"), `${JSON.stringify(entry)}\n`);
}

module.exports = { log };
