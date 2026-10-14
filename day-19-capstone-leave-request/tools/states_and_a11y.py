"""Visits every UI state of the capstone, runs axe-core (automated WCAG checks) on each and saves screenshots.
Run from the repo root after `node day-19-capstone-leave-request/tools/build_demo.mjs`."""
import pathlib, sys
from playwright.sync_api import sync_playwright

DAY = pathlib.Path(__file__).resolve().parent.parent
AXE = DAY.parent / "node_modules" / "axe-core" / "axe.min.js"
PAGE = (DAY / "demo" / "index.html").as_uri()
SHOTS = DAY / "evidence" / "screenshots"
SHOTS.mkdir(parents=True, exist_ok=True)
SUBMIT = "button:has-text('Submit request')"


def fill_valid(pg):
    pg.get_by_label("Leave type").select_option("sick")
    pg.get_by_label("Start date").fill("2026-11-10")
    pg.get_by_label("End date").fill("2026-11-12")
    pg.get_by_label("Reason").fill("Medical appointment and recovery")


def submit_empty(pg):
    pg.click(SUBMIT)


def submit_valid(pg):
    fill_valid(pg)
    pg.click(SUBMIT)


# name, query string, wait for the list first?, action, selector that proves the state
STATES = [
    ("loading", "?scenario=slow", False, None, "text=Loading your leave requests"),
    ("loaded_list", "?delay=0", False, None, ".request-list"),
    ("empty", "?scenario=empty&delay=0", False, None, "text=No leave requests yet"),
    ("load_error", "?scenario=error&delay=0", False, None, "text=We couldn't load your requests"),
    ("validation_errors", "?delay=0", True, submit_empty, ".error-summary"),
    ("submit_success", "?delay=0", True, submit_valid, ".banner-success"),
    ("submit_error", "?scenario=submit-error&delay=0", True, submit_valid, ".banner-error"),
]
RULES = {"runOnly": {"type": "tag", "values": ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"]}}
lines, total = [], 0
with sync_playwright() as p:
    b = p.chromium.launch()
    for name, query, wait_list, action, proof in STATES:
        pg = b.new_page(viewport={"width": 1100, "height": 760})
        pg.goto(PAGE + query)
        if wait_list:
            pg.wait_for_selector(".request-list", timeout=6000)
        if action:
            action(pg)
        pg.wait_for_selector(proof, timeout=6000)
        pg.add_script_tag(path=str(AXE))
        pg.screenshot(path=str(SHOTS / f"state_{name}.png"), full_page=True)
        result = pg.evaluate("rules => axe.run(document, rules)", RULES)
        violations = result["violations"]
        total += len(violations)
        lines.append(f"[{name}] axe rules passed: {len(result['passes'])}, violations: {len(violations)}")
        for v in violations:
            lines.append(f"    - {v['id']} ({v['impact']}): {v['help']} -> {len(v['nodes'])} node(s)")
            for n in v["nodes"][:3]:
                lines.append(f"        {n['html'][:110]}")
        pg.close()
    # Negative control: a page with deliberate bugs MUST be flagged, otherwise this audit proves nothing.
    ctl = b.new_page()
    ctl.set_content("<html lang='en'><head><title>t</title></head><body><main><input type='text'><button></button><p style='color:#bbb;background:#fff'>low contrast</p><img src='x.png'></main></body></html>")
    ctl.add_script_tag(path=str(AXE))
    found = sorted(v["id"] for v in ctl.evaluate("rules => axe.run(document, rules)", RULES)["violations"])
    control_ok = len(found) >= 4
    lines.append(f"[negative control] deliberately broken page -> {len(found)} violations detected: {', '.join(found)} -> {'harness OK' if control_ok else 'HARNESS BLIND'}")
    b.close()
text = "\n".join(lines) + f"\n\nTOTAL violations across {len(STATES)} states: {total}\n"
(DAY / "evidence" / "a11y_audit.txt").write_text(text)
print(text)
sys.exit(0 if total == 0 and control_ok else 1)
