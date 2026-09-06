import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

function Verify() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    const res = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    const data = await res.json();
    if (!res.ok) {
      return setError(data.error || "Verification failed");
    }
    setMessage(data.message);
    setTimeout(() => navigate("/login"), 1500);
  }

  async function handleResend() {
    setError("");
    setMessage("Sending...");
    const res = await fetch("/api/auth/resend-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setMessage(res.ok ? data.message : data.error || "Could not resend code");
  }

  return (
    <main className="container auth-page">
      <h1>Verify your email</h1>
      <p className="auth-hint">
        Enter the 6-digit code sent to <strong>{email}</strong>
      </p>
      {error && <p className="form-error">{error}</p>}
      {message && <p className="form-success">{message}</p>}
      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          Verification code
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            maxLength={6}
            placeholder="123456"
          />
        </label>
        <button type="submit">Verify</button>
      </form>
      <button className="link-button" onClick={handleResend}>
        Resend code
      </button>
      <p className="auth-switch">
        <Link to="/login">Back to login</Link>
      </p>
    </main>
  );
}

export default Verify;