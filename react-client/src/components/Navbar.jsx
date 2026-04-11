import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const linkClass = (path) =>
    `navLink ${location.pathname === path ? "navLinkActive" : ""}`;

  return (
    <nav className="navbar">
      <div className="navInner">
        <Link to="/" className="navBrand">HousePredict</Link>
        <div className="navLinks">
          <Link to="/" className={linkClass("/")}>Predict</Link>
          {user && <Link to="/dashboard" className={linkClass("/dashboard")}>Dashboard</Link>}
          {user && <Link to="/reports" className={linkClass("/reports")}>Reports</Link>}
        </div>
        <div className="navRight">
          {user ? (
            <>
              <span className="navUser">{user.username}</span>
              <button className="navButton" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="navButton">Login</Link>
              <Link to="/register" className="navButtonPrimary">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
