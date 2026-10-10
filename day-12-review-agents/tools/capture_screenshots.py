"""Starts the demo server, drives it in headless Chromium and saves demo screenshots.
Run from the repo root:  python3 day-12-review-agents/tools/capture_screenshots.py
(needs: npm run demo:build first, and pip install playwright && playwright install chromium)
"""
import pathlib, subprocess, time, urllib.request
from playwright.sync_api import sync_playwright

DAY = pathlib.Path(__file__).resolve().parent.parent
OUT = DAY / "evidence" / "screenshots"
OUT.mkdir(parents=True, exist_ok=True)
PORT = 4199
srv = subprocess.Popen(["node", str(DAY / "src" / "server.js")], env={**__import__("os").environ, "PORT": str(PORT)},
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    for _ in range(50):
        try:
            urllib.request.urlopen(f"http://localhost:{PORT}/"); break
        except Exception:
            time.sleep(0.1)
    base = f"http://localhost:{PORT}"
    with sync_playwright() as p:
        b = p.chromium.launch()
        # 1) before clicking, 2) after running all attacks
        pg = b.new_page(viewport={"width": 1400, "height": 900})
        pg.goto(base + "/")
        pg.screenshot(path=str(OUT / "demo_01_before.png"), full_page=True)
        pg.click("#run")
        pg.wait_for_selector("body[data-done=true]")
        pg.screenshot(path=str(OUT / "demo_02_attacks_vs_fixed.png"), full_page=True)
        # close-ups of each panel
        pg.locator(".panel.vuln").screenshot(path=str(OUT / "demo_03_vulnerable_panel.png"))
        pg.locator(".panel.fixed").screenshot(path=str(OUT / "demo_04_fixed_panel.png"))
        # LoginForm (Day 11 code, after Day 12 fixes)
        lf = b.new_page(viewport={"width": 520, "height": 380})
        lf.goto(base + "/loginform.html")
        lf.fill("input", "bademail"); lf.click("button")
        lf.wait_for_selector("[role=alert]")
        lf.screenshot(path=str(OUT / "loginform_01_invalid_email.png"))
        lf.fill("input", "mirzayasirabdullahbaig07@users.noreply.github.com"); lf.click("button")
        lf.wait_for_selector("text=Signed in as")
        lf.screenshot(path=str(OUT / "loginform_02_signed_in.png"))
        b.close()
    print("screenshots saved to", OUT)
finally:
    srv.terminate()
