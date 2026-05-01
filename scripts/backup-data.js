const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dataDir = path.join(root, "data");
const backupDir = path.join(dataDir, "backups");
const dbFile = path.join(dataDir, "nextt-db.json");

fs.mkdirSync(backupDir, { recursive: true });

if (!fs.existsSync(dbFile)) {
  console.log("Nenhum banco local encontrado para backup.");
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const target = path.join(backupDir, `nexttt-bank-${stamp}.json`);
fs.copyFileSync(dbFile, target);
console.log(`Backup criado: ${target}`);
