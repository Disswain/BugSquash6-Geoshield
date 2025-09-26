import React, { useState } from "react";
import "./LoginPage.css";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="login-container">
      {/* Left side - Logo */}
      <div className="logo-container">
        <img
          src={process.env.PUBLIC_URL + "/logo-glow.png"}
          alt="GeoShield Logo"
        />
      </div>

      {/* Middle - Glow divider bar */}
      <div className="bar-container">
        <div className="glow-bar"></div>
      </div>

      {/* Right side - Form */}
      <div className="form-container">
        <form className="login-form" onSubmit={handleSubmit}>
          <h2 className="login-title"></h2>
          <input
            type="email"
            placeholder="✉ Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="🔑 Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="neon-button">
            Login
          </button>
          <div className="forgot-password">Forgot password?</div>
        </form>
      </div>
    </div>
  );
}
