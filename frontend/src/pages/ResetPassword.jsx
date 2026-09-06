import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (password !== confirm) {
      return setError("Passwords do not match");
    }
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      return setError(data.error || "Could not reset password");
    }
    setMessage(data.message);
    setTimeout(() => navigate("/login"), 1500);
  }

  if (!token) {
    return (
      <main className="container auth-page">
        <h1>Reset password</h1>
        <p className="form-error">This reset link is missing its token.</p>
        <p className="auth-switch">
          <Link to="/forgot-password">Request a new link</Link>
        </p>
      </main>
    );
  }

  return (
    <main className="container auth-page">
      <h1>Choose a new password</h1>
      {error && <p className="form-error">{error}</p>}
      {message && <p className="form-success">{message}</p>}
      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          New password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </label>
        <label>
          Confirm password
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </label>
        <button type="submit">Save new password</button>
      </form>
      <p className="auth-switch">
        <Link to="/login">Back to login</Link>
      </p>
    </main>
  );
}

export default ResetPassword;