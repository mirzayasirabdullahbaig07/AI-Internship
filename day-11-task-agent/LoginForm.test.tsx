import { render, screen, fireEvent } from "@testing-library/react";
import LoginForm from "./LoginForm";

test("shows red inline error when email lacks '@'", () => {
  render(<LoginForm />);
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: "bademail" },
  });
  fireEvent.click(screen.getByRole("button", { name: /log in/i }));

  const error = screen.getByRole("alert");
  expect(error).toBeInTheDocument();
  expect(error).toHaveStyle("color: rgb(255, 0, 0)");
});
