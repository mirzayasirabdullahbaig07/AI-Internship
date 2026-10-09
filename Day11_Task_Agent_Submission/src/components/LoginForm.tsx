import { useState } from "react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return; // blocks submission
    }
    setError("");
    // ...existing submit logic stays untouched
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-label="Email"
      />
      {error && (
        <p role="alert" style={{ color: "red" }}>
          {error}
        </p>
      )}
      <button type="submit">Log in</button>
    </form>
  );
}
