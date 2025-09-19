// src/components/Sidebar.js
import React, { useState, useEffect, useRef } from "react";
import ControlPanel from "./ControlPanel";
import "./Sidebar.css";

function Sidebar({
  planes,
  speedETA,
  selectedPlane,
  setSelectedPlane,
  checkDestination,
  startSimulation,
  restartSimulation,
  simulationStarted,
  viewMode,
  setViewMode,
  simulationModeEnabled,
  setSimulationModeEnabled,
  satellites = [],
}) {
  const [inputs, setInputs] = useState({});
  const [satMetrics, setSatMetrics] = useState({});
  const [satStatuses, setSatStatuses] = useState({});
  const [selectedSat, setSelectedSat] = useState(null);
  const intervalsRef = useRef({});

  const handleInputChange = (plane, field, value) => {
    setInputs((prev) => ({
      ...prev,
      [plane]: { ...prev[plane], [field]: value },
    }));
  };

  const handleCheck = (plane) => {
    if (inputs[plane]?.lat && inputs[plane]?.lon) {
      checkDestination(
        plane,
        parseFloat(inputs[plane].lat),
        parseFloat(inputs[plane].lon)
      );
    } else {
      alert("Enter both latitude & longitude");
    }
  };

  const clamp = (val, min = 0, max = 100) =>
    Math.max(min, Math.min(max, val));

  // Progress bar
  const ProgressBar = ({ value }) => {
    const safeVal = value != null ? clamp(Math.round(value)) : 0;
    let color = "gray";
    if (safeVal > 70) color = "limegreen";
    else if (safeVal > 30) color = "gold";
    else color = "red";

    return (
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{
            width: `${safeVal}%`,
            backgroundColor: color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "11px",
            color: "#04130a",
            fontWeight: 700,
          }}
        >
          {value != null ? `${safeVal}%` : "--"}
        </div>
      </div>
    );
  };

  const effectiveStatus = (sat, id) => {
    const override = satStatuses[id];
    if (override) return override;
    return (sat.status || "OK").toString().toUpperCase();
  };

  // --- Manual actions ---
  const spoofSatellite = (id, sat) => {
    const offsetLat = (Math.random() - 0.5) * 1.0; // ±0.5°
    const offsetLon = (Math.random() - 0.5) * 1.0;
    const timeOffset = Math.floor(5 + Math.random() * 15); // 5–20s

    setSatStatuses((s) => ({ ...s, [id]: "SPOOFED" }));
    setSatMetrics((prev) => {
      const cur = prev[id] || { health: 100, link: 100 };
      return {
        ...prev,
        [id]: {
          ...cur,
          health: clamp(cur.health - 10),
          link: clamp(cur.link - 15),
          falsified: {
            lat: (sat?.lastTelemetry?.position?.lat || 0) + offsetLat,
            lon: (sat?.lastTelemetry?.position?.lon || 0) + offsetLon,
            timeOffset,
          },
        },
      };
    });
  };

  const jamSatellite = (id) => {
    setSatStatuses((s) => ({ ...s, [id]: "JAMMED" }));
    setSatMetrics((prev) => {
      const cur = prev[id] || { health: 100, link: 100 };
      return {
        ...prev,
        [id]: { ...cur, health: clamp(cur.health - 5), link: clamp(cur.link - 25) },
      };
    });
  };

  const repairSatellite = (id) => {
    setSatStatuses((s) => {
      const { [id]: _, ...rest } = s;
      return rest;
    });
    setSatMetrics((prev) => {
      const cur = prev[id] || { health: 100, link: 100 };
      const { falsified, ...rest } = cur;
      return { ...prev, [id]: { ...rest, health: clamp(cur.health + 15), link: clamp(cur.link + 20) } };
    });
  };

  // Simulated metrics
  useEffect(() => {
    const presentIds = satellites.map((s, i) => s.id || s.name || `sat-${i}`);
    Object.keys(intervalsRef.current).forEach((id) => {
      if (!presentIds.includes(id)) {
        clearInterval(intervalsRef.current[id]);
        delete intervalsRef.current[id];
      }
    });

    satellites.forEach((sat, idx) => {
      const id = sat.id || sat.name || `sat-${idx}`;
      if (intervalsRef.current[id]) return;

      intervalsRef.current[id] = setInterval(() => {
        setSatMetrics((prev) => {
          const cur = prev[id] || { health: 100, link: 100 };
          const stat = effectiveStatus(sat, id).toString().toUpperCase();
          const next = { ...prev, [id]: { ...cur } };

          if (stat === "SPOOFED") {
            next[id].health = clamp(cur.health - 1.5);
            next[id].link = clamp(cur.link - 2.5);
          } else if (stat === "JAMMED") {
            next[id].health = clamp(cur.health - 0.5);
            next[id].link = clamp(cur.link - 4);
          } else {
            next[id].health = clamp(cur.health + (100 - cur.health > 5 ? 2 : 1));
            next[id].link = clamp(cur.link + (100 - cur.link > 5 ? 2 : 1));
          }

          return next;
        });
      }, 600);
    });

    return () => {
      Object.values(intervalsRef.current).forEach(clearInterval);
      intervalsRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [satellites, satStatuses]);

  const isSpaceMode = viewMode === "space";
  const headerIcon = isSpaceMode ? "🛰" : "✈";
  const headerTitle = isSpaceMode ? "Active Satellites" : "Active Planes";

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
        <h4>{headerIcon} {headerTitle}</h4>
        <div className="planes-list">
          {isSpaceMode ? (
            satellites.length === 0 ? (
              <div className="empty">No satellites active. Enable Space Mode.</div>
            ) : (
              satellites.map((sat, idx) => {
                if (!sat) return null;
                const id = sat.id || sat.name || `sat-${idx}`;
                const status = effectiveStatus(sat, id);
                const metrics = satMetrics[id] || { health: 100, link: 100 };

                return (
                  <div
                    key={id}
                    className="plane-item"
                    onClick={() => setSelectedSat((prev) => (prev === id ? null : id))}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="pi-top">
                      <div>
                        <strong>{sat.name || "Unknown Satellite"}</strong>
                        {sat.id && sat.id !== sat.name && <small> ({sat.id})</small>}
                      </div>
                      <div
                        className={`status ${
                          status === "OK"
                            ? "safe"
                            : status === "JAMMED"
                            ? "warning"
                            : status === "SPOOFED"
                            ? "spoofed"
                            : "critical"
                        }`}
                      >
                        {status}
                      </div>
                    </div>

                    <div className="pi-bottom">
                      <div style={{ flex: 1, marginRight: "6px" }}>
                        <span>Health:</span>
                        <ProgressBar value={metrics.health} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <span>Link:</span>
                        <ProgressBar value={metrics.link} />
                      </div>
                    </div>

                    {sat.lastTelemetry?.position && (
                      <div className="pi-bottom">
                        <div>Actual Lat: {sat.lastTelemetry.position.lat}</div>
                        <div>Actual Lon: {sat.lastTelemetry.position.lon}</div>
                      </div>
                    )}

                    {/* Show falsified info if spoofed */}
                    {status === "SPOOFED" && metrics.falsified && (
                      <div className="pi-bottom" style={{ color: "red" }}>
                        <div>Falsified Lat: {metrics.falsified.lat.toFixed(4)}</div>
                        <div>Falsified Lon: {metrics.falsified.lon.toFixed(4)}</div>
                        <div>Time Offset: {metrics.falsified.timeOffset}s</div>
                      </div>
                    )}

                    {selectedSat === id && (
                      <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                        <button
                          className="spoof-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            spoofSatellite(id, sat);
                          }}
                        >
                          Spoof
                        </button>
                        <button
                          className="spoof-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            jamSatellite(id);
                          }}
                        >
                          Jam
                        </button>
                        <button
                          className="spoof-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            repairSatellite(id);
                          }}
                        >
                          Repair
                        </button>
                        <button
                          style={{
                            padding: "6px 10px",
                            borderRadius: 6,
                            background: "#555",
                            color: "white",
                            border: "none",
                            cursor: "pointer",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSat(null);
                          }}
                        >
                          Close
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )
          ) : Object.keys(planes).length === 0 ? (
            <div className="empty">
              {simulationModeEnabled
                ? "No simulation planes yet. Start simulation."
                : "No real-time planes transferred from Globe yet."}
            </div>
          ) : (
            Object.keys(planes).map((plane) => {
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
                    <div><strong>{plane}</strong></div>
                    <div className={`status ${pos.status === "SAFE" ? "safe" : "spoofed"}`}>
                      {pos.status}
                    </div>
                  </div>

                  {pos.reason && <div className="spoof-reason">Reason: {pos.reason}</div>}

                  <div className="pi-bottom">
                    <div>Lat: {pos.lat?.toFixed(4) || "--"}</div>
                    <div>Lon: {pos.lon?.toFixed(4) || "--"}</div>
                    <div>Speed: {info.speed || "--"} km/h</div>
                    <div>ETA: {info.eta || "--"}</div>
                  </div>

                  <div className="dest-check">
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="Lat"
                      value={inputs[plane]?.lat || ""}
                      onChange={(e) => handleInputChange(plane, "lat", e.target.value)}
                    />
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="Lon"
                      value={inputs[plane]?.lon || ""}
                      onChange={(e) => handleInputChange(plane, "lon", e.target.value)}
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
            })
          )}
        </div>
      </div>

      <ControlPanel
        startSimulation={startSimulation}
        restartSimulation={restartSimulation}
        simulationStarted={simulationStarted}
        viewMode={viewMode}
        setViewMode={setViewMode}
        simulationModeEnabled={simulationModeEnabled}
        setSimulationModeEnabled={setSimulationModeEnabled}
      />
    </div>
  );
}

export default Sidebar;
