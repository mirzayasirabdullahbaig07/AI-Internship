// node day-18-working-safely/tools/install_hooks.js  -> installs .git/hooks/pre-commit (local only)
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..", "..");
const hooks = path.join(root, ".git", "hooks");
fs.mkdirSync(hooks, { recursive: true });
const file = path.join(hooks, "pre-commit");
fs.writeFileSync(
  file,
  "#!/bin/sh\n# installed by day-18-working-safely\nnode day-18-working-safely/src/hook.js\n",
  { mode: 0o755 },
);
console.log("installed", file);
