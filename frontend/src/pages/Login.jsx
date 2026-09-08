import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login, registrationEnabled } = useAuth();
  const [email, setEmail] = useState("demo@calabasas.com");
  const [password, setPassword] = useState("Demo1234!");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      if (err.message === "Please verify your email before logging in.") {
        return navigate(`/verify?email=${encodeURIComponent(email)}`);
      }
      setError(err.message);
    }
  }

  return (
    <main className="container auth-page">
      <h1>Log in</h1>
      {error && <p className="form-error">{error}</p>}
      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit">Log in</button>
      </form>
      {!registrationEnabled && (
        <p className="auth-hint">
          Demo account is prefilled below — just press Log in.
        </p>
      )}
      <p className="auth-switch">
        {registrationEnabled ? (
          <Link to="/forgot-password">Forgot your password?</Link>
        ) : (
          <span className="disabled-link">Forgot your password?</span>
        )}
      </p>
      <p className="auth-switch">
        {registrationEnabled ? (
          <>
            No account? <Link to="/register">Register</Link>
          </>
        ) : (
          <span className="disabled-link">No account? Register</span>
        )}
      </p>
    </main>
  );
}

export default Login;