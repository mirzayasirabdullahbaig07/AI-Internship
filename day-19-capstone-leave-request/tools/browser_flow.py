"""THE ONE browser flow test for the capstone (real Chromium, keyboard only).
  1. Tab order through the form is logical
  2. Enter on an empty form -> error summary appears and takes focus
  3. Follow the summary link with the keyboard, then fill every field by typing, submit with Enter
  4. Success banner takes focus, the request is listed as Pending, the form is cleared
  5. A request overlapping approved leave is refused with a clear message
  6. At 320px there is no horizontal scrolling
Exit code 0 = passed. SHOTS=<dir> saves screenshots; BASE env overrides the page URL."""
import os, pathlib, sys
from playwright.sync_api import sync_playwright, expect

DAY = pathlib.Path(__file__).resolve().parent.parent
URL = os.environ.get("BASE") or (DAY / "demo" / "index.html").as_uri()
SHOTS = os.environ.get("SHOTS")
T = 4000


def shot(page, name):
    if SHOTS:
        pathlib.Path(SHOTS).mkdir(parents=True, exist_ok=True)
        page.screenshot(path=str(pathlib.Path(SHOTS) / name), full_page=True)


def focused_name(page):
    return page.evaluate("""() => { const e = document.activeElement;
        const l = e.labels && e.labels[0] ? e.labels[0].textContent : null;
        return l || e.getAttribute('aria-label') || (e.tagName === 'BUTTON' ? e.textContent : e.tagName) }""")


def tab_to(page, name, limit=10):
    """Tab until the named control has focus. A date input has native extra stops (day, year, calendar button)."""
    for _ in range(limit):
        page.keyboard.press("Tab")
        if focused_name(page) == name:
            return
    raise AssertionError(f"could not Tab to {name!r}; focus is on {focused_name(page)!r}")


with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={"width": 1100, "height": 800})
    try:
        page.goto(URL + "?delay=0")
        expect(page.get_by_text("Family wedding trip")).to_be_visible(timeout=T)

        # 1. tab order (a date input has several internal stops; collapse repeats)
        order = []
        for _ in range(20):
            page.keyboard.press("Tab")
            name = focused_name(page)
            if not order or order[-1] != name:
                order.append(name)
            if name == "Submit request":
                break
        assert order == ["Leave type", "Start date", "End date", "Reason", "Submit request"], f"tab order: {order}"
        print("step 1 PASS: tab order =", " -> ".join(order))

        # 2. Enter on the submit button with an empty form
        page.keyboard.press("Enter")
        summary = page.get_by_role("alert")
        expect(summary).to_contain_text("There are 4 problems with your request", timeout=T)
        assert page.evaluate("document.activeElement.getAttribute('role')") == "alert", "summary did not take focus"
        print("step 2 PASS: empty submit -> 4 problems announced, focus on the summary")
        shot(page, "flow_1_errors_announced.png")

        # 3. follow the first summary link, then fill everything by typing
        page.keyboard.press("Tab")
        page.keyboard.press("Enter")  # "Leave type: Choose the type of leave."
        assert focused_name(page) == "Leave type", f"link did not focus the field: {focused_name(page)}"
        page.keyboard.type("Sick")
        assert page.get_by_label("Leave type").input_value() == "sick", "type-ahead did not choose Sick leave"
        page.keyboard.press("Tab")  # from the select to Start date
        page.keyboard.type("11102026")
        tab_to(page, "End date")
        page.keyboard.type("11122026")
        tab_to(page, "Reason")
        page.keyboard.type("Medical appointment and recovery")
        tab_to(page, "Submit request")
        assert page.get_by_label("Start date").input_value() == "2026-11-10", page.get_by_label("Start date").input_value()
        assert page.get_by_label("End date").input_value() == "2026-11-12"
        page.keyboard.press("Enter")

        # 4. success
        banner = page.get_by_role("status")
        expect(banner).to_contain_text("submitted", timeout=T)
        expect(banner).to_contain_text("Sick leave from 10 Nov 2026 to 12 Nov 2026. Status: Pending.")
        assert page.evaluate("document.activeElement.getAttribute('role')") == "status", "banner did not take focus"
        expect(page.get_by_text("Medical appointment and recovery")).to_be_visible(timeout=T)
        assert page.get_by_label("Start date").input_value() == "", "form was not cleared"
        print("step 3-4 PASS: typed every field, Enter submitted, banner focused, request listed as Pending, form cleared")
        shot(page, "flow_2_success.png")

        # 5. overlap with approved leave (2 Nov - 6 Nov) is refused
        page.get_by_label("Leave type").select_option("annual")
        page.get_by_label("Start date").fill("2026-11-04")
        page.get_by_label("End date").fill("2026-11-05")
        page.get_by_label("Reason").fill("Trying to take days I already have")
        page.get_by_role("button", name="Submit request").click()
        expect(page.get_by_role("alert")).to_contain_text("overlap your approved leave from 2026-11-02 to 2026-11-06", timeout=T)
        print("step 5 PASS: overlapping approved leave is refused with the clashing dates named")
        shot(page, "flow_3_overlap_refused.png")

        # 6. 320px: no sideways scrolling
        page.set_viewport_size({"width": 320, "height": 800})
        over = page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
        assert over <= 0, f"horizontal overflow at 320px: {over}px"
        print("step 6 PASS: no horizontal overflow at 320px")
        shot(page, "flow_4_mobile_320.png")
        result = 0
    except Exception as e:  # noqa: BLE001
        first = str(e).strip().splitlines()[0] if str(e).strip() else type(e).__name__
        print("FLOW FAILED:", first[:220])
        shot(page, "flow_FAILED.png")
        result = 1
    finally:
        b.close()
sys.exit(result)
