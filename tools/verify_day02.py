"""Day 1/2 browser checks: overflow at several widths, keyboard-only navigation, screenshots.
Run: python3 tools/verify_day02.py   (needs: pip install playwright && playwright install chromium)
"""
import pathlib, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
SHOTS = ROOT / "report" / "screenshots"
OUT = ROOT / "report" / "evidence" / "day02_checks.txt"
SHOTS.mkdir(parents=True, exist_ok=True)
lines, failed = [], False

def log(s):
    print(s); lines.append(s)

with sync_playwright() as p:
    b = p.chromium.launch()
    # ---- Day 1: profile card ----
    d1 = (ROOT / "day-01-profile-card" / "index.html").as_uri()
    for w in (320, 1280):
        pg = b.new_page(viewport={"width": w, "height": 640}); pg.goto(d1)
        over = pg.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
        ok = over <= 0; failed |= not ok
        log(f"[Day 1] width={w}px horizontal overflow={over}px -> {'PASS' if ok else 'FAIL'}")
        pg.screenshot(path=str(SHOTS / f"day01_{w}.png"))
        if w == 1280:
            before = pg.evaluate("getComputedStyle(document.querySelector('.follow-btn')).backgroundColor")
            pg.hover(".follow-btn"); pg.wait_for_timeout(300)
            after = pg.evaluate("getComputedStyle(document.querySelector('.follow-btn')).backgroundColor")
            ok = before != after; failed |= not ok
            log(f"[Day 1] hover state: {before} -> {after} -> {'PASS' if ok else 'FAIL'}")
            pg.screenshot(path=str(SHOTS / "day01_hover.png"))
        pg.close()
    # ---- Day 2: sign-in ----
    d2 = (ROOT / "day-02-responsive-signin" / "index.html").as_uri()
    for w in (320, 390, 768, 1280):
        pg = b.new_page(viewport={"width": w, "height": 700}); pg.goto(d2)
        over = pg.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
        ok = over <= 0; failed |= not ok
        log(f"[Day 2] width={w}px horizontal overflow={over}px -> {'PASS' if ok else 'FAIL'}")
        pg.screenshot(path=str(SHOTS / f"day02_{w}.png"))
        pg.close()
    # keyboard-only
    pg = b.new_page(viewport={"width": 320, "height": 700}); pg.goto(d2)
    order = []
    for _ in range(3):
        pg.keyboard.press("Tab")
        order.append(pg.evaluate("document.activeElement.id || document.activeElement.tagName"))
    ok = order == ["email", "password", "BUTTON"]; failed |= not ok
    log(f"[Day 2] Tab order: {order} -> {'PASS' if ok else 'FAIL'}")
    pg.screenshot(path=str(SHOTS / "day02_keyboard_focus.png"))
    pg.evaluate("document.querySelector('form').addEventListener('submit', e => { e.preventDefault(); window.__submitted = true; })")
    pg.keyboard.press("Enter")
    ok = pg.evaluate("window.__submitted === true"); failed |= not ok
    log(f"[Day 2] Enter on focused button submits form -> {'PASS' if ok else 'FAIL'}")
    labels = pg.evaluate("[...document.querySelectorAll('input')].every(i => document.querySelector(`label[for=\"${i.id}\"]`))")
    failed |= not labels
    log(f"[Day 2] every input has a <label for> -> {'PASS' if labels else 'FAIL'}")
    b.close()

OUT.write_text("\n".join(lines) + "\n")
sys.exit(1 if failed else 0)
