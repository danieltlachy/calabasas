import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      <p className="auth-switch">
        <Link to="/forgot-password">Forgot your password?</Link>
      </p>
      <p className="auth-switch">
        No account? <Link to="/register">Register</Link>
      </p>
    </main>
  );
}

export default Login;