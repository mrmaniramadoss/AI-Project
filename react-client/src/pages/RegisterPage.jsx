import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(username, email, password);
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
        <h1 className="authTitle">Create Account</h1>
        <p className="authSubtitle">Start predicting house prices</p>

        <form onSubmit={handleSubmit} className="authForm">
          <label className="fieldGroup">
            <span className="fieldLabel">Username</span>
            <input
              className="fieldInput"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={30}
              autoFocus
            />
          </label>

          <label className="fieldGroup">
            <span className="fieldLabel">Email</span>
            <input
              className="fieldInput"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
              minLength={6}
            />
          </label>

          {error && <p className="errorText">{error}</p>}

          <button className="predictButton" type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="authFooter">
          Already have an account? <Link to="/login" className="authLink">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
