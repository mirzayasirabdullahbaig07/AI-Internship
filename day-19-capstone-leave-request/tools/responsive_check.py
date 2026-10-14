"""Checks the capstone at 320 / 390 / 768 / 1280px: no horizontal overflow, layout columns, 44px touch targets."""
import pathlib, sys
from playwright.sync_api import sync_playwright

DAY = pathlib.Path(__file__).resolve().parent.parent
SHOTS = DAY / "evidence" / "screenshots"
lines, failed = [], False
with sync_playwright() as p:
    b = p.chromium.launch()
    for w in (320, 390, 768, 1280):
        pg = b.new_page(viewport={"width": w, "height": 900})
        pg.goto((DAY / "demo" / "index.html").as_uri() + "?delay=0")
        pg.wait_for_selector(".request-list")
        over = pg.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
        cols = pg.evaluate("getComputedStyle(document.querySelector('.layout')).gridTemplateColumns.split(' ').length")
        small = pg.evaluate("[...document.querySelectorAll('button, select, input, textarea')].filter(e => e.getBoundingClientRect().height < 44).length")
        ok = over <= 0 and small == 0
        failed |= not ok
        lines.append(f"width {w:>4}px: horizontal overflow {over}px, layout columns {cols}, controls under 44px tall: {small} -> {'PASS' if ok else 'FAIL'}")
        pg.screenshot(path=str(SHOTS / f"responsive_{w}.png"), full_page=True)
        pg.close()
    b.close()
(DAY / "evidence" / "responsive_check.txt").write_text("\n".join(lines) + "\n")
print("\n".join(lines))
sys.exit(1 if failed else 0)
