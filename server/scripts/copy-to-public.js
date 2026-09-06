const fs = require("fs");
const path = require("path");

const frontendDist = path.join(__dirname, "../../frontend/dist");
const publicDir = path.join(__dirname, "../public");

if (!fs.existsSync(path.join(frontendDist, "index.html"))) {
  console.error("frontend/dist not found — build the frontend first (npm run build --prefix frontend)");
  process.exit(1);
}

fs.rmSync(publicDir, { recursive: true, force: true });
fs.mkdirSync(publicDir, { recursive: true });
fs.cpSync(frontendDist, publicDir, { recursive: true });
console.log(`Copied frontend/dist -> server/public (${publicDir})`);