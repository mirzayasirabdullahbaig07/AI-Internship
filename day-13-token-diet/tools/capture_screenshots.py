"""Opens demo/index.html in headless Chromium, cross-checks the in-browser word counts
against the Node numbers, and saves a screenshot. Run from the repo root."""
import pathlib, re, json, subprocess
from playwright.sync_api import sync_playwright

DAY = pathlib.Path(__file__).resolve().parent.parent
OUT = DAY / "evidence"
(OUT / "screenshots").mkdir(parents=True, exist_ok=True)
node = subprocess.check_output(["node", str(DAY / "tools" / "report_metrics.js")], text=True)
nv = int(re.search(r"Verbose prompt : (\d+) words", node).group(1))
nb = int(re.search(r"Task brief     : (\d+) words", node).group(1))
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1360, "height": 900})
    pg.goto((DAY / "demo" / "index.html").as_uri()); pg.wait_for_selector("body[data-ready=true]")
    s1 = pg.inner_text("#s1"); s2 = pg.inner_text("#s2")
    bv = int(re.search(r"(\d+) words", s1).group(1)); bb = int(re.search(r"(\d+) words", s2).group(1))
    ok = (bv, bb) == (nv, nb)
    pg.screenshot(path=str(OUT / "screenshots" / "demo_before_after.png"), full_page=True)
    b.close()
line = f"browser counts: verbose={bv}, brief={bb} | node counts: verbose={nv}, brief={nb} -> {'MATCH' if ok else 'MISMATCH'}"
(OUT / "browser_counts.txt").write_text(line + "\n"); print(line)
raise SystemExit(0 if ok else 1)
