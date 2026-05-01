const fs = require("fs");
const { config } = require("../config");

function ensureJsonStore(createInitialData) {
  if (!fs.existsSync(config.dataDir)) fs.mkdirSync(config.dataDir, { recursive: true });
  if (fs.existsSync(config.dbFile)) return;
  saveJsonStore(createInitialData());
}

function loadJsonStore(createInitialData) {
  ensureJsonStore(createInitialData);
  return JSON.parse(fs.readFileSync(config.dbFile, "utf8"));
}

function saveJsonStore(db) {
  fs.writeFileSync(config.dbFile, JSON.stringify(db, null, 2));
}

module.exports = { ensureJsonStore, loadJsonStore, saveJsonStore };
