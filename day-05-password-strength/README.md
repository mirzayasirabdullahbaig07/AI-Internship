# Day 5 - Vibe Coding with Critical Thinking: Password Strength Meter

Run: `npx jest day-05-password-strength`

## The bounded prompt used (Standard Task Prompt Structure)

```
Goal: Build a Password Strength Meter React component (TypeScript).
Scope: day-05-password-strength/ only (PasswordStrengthMeter.tsx + passwordStrength.ts).
Must preserve: nothing existing - new files only.
Acceptance checks:
  1. Empty input shows "Empty"; <8 chars shows "Too short".
  2. Score 0-4 shown via role="meter" with aria-valuenow, plus live text.
  3. Very common passwords and single repeated characters are capped at Weak.
  4. Pasting 10,000 characters must not freeze or crash the page.
  5. One component test.
Do not: add dependencies, touch other days, or add styling frameworks.
Return: a plan first, then the diff - NOT a repository rewrite.
```

## Edge cases I deliberately hunted for

| Edge case            | Result                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------------- |
| 10,000-char paste    | Handled: input is truncated to 128 chars for analysis, user is told, runs in <50 ms (tested) |
| Empty string         | Handled ("Empty")                                                                            |
| Emoji / non-ASCII    | Does not throw (tested)                                                                      |
| Spaces / passphrases | Spaces count as symbols                                                                      |

## "Why this could be wrong" note (assumptions the AI made)

Probing the real function output showed:

1. **Leetspeak passes as "Good".** `P@ssw0rd` scores 3/4 and `Abcdefg1` scores 3/4. Both are in every cracking dictionary. The meter assumes _character variety = strength_, which is false.
2. **The "common password" list has 12 entries.** It assumed a tiny list is representative. Real checkers use millions of leaked passwords (or zxcvbn).
3. **Keyboard walks and sequences are not detected.** `qwertyuiopas` scores 2/4 ("Fair").
4. **Non-ASCII letters count as "symbols".** `[^A-Za-z0-9]` treats `n`, `u` etc. as special characters - it assumed input is English/ASCII.
5. **Truncation at 128 is a product decision the AI made silently.** It also means characters after 128 can never matter.
6. **Strength is client-side UX only.** Real password rules must be enforced on the server (Day 4 boundary rule).
   These are **known limitations, not fixed** - the lab goal is to find them. A proper fix would add `zxcvbn` after review.
