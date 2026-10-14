import { fireEvent, render, screen } from "@testing-library/react";
import LeaveRequestForm from "../src/LeaveRequestForm";
import { createFakeApi } from "../src/leaveApi";

const TODAY = "2026-10-12";

/**
 * ONE focused component test: the capstone's core promise.
 * An invalid submission is ANNOUNCED (alert + focus on the summary + aria-invalid + described-by),
 * and once corrected, the request is submitted, confirmed, listed and the form is cleared.
 */
test("an invalid submission is announced and focused; the corrected one is submitted, confirmed and listed", async () => {
  render(
    <LeaveRequestForm api={createFakeApi({ today: TODAY, delayMs: 0 })} today={TODAY} />,
  );
  expect(screen.getByText(/Loading your leave requests/)).toBeInTheDocument();
  expect(await screen.findByText("Family wedding trip")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /submit request/i }));
  const summary = screen.getByRole("alert");
  expect(summary).toHaveTextContent("There are 4 problems with your request");
  expect(summary).toHaveFocus();
  const start = screen.getByLabelText("Start date");
  expect(start).toHaveAttribute("aria-invalid", "true");
  expect(start).toHaveAccessibleDescription(/Enter a start date/);

  fireEvent.change(screen.getByLabelText("Leave type"), { target: { value: "sick" } });
  fireEvent.change(start, { target: { value: "2026-11-10" } });
  fireEvent.change(screen.getByLabelText("End date"), {
    target: { value: "2026-11-12" },
  });
  fireEvent.change(screen.getByLabelText("Reason"), {
    target: { value: "Medical appointment and recovery" },
  });
  fireEvent.click(screen.getByRole("button", { name: /submit request/i }));

  const confirmation = await screen.findByRole("status");
  expect(confirmation).toHaveTextContent(/Request LR-\d+ submitted/);
  expect(confirmation).toHaveTextContent(
    "Sick leave from 10 Nov 2026 to 12 Nov 2026. Status: Pending.",
  );
  expect(confirmation).toHaveFocus();
  expect(screen.getByText("Medical appointment and recovery")).toBeInTheDocument(); // appears in My requests
  expect(screen.getByLabelText("Start date")).toHaveValue(""); // form cleared
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
