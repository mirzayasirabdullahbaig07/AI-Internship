/** Word count: whitespace-separated tokens (same rule the browser demo uses). */
function countWords(text) {
  const t = text.trim();
  return t === "" ? 0 : t.split(/\s+/).length;
}

/**
 * ROUGH token estimate: ~4 characters per token for English prose.
 * This is a heuristic, NOT a real tokenizer; real counts differ per model.
 */
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

/** Returns, for each core criterion, whether the text still contains it. */
function checkCriteria(text, criteria, key) {
  return criteria.map((c) => ({
    id: c.id,
    label: c.label,
    present: c[key].every((pattern) => new RegExp(pattern, "i").test(text)),
  }));
}

/** Noise = history, emotion, flattery. None of it may survive into the brief. */
function findNoise(text, noise) {
  return noise.filter((n) => new RegExp(n, "i").test(text));
}

module.exports = { countWords, estimateTokens, checkCriteria, findNoise };
