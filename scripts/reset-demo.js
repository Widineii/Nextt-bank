const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "data");
const dbFile = path.join(dataDir, "nextt-db.json");

if (fs.existsSync(dbFile)) {
  fs.unlinkSync(dbFile);
}

console.log("Nexttt Bank: dados demo resetados. Inicie o servidor para recriar o banco bonito.");
