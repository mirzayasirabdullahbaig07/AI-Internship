import { fireEvent, render, screen } from "@testing-library/react";
import LeaveRequestForm from "../src/LeaveRequestForm";
import { createFakeApi } from "../src/leaveApi";

const TODAY = "2026-10-12";

/**
 * Regression test for a bug found in the Day 20 review (the capstone's required focused component test
 * is still LeaveRequestForm.test.tsx; this one only guards this specific bug).
 *
 * When the list of requests failed to load, the client cannot check overlaps, so the SERVER rejects an
 * overlapping request and the error is attached to "Start date". But an overlap depends on BOTH dates.
 * The error used to be cleared only when the user edited the field it was attached to, so fixing the
 * END date left a stale "overlap" error, a stale summary and aria-invalid="true" on a valid form.
 */
test("a server-side overlap error clears when either date is corrected, not only the one it is attached to", async () => {
  render(
    <LeaveRequestForm
      api={createFakeApi({ today: TODAY, scenario: "error", delayMs: 0 })}
      today={TODAY}
    />,
  );
  expect(await screen.findByText(/We couldn't load your requests/)).toBeInTheDocument(); // client has no list to check against

  fireEvent.change(screen.getByLabelText("Leave type"), { target: { value: "annual" } });
  fireEvent.change(screen.getByLabelText("Start date"), {
    target: { value: "2026-10-30" },
  });
  fireEvent.change(screen.getByLabelText("End date"), {
    target: { value: "2026-11-03" },
  });
  fireEvent.change(screen.getByLabelText("Reason"), {
    target: { value: "Long weekend that clashes with approved leave" },
  });
  fireEvent.click(screen.getByRole("button", { name: /submit request/i }));

  expect(
    (await screen.findAllByText(/overlap your approved leave/)).length,
  ).toBeGreaterThan(0);
  expect(screen.getByLabelText("Start date")).toHaveAttribute("aria-invalid", "true");

  fireEvent.change(screen.getByLabelText("End date"), {
    target: { value: "2026-11-01" },
  }); // no longer overlaps 2-6 Nov

  expect(screen.queryAllByText(/overlap your approved leave/)).toHaveLength(0);
  expect(screen.getByLabelText("Start date")).toHaveAttribute("aria-invalid", "false");
  expect(screen.queryAllByText(/problem with your request/)).toHaveLength(0);
});

/**
 * Second regression test (Day 20 review). Pressing "Try again" removes that very button from the page.
 * Focus used to fall back to <body>, so a keyboard or screen-reader user lost their place (WCAG 2.4.3).
 * Focus must move to the stable "My requests" heading, which stays on the page in every state.
 */
test('after "Try again" focus moves to the My requests heading instead of falling to the page body', async () => {
  render(
    <LeaveRequestForm
      api={createFakeApi({ today: TODAY, scenario: "error", delayMs: 0 })}
      today={TODAY}
    />,
  );
  const retry = await screen.findByRole("button", { name: /try again/i });
  retry.focus();
  expect(retry).toHaveFocus();

  fireEvent.click(retry);
  expect(await screen.findByText("Family wedding trip")).toBeInTheDocument(); // retry succeeded

  expect(screen.getByRole("heading", { name: "My requests" })).toHaveFocus();
});
