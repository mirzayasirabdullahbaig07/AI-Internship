import { fireEvent, render, screen } from "@testing-library/react";
import PasswordStrengthMeter from "./PasswordStrengthMeter";
import { evaluatePassword, MAX_LEN } from "./passwordStrength";

describe("evaluatePassword", () => {
  test("empty string", () => expect(evaluatePassword("").label).toBe("Empty"));
  test("short passwords are 'Too short'", () =>
    expect(evaluatePassword("aB3$").label).toBe("Too short"));
  test("common password is capped at Weak", () => {
    const r = evaluatePassword("Password123");
    expect(r.score).toBe(1);
    expect(r.feedback.join(" ")).toMatch(/common/i);
  });
  test("single repeated character is Weak", () =>
    expect(evaluatePassword("aaaaaaaaaaaaaaaa").score).toBe(1));
  test("long mixed password is Strong", () =>
    expect(evaluatePassword("Tr0ub4dor&3-Horse-Battery").score).toBe(4));
  test("longer is not worse: passphrase beats short complex", () => {
    expect(evaluatePassword("correct horse battery staple").score).toBeGreaterThanOrEqual(
      evaluatePassword("aB3$eF6&").score,
    );
  });
  test("10,000-char paste is truncated, flagged, and fast", () => {
    const start = performance.now();
    const r = evaluatePassword("aB3$".repeat(2500));
    expect(performance.now() - start).toBeLessThan(50);
    expect(r.truncated).toBe(true);
    expect(r.feedback[0]).toContain(String(MAX_LEN));
  });
  test("emoji / unicode do not throw", () => {
    expect(() => evaluatePassword("pässwörd-😀😀😀😀")).not.toThrow();
  });
  test("spaces count as symbols (passphrase friendly)", () => {
    expect(evaluatePassword("my dog likes long walks").score).toBeGreaterThanOrEqual(2);
  });
});

describe("<PasswordStrengthMeter />", () => {
  test("updates the meter and live text as the user types", () => {
    render(<PasswordStrengthMeter />);
    const input = screen.getByLabelText("Password");
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "0");
    fireEvent.change(input, { target: { value: "Tr0ub4dor&3-Horse-Battery" } });
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "4");
    expect(screen.getByText("Strong")).toBeInTheDocument();
  });
  test("pasting 10,000 chars does not crash the component", () => {
    render(<PasswordStrengthMeter />);
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "x9!".repeat(3334) },
    });
    expect(screen.getByText(/first 128 characters/i)).toBeInTheDocument();
  });
});
