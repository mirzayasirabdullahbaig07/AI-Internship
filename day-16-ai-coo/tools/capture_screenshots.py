"""Opens the demo in headless Chromium, clicks each preset and saves screenshots + verdicts."""
import pathlib
from playwright.sync_api import sync_playwright

DAY = pathlib.Path(__file__).resolve().parent.parent
OUT = DAY / "evidence"; (OUT / "screenshots").mkdir(parents=True, exist_ok=True)
CASES = [("real", "demo_1_real_inputs_invalid.png"), ("complete", "demo_2_complete_valid.png"),
         ("agentMerge", "demo_3_agent_can_merge_invalid.png"), ("selfReview", "demo_4_self_review_invalid.png")]
lines = []
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1340, "height": 760})
    pg.goto((DAY / "demo" / "index.html").as_uri()); pg.wait_for_selector("body[data-ready=true]")
    for preset, name in CASES:
        pg.click(f"button[data-p={preset}]")
        verdict = pg.inner_text("#result"); fails = pg.locator("li.no").all_inner_texts()
        lines.append(f"{preset}: {verdict} | failing: {[f.replace('FAIL', '').strip() for f in fails]}")
        pg.screenshot(path=str(OUT / "screenshots" / name))
    b.close()
(OUT / "demo_verdicts.txt").write_text("\n".join(lines) + "\n"); print("\n".join(lines))
