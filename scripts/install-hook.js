const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const hookPath = path.join(root, ".git", "hooks", "pre-commit");
const hook = `#!/bin/sh
node "$(git rev-parse --show-toplevel)/scripts/guard-env.js"
`;

fs.writeFileSync(hookPath, hook);
console.log("Installed pre-commit hook at " + hookPath);