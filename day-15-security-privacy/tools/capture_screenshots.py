"""Starts the demo server, runs every attack in headless Chromium, saves screenshots + a text summary."""
import os, pathlib, subprocess, time, urllib.request
from playwright.sync_api import sync_playwright

DAY = pathlib.Path(__file__).resolve().parent.parent
OUT = DAY / "evidence"; (OUT / "screenshots").mkdir(parents=True, exist_ok=True)
PORT = 4399
srv = subprocess.Popen(["node", str(DAY / "src" / "server.js")], env={**os.environ, "PORT": str(PORT)},
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    for _ in range(60):
        try: urllib.request.urlopen(f"http://localhost:{PORT}/"); break
        except Exception: time.sleep(0.1)
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1400, "height": 900})
        pg.goto(f"http://localhost:{PORT}/")
        pg.screenshot(path=str(OUT / "screenshots" / "demo_01_ui_hides_delete.png"), clip={"x": 0, "y": 0, "width": 1400, "height": 230})
        pg.click("#run"); pg.wait_for_selector("body[data-done=true]", timeout=60000)
        pg.screenshot(path=str(OUT / "screenshots" / "demo_02_attacks.png"), full_page=True)
        lines = []
        for side in ("insecure", "secure"):
            verdicts = pg.eval_on_selector_all(f"#{side} .row", "rows => rows.map(r => r.querySelector('h3').innerText + ' => ' + r.querySelector('.badge.bad, .badge.good').innerText)")
            lines += [f"[{side}] {v}" for v in verdicts]
        b.close()
    (OUT / "demo_verdicts.txt").write_text("\n".join(lines) + "\n"); print("\n".join(lines))
finally:
    srv.terminate()
