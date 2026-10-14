// node day-17-coo-lifecycle/tools/render_cards.js  -> outputs/DARK_MODE_BREAKDOWN.md (generated from the validated JSON)
const fs = require("node:fs");
const path = require("node:path");
const { validateTaskCards } = require("../src/taskCards");

const file = path.join(__dirname, "..", "outputs", "dark_mode_task_cards.json");
const { request, objective, cards } = JSON.parse(fs.readFileSync(file, "utf8"));
const result = validateTaskCards(cards);
const byId = Object.fromEntries(cards.map((c) => [c.id, c]));
const list = (xs) => (xs.length ? xs.map((x) => `\n  - ${x}`).join("") : " none");

let md = `# "${request}" split into task cards by an AI-COO\n\n`;
md += `**Vague request:** ${request}\n**Approved objective:** ${objective}\n`;
md += `**Validator:** ${result.valid ? "VALID" : "INVALID"} - ${cards.length} cards, ${result.waves.length} dependency waves, parallel cards share no files.\n\n`;
result.waves.forEach((wave, i) => {
  md += `## Wave ${i + 1}${wave.length > 1 ? " (can run in parallel)" : ""}\n\n`;
  for (const id of wave) {
    const c = byId[id];
    md += `### ${c.id} - ${c.title}\n- **Assignee:** ${c.assignee}\n- **Depends on:** ${c.dependsOn.join(", ") || "nothing"}\n`;
    md += `- **Allowed files:**${list(c.allowedFiles)}\n- **Non-goals:**${list(c.nonGoals)}\n- **Acceptance checks:**${list(c.acceptanceChecks)}\n`;
    md += `- **Required local tests:**${list(c.requiredTests)}\n- **Stop and report when:** ${c.stopAndReport}\n\n`;
  }
});
fs.writeFileSync(path.join(__dirname, "..", "outputs", "DARK_MODE_BREAKDOWN.md"), md);
console.log("wrote outputs/DARK_MODE_BREAKDOWN.md");
