# Day 2 - HTML, CSS & Responsive UI: Sign-in Form

**Lab:** responsive sign-in form (Email + Password), CSS Grid layout, correct at 320 / 390 / 768 / desktop.

Run: open `index.html` in a browser.

## What AI usually gets wrong (and what was enforced here)

- Semantic HTML: `<form>`, `<button>`, and `<label for="...">` linked to each input (not nested `<div>` soup).
- Mobile-first: base styles target 320px; `@media (min-width: ...)` scales up.
- Grid overflow: `minmax(0, 1fr)` and `min-width: 0` stop long content blowing out the layout (the grid equivalent of the Flexbox `min-width: auto` gotcha).

## Verification (automated with Playwright - see `tools/verify_day02.py`)

- Zero horizontal overflow at 320, 390, 768 and 1280px.
- Keyboard-only: Tab order is Email -> Password -> Sign in; Enter on the button submits the form.
  Results are in the report PDF and `report/evidence/day02_checks.txt`.
