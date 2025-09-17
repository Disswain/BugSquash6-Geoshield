import React, { useState } from "react";
import ControlPanel from "./ControlPanel";
import "./Sidebar.css";

function Sidebar({
  planes,
  speedETA,
  selectedPlane,
  setSelectedPlane,
  checkDestination,
  startSimulation,
  simulationStarted,
  viewMode,
  setViewMode
}) {
  const [inputs, setInputs] = useState({});
   const [manualSpoofEnabled, setManualSpoofEnabled] = useState(false);
  const [liveModeEnabled, setLiveModeEnabled] = useState(false);

  const handleInputChange = (plane, field, value) => {
    setInputs((prev) => ({
      ...prev,
      [plane]: { ...prev[plane], [field]: value }
    }));
  };

  const handleCheck = (plane) => {
    if (inputs[plane] && inputs[plane].lat && inputs[plane].lon) {
      checkDestination(
        plane,
        parseFloat(inputs[plane].lat),
        parseFloat(inputs[plane].lon)
      );
    } else alert("Enter lat & lon");
  };

  return (
    <div className="sidebar-left">
<div className="brand">
  <img
    src={process.env.PUBLIC_URL + "/logo-glow.png"}
    alt="GeoShield Logo"
    className="logo-background"
  />
</div>




      <div className="card planes-card">
        <h4>✈ Active Planes</h4>
        <div className="planes-list">
          {Object.keys(planes).length === 0 && (
            <div className="empty">No planes. Start simulation.</div>
          )}
          {Object.keys(planes).map((plane) => {
            const pos = planes[plane];
            const info = speedETA[plane] || {};
            const isSelected = plane === selectedPlane;
            return (
              <div
                key={plane}
                className={`plane-item ${isSelected ? "selected" : ""}`}
                onClick={() => setSelectedPlane(plane)}
              >
                <div className="pi-top">
                  <div>
                    <strong>{plane}</strong>
                  </div>
                  <div
                    className={`status ${
                      pos.status === "SAFE" ? "safe" : "spoofed"
                    }`}
                  >
                    {pos.status}
                    {pos.reason && (
                      <span className="spoof-reason">({pos.reason})</span>
                    )}
                  </div>
                </div>
                <div className="pi-bottom">
                  <div>Speed: {info.speed || "--"} km/h</div>
                  <div>ETA: {info.eta || "--"}</div>
                </div>

                <div className="dest-check">
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Lat"
                    value={inputs[plane]?.lat || ""}
                    onChange={(e) =>
                      handleInputChange(plane, "lat", e.target.value)
                    }
                  />
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Lon"
                    value={inputs[plane]?.lon || ""}
                    onChange={(e) =>
                      handleInputChange(plane, "lon", e.target.value)
                    }
                  />
                  <button
                    className="spoof-button"
                    onClick={() => handleCheck(plane)}
                  >
                    Spoof
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Control Panel */}
      <ControlPanel
        startSimulation={startSimulation}
        simulationStarted={simulationStarted}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />
    </div>
  );
}

export default Sidebar;
