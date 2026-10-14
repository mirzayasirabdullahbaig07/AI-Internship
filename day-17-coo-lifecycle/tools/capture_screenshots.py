"""Drives the lifecycle demo in headless Chromium; saves screenshots and the audit log as text."""
import pathlib
from playwright.sync_api import sync_playwright

DAY = pathlib.Path(__file__).resolve().parent.parent
OUT = DAY / "evidence"; (OUT / "screenshots").mkdir(parents=True, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1380, "height": 820})
    pg.goto((DAY / "demo" / "index.html").as_uri()); pg.wait_for_selector("body[data-ready=true]")
    pg.screenshot(path=str(OUT / "screenshots" / "demo_1_task_cards.png"))
    def nxt(n):
        for _ in range(n): pg.click("#next")
    def bad(i): pg.click(f'#illegal button[data-i="{i}"]')
    # illegal button indexes: 0 AI agent merges, 1 author self-merge, 2 skip ahead, 3 implementer reviews itself,
    #                         4 CI not_run, 5 CI on a different SHA, 6 new commit
    nxt(4)                    # objective, task cards, implementation, evidence
    bad(3)                    # the implementing agent tries to review its own work
    nxt(1)                    # independent review
    bad(4); bad(5)            # CI "not run" and CI on the wrong SHA
    nxt(1)                    # CI passed on the right SHA
    bad(0); bad(1)            # an AI agent and the author try to approve the merge
    pg.screenshot(path=str(OUT / "screenshots" / "demo_2_illegal_moves_rejected.png"), full_page=True)
    bad(6)                    # a new commit is legal but wipes review + CI
    bad(2)                    # so approving the merge now is a skipped step
    pg.screenshot(path=str(OUT / "screenshots" / "demo_3_new_commit_invalidates.png"), full_page=True)
    pg.click("#reset"); nxt(8)
    assert pg.get_attribute("body", "data-state") == "release_note_drafted"
    pg.screenshot(path=str(OUT / "screenshots" / "demo_4_full_pipeline_done.png"), full_page=True)
    b.close()
print("screenshots saved")
