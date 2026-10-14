import { useState } from "react";
import { evaluatePassword, MAX_LEN } from "./passwordStrength";

export default function PasswordStrengthMeter() {
  const [value, setValue] = useState("");
  const result = evaluatePassword(value);

  return (
    <div>
      <label htmlFor="pw">Password</label>
      <input
        id="pw"
        type="password"
        autoComplete="new-password"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={MAX_LEN}
      />
      <div
        role="meter"
        aria-label="Password strength"
        aria-valuemin={0}
        aria-valuemax={4}
        aria-valuenow={result.score}
        aria-valuetext={result.label}
        data-score={result.score}
      />
      <p aria-live="polite">{result.label}</p>
      <ul>
        {result.feedback.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
    </div>
  );
}
