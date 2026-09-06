const { execSync } = require("child_process");

const files = execSync("git diff --cached --name-only", { encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean);

const blocked = files.filter((file) => {
  const lower = file.toLowerCase();
  const isEnvName = /(^|\/)\.env($|\.)/.test(lower) || /\.env$/.test(lower);
  if (!isEnvName) return false;
  if (/\.env\.(example|sample|template)$/.test(lower)) return false;
  return true;
});

if (blocked.length > 0) {
  console.error("BLOCKED: environment files with secrets must not be committed:");
  for (const file of blocked) {
    console.error("  - " + file);
  }
  console.error("");
  console.error("If you really need to commit one, use: git add -f -- <file>");
  console.error("Only .env.example / .env.sample / .env.template are allowed.");
  process.exit(1);
}