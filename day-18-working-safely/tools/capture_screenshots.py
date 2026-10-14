"""Opens the demo, runs the scanner and handoff validator in headless Chromium, saves screenshots + text verdicts."""
import pathlib
from playwright.sync_api import sync_playwright

DAY = pathlib.Path(__file__).resolve().parent.parent
OUT = DAY / "evidence"; (OUT / "screenshots").mkdir(parents=True, exist_ok=True)
lines = []
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1360, "height": 900})
    pg.goto((DAY / "demo" / "index.html").as_uri()); pg.wait_for_selector("body[data-ready=true]")
    lines.append("scanner: " + " | ".join(pg.locator("#findings li").all_inner_texts()))
    lines.append("handoff (real): " + pg.inner_text("#hres").split("\n")[0])
    pg.screenshot(path=str(OUT / "screenshots" / "demo_1_audit_scanner_good_handoff.png"), full_page=True)
    pg.click("#bad")
    lines.append("handoff (unsafe): " + " | ".join(pg.locator("#hres li").all_inner_texts()))
    pg.screenshot(path=str(OUT / "screenshots" / "demo_2_unsafe_handoff_rejected.png"), full_page=True)
    b.close()
(OUT / "demo_verdicts.txt").write_text("\n".join(lines) + "\n"); print("\n".join(lines))
