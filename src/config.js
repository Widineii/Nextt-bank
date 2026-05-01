const path = require("path");

const ROOT_DIR = path.join(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT_DIR, "public");
const DATA_DIR = path.join(ROOT_DIR, "data");
const LOG_DIR = path.join(DATA_DIR, "logs");
const BACKUP_DIR = path.join(DATA_DIR, "backups");

const config = {
  appName: "Nexttt Bank",
  port: Number(process.env.PORT || 3000),
  env: process.env.NODE_ENV || "development",
  rootDir: ROOT_DIR,
  publicDir: PUBLIC_DIR,
  dataDir: DATA_DIR,
  logDir: LOG_DIR,
  backupDir: BACKUP_DIR,
  dbFile: path.join(DATA_DIR, "nextt-db.json"),
  databaseUrl: process.env.DATABASE_URL || "json://data/nextt-db.json",
  sessionTtlMs: Number(process.env.SESSION_TTL_HOURS || 8) * 60 * 60 * 1000,
  refreshTtlMs: Number(process.env.REFRESH_TTL_DAYS || 7) * 24 * 60 * 60 * 1000,
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 120),
};

module.exports = { config };
