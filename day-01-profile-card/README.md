# Day 1 - Software Delivery Basics: Static Profile Card

**Lab:** plain HTML/CSS profile card (name, role, "Follow" button). No JavaScript.

Run: open `index.html` in a browser.

## Acceptance criteria (written before coding)

1. The "Follow" button has a distinct hover state (darker colour + 1px lift).
2. The button shows a visible keyboard focus ring (`:focus-visible`) and is a real `<button>` so Tab/Enter/Space work.
3. The card is semantic (`<main>`, `<article>`, `<h1>`), uses `lang="en"`, and shows no horizontal scroll at 320px.

## Knowledge check

**UI change vs data change.**
A _UI change_ (e.g. button colour) only alters presentation in the browser - it lives in HTML/CSS, needs no server, and is fully reversible by reloading.
A _data change_ (e.g. saving the "follow" state) alters persistent state: the browser sends a request (POST/PATCH) to an API, the API validates authorization, the database stores the new state, and the response updates the UI. It crosses trust boundaries, needs auth, validation, error handling and tests - and must survive a refresh.

## Definition of "Done"

Generated code is not done. Done = styled, accessible, tested locally, reviewed, pushed, CI passed, merged, verifiable in staging.
