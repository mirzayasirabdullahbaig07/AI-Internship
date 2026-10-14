"""ONE browser journey (real Chromium, real server, keyboard only):
  1. Tab to the field, type a bad email, press Enter  -> red inline error appears
  2. Fix the email, Enter, server answers 401         -> error state, no greeting
  3. Enter again, real API                            -> "Signed in as Mirza Yasir Abdullah Baig"
Exit code 0 = journey passed. BASE_URL env is required; SHOTS=<dir> saves screenshots."""
import os, re, sys, pathlib
from playwright.sync_api import sync_playwright, expect

BASE = os.environ["BASE_URL"]
SHOTS = os.environ.get("SHOTS")
T = 3000  # short timeouts so a broken build fails fast


def shot(page, name):
    if SHOTS:
        pathlib.Path(SHOTS).mkdir(parents=True, exist_ok=True)
        page.screenshot(path=str(pathlib.Path(SHOTS) / name))


with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={"width": 520, "height": 380})
    calls = {"n": 0}

    def first_call_is_401(route):
        calls["n"] += 1
        if calls["n"] == 1:
            route.fulfill(status=401, content_type="application/json", body='{"error":"Unauthorized"}')
        else:
            route.continue_()

    try:
        page.goto(BASE + "/loginform.html")
        page.keyboard.press("Tab")
        expect(page.get_by_label("Email")).to_be_focused(timeout=T)
        page.keyboard.type("bademail")
        page.keyboard.press("Enter")
        alert = page.get_by_role("alert")
        expect(alert).to_contain_text("valid email address", timeout=T)
        color = alert.evaluate("e => getComputedStyle(e).color")
        assert color == "rgb(255, 0, 0)", f"error text not red: {color}"
        print("step 1 PASS: bad email blocked, red inline error shown via keyboard only")
        shot(page, "journey_1_invalid_email.png")

        page.route(re.compile(r"/fixed/api/profile(\?.*)?$"), first_call_is_401)  # regex: a glob would not match a ?query
        page.get_by_label("Email").fill("mirza@example.test")
        page.get_by_label("Email").press("Enter")
        expect(page.get_by_role("alert")).to_contain_text("Could not load your profile", timeout=T)
        expect(page.get_by_text("Signed in as")).to_have_count(0, timeout=T)
        print("step 2 PASS: server 401 shows an error state, no greeting")
        shot(page, "journey_2_server_401.png")

        page.get_by_label("Email").press("Enter")
        expect(page.get_by_text("Signed in as Mirza Yasir Abdullah Baig")).to_be_visible(timeout=T)
        expect(page.get_by_role("alert")).to_have_count(0, timeout=T)
        print("step 3 PASS: retry reaches the real API and shows 'Signed in as Mirza Yasir Abdullah Baig'")
        shot(page, "journey_3_signed_in.png")
        result = 0
    except Exception as e:  # noqa: BLE001
        first = str(e).strip().splitlines()[0] if str(e).strip() else type(e).__name__
        print("JOURNEY FAILED:", first[:160])
        result = 1
    finally:
        b.close()
sys.exit(result)
