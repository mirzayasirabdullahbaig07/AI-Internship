import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import LoginForm from "../../day-11-task-agent/LoginForm";

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});

const submit = (email: string) => {
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: email } });
  fireEvent.click(screen.getByRole("button", { name: /log in/i }));
};

test("valid email calls /api/profile with the bearer token and NO user id, then greets the user", async () => {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ id: 1, name: "Mirza Yasir Abdullah Baig" }),
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  render(<LoginForm token="token-yasir" />);
  submit("mirzayasirabdullahbaig07@users.noreply.github.com");
  expect(
    await screen.findByText("Signed in as Mirza Yasir Abdullah Baig"),
  ).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith("/api/profile", {
    headers: { Authorization: "Bearer token-yasir" },
  });
});

test("invalid email never reaches the network", () => {
  const fetchMock = jest.fn();
  global.fetch = fetchMock as unknown as typeof fetch;
  render(<LoginForm />);
  submit("bademail");
  expect(screen.getByRole("alert")).toHaveTextContent("valid email");
  expect(fetchMock).not.toHaveBeenCalled();
});

test('a lone "@" is rejected', () => {
  global.fetch = jest.fn() as unknown as typeof fetch;
  render(<LoginForm />);
  submit("@");
  expect(screen.getByRole("alert")).toBeInTheDocument();
});

test("a 401 from the API shows an error state instead of a broken greeting", async () => {
  global.fetch = jest
    .fn()
    .mockResolvedValue({ ok: false, status: 401 }) as unknown as typeof fetch;
  render(<LoginForm token="bad" />);
  submit("a@b.co");
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent("Could not load"),
  );
  expect(screen.queryByText(/Signed in as/)).not.toBeInTheDocument();
});

test("a network failure is handled (no unhandled rejection)", async () => {
  global.fetch = jest
    .fn()
    .mockRejectedValue(new TypeError("fetch failed")) as unknown as typeof fetch;
  render(<LoginForm token="t" />);
  submit("a@b.co");
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent("Could not load"),
  );
});
