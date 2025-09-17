import React from "react";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaInfoCircle,
  FaDownload,
} from "react-icons/fa";
import "./EventLogs.css";

function EventLogs({ logs }) {
  const getSeverity = (msg) => {
    if (msg.toLowerCase().includes("spoof")) return "error";
    if (msg.toLowerCase().includes("anomaly")) return "warning";
    if (msg.toLowerCase().includes("completed") || msg.toLowerCase().includes("updated"))
      return "success";
    return "info";
  };

  const getIcon = (severity) => {
    switch (severity) {
      case "success":
        return "✓";
      case "warning":
        return "▲";
      case "error":
        return "●";
      default:
        return "•";
    }
  };

  const downloadLogs = () => {
    const logText = logs
      .map((l) => `${l.msg}\n${l.time}   ${getIcon(getSeverity(l.msg))}`)
      .join("\n\n");

    const blob = new Blob([logText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "event-logs.txt";
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="card logs-card">
      <div className="logs-header">
        <h4>Event Logs</h4>
        <button className="download-btn" onClick={downloadLogs}>
          <FaDownload /> Download
        </button>
      </div>
      <div className="logs-scroll">
        {logs.length === 0 && <div className="empty">No events yet</div>}
        {logs.map((l, i) => {
          const severity = getSeverity(l.msg);
          return (
            <div key={i} className={`log-item ${severity}`}>
              <div className="log-text">{l.msg}</div>
              <div className="log-time">{l.time}</div>
              <div className="log-icon">{getIcon(severity)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default EventLogs;
