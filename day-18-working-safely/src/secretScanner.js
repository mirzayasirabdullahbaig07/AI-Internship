/**
 * Day 18 - a small secret scanner (the idea behind GitHub secret scanning / gitleaks, heavily simplified).
 * Findings never contain the secret itself: only the rule, the line number and a redacted preview.
 */
const RULES = [
  { id: "aws-access-key", re: /\b(AKIA|ASIA)[0-9A-Z]{16}\b/ },
  {
    id: "github-token",
    re: /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}\b|\bgithub_pat_[A-Za-z0-9_]{50,}\b/,
  },
  { id: "slack-token", re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { id: "stripe-live-key", re: /\b(sk|rk)_live_[A-Za-z0-9]{16,}\b/ },
  { id: "llm-api-key", re: /\bsk-(ant-)?[A-Za-z0-9_-]{32,}\b/ },
  { id: "google-api-key", re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  {
    id: "private-key-block",
    re: /-----BEGIN (RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY( BLOCK)?-----/,
  },
  {
    id: "jwt",
    re: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/,
  },
  {
    id: "credentials-in-url",
    re: /\b[a-z][a-z0-9+.-]*:\/\/[^\s:/@]+:[^\s/@]{3,}@[^\s/]+/i,
  },
  {
    id: "hardcoded-secret",
    re: /\b(password|passwd|secret|api[_-]?key|access[_-]?token|auth[_-]?token)\b["']?\s*[:=]\s*["']([^"'\s]{8,})["']/i,
  },
];

/** Values that are clearly placeholders or fake lab data are not reported as secrets. */
const FAKE_MARKERS =
  /(FAKE|EXAMPLE|REDACTED|PLACEHOLDER|CHANGEME|lab-pass|dummy|your[-_ ]?(key|token|password)|<[^>]+>|\$\{[^}]+\}|process\.env)/i;

/** An explicit, reviewable opt-out for one line, e.g. a fake password in a test. Every use shows up in diffs. */
const INLINE_ALLOW = "secret-scan:allow";

const redact = (s) =>
  s.length <= 8 ? "****" : `${s.slice(0, 4)}${"*".repeat(Math.min(s.length - 4, 12))}`;

function scanText(text, { file = "<text>" } = {}) {
  const findings = [];
  const suppressed = [];
  text.split("\n").forEach((line, idx) => {
    for (const rule of RULES) {
      const m = rule.re.exec(line);
      if (!m) continue;
      const hit = { file, line: idx + 1, rule: rule.id, preview: redact(m[0]) };
      const allowed = line.includes(INLINE_ALLOW) || FAKE_MARKERS.test(m[0]);
      (allowed ? suppressed : findings).push(hit);
    }
  });
  return { findings, suppressed };
}

module.exports = { scanText, RULES, FAKE_MARKERS, INLINE_ALLOW };
