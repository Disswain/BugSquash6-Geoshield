// src/App.js
import React, { useState, useEffect } from "react";
import LoginPage from "./components/LoginPage";
import MainDashboard from "./components/MainDashboard";
import "./App.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 🔹 Load login state from localStorage
  useEffect(() => {
    const storedLogin = localStorage.getItem("isLoggedIn");
    if (storedLogin === "true") {
      setIsLoggedIn(true);
    }
  }, []);

  // 🔹 Handle login
  const handleLogin = (email, password) => {
    // TODO: Replace with backend API check
    if (email && password) {
      setIsLoggedIn(true);
      localStorage.setItem("isLoggedIn", "true"); // save login state
    } else {
      alert("Please enter email and password");
    }
  };

  // 🔹 Handle logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("isLoggedIn"); // clear login state
  };

  return (
    <div className="App">
      {!isLoggedIn ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <MainDashboard onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
