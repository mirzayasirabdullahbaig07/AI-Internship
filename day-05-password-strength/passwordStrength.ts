/** Only the first MAX_LEN characters are analysed, so a pasted 10,000-char string costs the same as 128. */
export const MAX_LEN = 128;

export type Score = 0 | 1 | 2 | 3 | 4;
export type Label = "Empty" | "Too short" | "Weak" | "Fair" | "Good" | "Strong";

export interface Strength {
  score: Score;
  label: Label;
  truncated: boolean;
  feedback: string[];
}

const COMMON = new Set([
  "password",
  "password1",
  "password123",
  "12345678",
  "123456789",
  "qwerty123",
  "iloveyou",
  "admin123",
  "letmein1",
  "welcome1",
  "abc12345",
  "11111111",
]);

const LABELS: Record<Score, Label> = {
  0: "Too short",
  1: "Weak",
  2: "Fair",
  3: "Good",
  4: "Strong",
};

export function evaluatePassword(input: string): Strength {
  if (input.length === 0) {
    return {
      score: 0,
      label: "Empty",
      truncated: false,
      feedback: ["Enter a password."],
    };
  }
  const truncated = input.length > MAX_LEN;
  const pw = truncated ? input.slice(0, MAX_LEN) : input;
  const feedback: string[] = [];
  if (truncated) feedback.push(`Only the first ${MAX_LEN} characters are checked.`);

  if (pw.length < 8) {
    feedback.push("Use at least 8 characters.");
    return { score: 0, label: "Too short", truncated, feedback };
  }

  let points = 0;
  if (pw.length >= 8) points++;
  if (pw.length >= 12) points++;
  if (pw.length >= 16) points++;

  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((re) =>
    re.test(pw),
  ).length;
  points += classes - 1; // 1 class = 0 extra, 4 classes = +3
  if (classes < 3) feedback.push("Mix upper/lower case, numbers and symbols.");

  if (COMMON.has(pw.toLowerCase())) {
    feedback.push("This is a very common password.");
    points = 0;
  }
  if (/^(.)\1+$/.test(pw)) {
    feedback.push("Avoid repeating a single character.");
    points = 0;
  }

  const score = Math.max(1, Math.min(4, Math.floor(points / 1.5) + 1)) as Score;
  const final: Score = points === 0 ? 1 : score;
  return { score: final, label: LABELS[final], truncated, feedback };
}
