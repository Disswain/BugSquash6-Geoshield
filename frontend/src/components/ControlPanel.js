// src/components/ControlPanel.js
import React from "react";
import { FaPlayCircle, FaRedo, FaGlobe, FaSatellite } from "react-icons/fa"; // icons
import "./ControlPanel.css";

function ControlPanel({
  startSimulation,
  restartSimulation,
  simulationStarted,
  viewMode,
  setViewMode,
  simulationModeEnabled,
  setSimulationModeEnabled,
}) {
  return (
    <div className="card controls-card">
      <h4>⚙ Control Options</h4>

      {/* Start + Restart buttons (compact at top) */}
      <div className="control-buttons">
        <button
          className="btn start-btn"
          onClick={startSimulation}
          disabled={simulationStarted}
        >
          <FaPlayCircle /> Start Simulation
        </button>
        <button className="btn restart-btn" onClick={restartSimulation}>
          <FaRedo /> Restart
        </button>
      </div>

      {/* Demo Mode Toggle */}
      <div className="control-toggle">
        <FaPlayCircle className="control-icon" />
        <span>Demo Mode</span>
        <label className="switch">
          <input
            type="checkbox"
            checked={simulationModeEnabled}
            onChange={() => {
              setSimulationModeEnabled(!simulationModeEnabled);
              if (!simulationStarted) startSimulation();
            }}
          />
          <span className="slider round"></span>
        </label>
      </div>

      {/* Globe Mode Toggle */}
      <div className="control-toggle">
        <FaGlobe className="control-icon" />
        <span>Globe Mode</span>
        <label className="switch">
          <input
            type="checkbox"
            checked={viewMode === "globe"}
            onChange={() =>
              setViewMode(viewMode === "globe" ? "map" : "globe")
            }
          />
          <span className="slider round"></span>
        </label>
      </div>

      {/* Space Mode Toggle */}
      <div className="control-toggle">
        <FaSatellite className="control-icon" />
        <span>Space Mode</span>
        <label className="switch">
          <input
            type="checkbox"
            checked={viewMode === "space"}
            onChange={() =>
              setViewMode(viewMode === "space" ? "map" : "space")
            }
          />
          <span className="slider round"></span>
        </label>
      </div>
    </div>
  );
}

export default ControlPanel;
