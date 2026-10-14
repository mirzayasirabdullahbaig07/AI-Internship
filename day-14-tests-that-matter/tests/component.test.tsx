import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentType } from "react";

// LOGINFORM_PATH lets tools/mutation_check.js point this same test at a deliberately broken copy.
const LoginForm = require(
  process.env.LOGINFORM_PATH ?? "../../day-11-task-agent/LoginForm",
).default as ComponentType<{ token?: string; apiBase?: string }>;

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});

/**
 * ONE focused component test: the behaviour contract of the form, with the network mocked.
 * Proves: validation blocks bad input BEFORE any request, the error is red, and a good
 * submission calls the API exactly once with the bearer token and no client-chosen user id.
 */
test("blocks a bad email with a red inline error (no request), then loads the profile with the token only", async () => {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ id: 1, name: "Mirza Yasir Abdullah Baig" }),
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  render(<LoginForm token="token-yasir" />);
  const email = screen.getByLabelText(/email/i);
  const submit = screen.getByRole("button", { name: /log in/i });

  fireEvent.change(email, { target: { value: "bademail" } });
  fireEvent.click(submit);
  const alert = screen.getByRole("alert");
  expect(alert).toHaveTextContent("valid email");
  expect(alert).toHaveStyle("color: rgb(255, 0, 0)");
  expect(fetchMock).not.toHaveBeenCalled();

  fireEvent.change(email, { target: { value: "mirza@example.test" } });
  fireEvent.click(submit);
  expect(
    await screen.findByText("Signed in as Mirza Yasir Abdullah Baig"),
  ).toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock).toHaveBeenCalledWith("/api/profile", {
    headers: { Authorization: "Bearer token-yasir" },
  });
});
