/**
 * Day 18 - safe handoff report. It must contain ONLY:
 *   a PR link, the final SHA, the scoped objective, test evidence, and any remaining blockers.
 * No raw code, no secrets, no extra sections. validateHandoff() enforces that on the finished text.
 */
const { scanText } = require("./secretScanner");

const SECTIONS = [
  "PR link",
  "Final SHA",
  "Scoped objective",
  "Test evidence",
  "Remaining blockers",
];
const NOT_OPENED = "NOT OPENED";
const SHA = /^[0-9a-f]{7,40}$/;
const CODE_SMELLS = [
  { id: "fenced-code", re: /```|~~~/ },
  { id: "indented-code", re: /^( {4}|\t)\S/m },
  {
    id: "source-keywords",
    re: /\b(function\s*\w*\(|const\s+\w+\s*=|let\s+\w+\s*=|=>|import\s+.+\s+from|class\s+\w+\s*[{:]|def\s+\w+\()/,
  },
  { id: "stack-trace", re: /\n\s+at\s+\S+\s+\(.+:\d+:\d+\)/ },
  { id: "html-tags", re: /<\/?(script|div|span|form|input|html|body)\b/i },
];

function buildHandoff({ prLink, finalSha, objective, evidence, blockers }) {
  const link = prLink && prLink.trim() ? prLink.trim() : NOT_OPENED;
  const allBlockers = [...(blockers ?? [])];
  if (link === NOT_OPENED && !allBlockers.some((b) => /PR/i.test(b)))
    allBlockers.unshift(
      "The pull request has not been opened yet (needs the owner's GitHub account).",
    );
  const lines = [
    "# Handoff report",
    "",
    "## PR link",
    link,
    "",
    "## Final SHA",
    finalSha,
    "",
    "## Scoped objective",
    objective,
    "",
    "## Test evidence",
    ...(evidence ?? []).map((e) => `- ${e.command} -> ${e.result}`),
    "",
    "## Remaining blockers",
    ...(allBlockers.length ? allBlockers.map((b) => `- ${b}`) : ["- none"]),
    "",
  ];
  return lines.join("\n");
}

function validateHandoff(markdown) {
  const errors = [];
  const add = (code, message) => errors.push({ code, message });
  const text = String(markdown ?? "");

  const headings = [...text.matchAll(/^#{1,6}\s+(.+?)\s*$/gm)].map((m) => m[1]);
  const body = headings.filter((h) => h !== "Handoff report");
  if (JSON.stringify(body) !== JSON.stringify(SECTIONS))
    add(
      "SECTIONS",
      `sections must be exactly, in order: ${SECTIONS.join(", ")} (found: ${body.join(", ") || "none"})`,
    );

  const part = (name) => {
    const m = new RegExp(
      `^##\\s+${name}\\s*\\n([\\s\\S]*?)(?=^##\\s|(?![\\s\\S]))`,
      "m",
    ).exec(text);
    return m ? m[1].trim() : "";
  };
  const link = part("PR link");
  if (!(link === NOT_OPENED || /^https:\/\/\S+$/.test(link)))
    add("PR_LINK", `PR link must be an https URL or "${NOT_OPENED}"`);
  if (link === NOT_OPENED && !/PR|pull request/i.test(part("Remaining blockers")))
    add("PR_BLOCKER", "a PR that is not opened must be listed as a blocker");
  if (!SHA.test(part("Final SHA"))) add("SHA", "final SHA must be 7-40 hex characters");
  if (part("Scoped objective").length < 15)
    add("OBJECTIVE", "scoped objective is required");
  if (!/^- .+ -> .+/m.test(part("Test evidence")))
    add("EVIDENCE", "test evidence must list 'command -> result' lines");
  if (part("Remaining blockers").length === 0)
    add("BLOCKERS", 'remaining blockers must be listed (or "- none")');

  for (const smell of CODE_SMELLS)
    if (smell.re.test(text))
      add("RAW_CODE", `looks like raw code (${smell.id}); a handoff contains no code`);
  const { findings } = scanText(text, { file: "handoff" });
  for (const f of findings)
    add("SECRET", `possible secret (${f.rule}) on line ${f.line}: ${f.preview}`);

  return { valid: errors.length === 0, errors };
}

module.exports = { buildHandoff, validateHandoff, SECTIONS, NOT_OPENED };
