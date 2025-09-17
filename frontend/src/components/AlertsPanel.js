import React from "react";
import { FaExclamationTriangle, FaShieldAlt } from "react-icons/fa"; // alert icons
import "./AlertsPanel.css";

function AlertsPanel({ alerts }) {
  return (
    <div className="card alerts-card">
      <h4>⚠ Alerts</h4>
      <div className="alerts-list">
        {alerts.length === 0 && (
          <div className="empty">No active alerts</div>
        )}

        {alerts.map((a, idx) => (
          <div
            className={`alert-item ${
              a.severity === "High" ? "high" : "medium"
            }`}
            key={idx}
          >
            <div className="alert-icon">
              {a.severity === "High" ? (
                <FaExclamationTriangle />
              ) : (
                <FaShieldAlt />
              )}
            </div>

            <div className="alert-mid">
              <div className="alert-title">{a.flight}</div>
              <div className="alert-desc">{a.desc}</div>
            </div>

            <div className="alert-right">
              <div className="alert-time">{a.time}</div>
              <div
                className={`alert-sev ${
                  a.severity === "High" ? "high" : "medium"
                }`}
              >
                {a.severity}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AlertsPanel;
