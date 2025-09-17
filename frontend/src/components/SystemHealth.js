import React from "react";

function SystemHealth({ health }) {
  return (
    <div className="card health-card">
      <h4>System Health Status</h4>
      <div className="health-list">
        {health.map((h, i) => (
          <div key={i} className="health-item">
            <div className={`dot ${h.ok ? "ok" : "bad"}`}></div>
            <div className="health-title">{h.title}</div>
            <div className={`health-state ${h.ok ? "ok" : "bad"}`}>
              {h.ok ? "OK" : "Fail"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SystemHealth;
