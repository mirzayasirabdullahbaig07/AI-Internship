/** @jest-environment node */
const { scanText } = require("../src/secretScanner");

// Secrets are assembled at runtime so this file never contains a complete one (and passes its own scan).
const SAMPLES = {
  "aws-access-key": "AKIA" + "QWERTYUIOPASDFGH",
  "github-token": "ghp_" + "a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8",
  "slack-token": "xoxb-" + "1234567890-abcdefghij",
  "stripe-live-key": "sk_live_" + "abcdefghijklmnop12",
  "llm-api-key": "sk-ant-" + "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "google-api-key": "AIza" + "SyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q",
  "private-key-block": "-----BEGIN " + "RSA PRIVATE KEY-----",
  jwt:
    "eyJ" +
    "hbGciOiJIUzI1NiJ9" +
    "." +
    "eyJ" +
    "zdWIiOiIxMjM0NTY3ODkwIn0" +
    "." +
    "abcdefghijklmnop",
  "credentials-in-url": "postgres://" + "appuser:Zx9wQ4tLm2@db.internal/app",
  "hardcoded-secret": "pass" + "word = '" + "Sup3rS3cretValue" + "'",
};

describe("Day 18: secret scanner", () => {
  test.each(Object.entries(SAMPLES))("detects %s", (rule, secret) => {
    const { findings } = scanText(`line one\nconfig = ${secret}\nline three`, {
      file: "x.js",
    });
    expect(findings.map((f) => f.rule)).toContain(rule);
    expect(findings.find((f) => f.rule === rule).line).toBe(2);
  });

  test("a finding never contains the secret itself (redacted preview)", () => {
    for (const secret of Object.values(SAMPLES)) {
      const { findings } = scanText(`x = ${secret}`);
      for (const f of findings) {
        expect(JSON.stringify(f)).not.toContain(secret);
        expect(f.preview.length).toBeLessThan(secret.length + 1);
      }
    }
  });

  test("fake and placeholder values are suppressed, and counted", () => {
    const text = [
      'password: "lab-pass-yasir-1"',
      'const k = "AKIA' + 'IOSFODNN7EXAMPLE"',
      'api_key = "<your-key-here>"',
      "const t = process.env.API_TOKEN",
    ].join("\n");
    const { findings, suppressed } = scanText(text);
    expect(findings).toEqual([]);
    expect(suppressed.length).toBeGreaterThanOrEqual(3);
  });

  test("the inline allow marker suppresses only its own line", () => {
    const secret = SAMPLES["hardcoded-secret"];
    const { findings, suppressed } = scanText(
      `${secret} // secret-scan:allow (fake)\n${secret}`,
    );
    expect(suppressed).toHaveLength(1);
    expect(findings).toHaveLength(1);
    expect(findings[0].line).toBe(2);
  });

  test("ordinary code and prose are not flagged", () => {
    const text =
      "const total = items.reduce((a, b) => a + b, 0);\nThe password must be 12 characters.\nresetPassword(user);\nfetch(url, { headers: { Authorization: `Bearer ${token}` } });";
    expect(scanText(text).findings).toEqual([]);
  });

  test("reports the correct file and line for multiple findings", () => {
    const text = `a\n${SAMPLES["aws-access-key"]}\nb\n${SAMPLES["github-token"]}`;
    const { findings } = scanText(text, { file: "src/config.js" });
    expect(findings.map((f) => [f.file, f.line])).toEqual([
      ["src/config.js", 2],
      ["src/config.js", 4],
    ]);
  });
});
