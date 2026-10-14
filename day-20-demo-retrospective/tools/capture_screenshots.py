"""Opens the dashboard in headless Chromium, cross-checks it against the JSON it was built from, saves a screenshot."""
import json, pathlib, re, sys
from playwright.sync_api import sync_playwright

DAY = pathlib.Path(__file__).resolve().parent.parent
data = json.loads((DAY / "evidence" / "dashboard_data.json").read_text())
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1320, "height": 900})
    pg.goto((DAY / "demo" / "dashboard.html").as_uri()); pg.wait_for_selector("body[data-ready=true]")
    tiles = pg.locator(".tile b").all_inner_texts()
    rows = pg.locator("table tr").count() - 1
    ok = tiles[0] == str(data["totals"]["passed"]) and rows == 20 and tiles[2] == str(data["totals"]["suites"])
    pg.screenshot(path=str(DAY / "evidence" / "screenshots" / "dashboard.png"), full_page=True)
    b.close()
line = f"dashboard on screen: tests passing={tiles[0]}, suites={tiles[2]}, day rows={rows} | data file: {data['totals']['passed']} passing, {data['totals']['suites']} suites -> {'MATCH' if ok else 'MISMATCH'}"
(DAY / "evidence" / "dashboard_check.txt").write_text(line + "\n"); print(line)
sys.exit(0 if ok else 1)
