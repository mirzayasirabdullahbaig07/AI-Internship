import { useState } from "react";

interface LoginFormProps {
  token?: string;
  apiBase?: string;
}

// Requires something before and after a single "@". Server-side validation is still required.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+$/;

export default function LoginForm({ token = "", apiBase = "" }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [signedInAs, setSignedInAs] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignedInAs(null);
    if (!EMAIL_PATTERN.test(email)) {
      setError("Please enter a valid email address.");
      return; // blocks submission
    }
    setError("");
    try {
      // The server decides who "me" is from the token; the client never sends a user id.
      const res = await fetch(`${apiBase}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const profile: { name?: string } = await res.json();
      setSignedInAs(profile.name ?? null);
    } catch {
      setError("Could not load your profile. Please try again.");
    }
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
      {signedInAs && <p>Signed in as {signedInAs}</p>}
      <button type="submit">Log in</button>
    </form>
  );
}
