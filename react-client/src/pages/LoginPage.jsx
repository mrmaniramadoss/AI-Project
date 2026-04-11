import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authPage">
      <div className="authCard">
        <h1 className="authTitle">Welcome Back</h1>
        <p className="authSubtitle">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="authForm">
          <label className="fieldGroup">
            <span className="fieldLabel">Username</span>
            <input
              className="fieldInput"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </label>

          <label className="fieldGroup">
            <span className="fieldLabel">Password</span>
            <input
              className="fieldInput"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && <p className="errorText">{error}</p>}

          <button className="predictButton" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="authFooter">
          Don't have an account? <Link to="/register" className="authLink">Register</Link>
        </p>
      </div>
    </div>
  );
}
