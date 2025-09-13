import React, { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  Polyline,
  LayersControl,
  useMap
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";
import Globe from "react-globe.gl";

const { BaseLayer } = LayersControl;
const indiaCenter = [22.0, 79.0];

const planeIcon = new L.Icon({
  iconUrl: process.env.PUBLIC_URL + "/plane.png",
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

const alertIcon = new L.Icon({
  iconUrl: process.env.PUBLIC_URL + "/alert.png",
  iconSize: [26, 26],
  iconAnchor: [13, 13]
});

// Zoom controls
function ZoomControls() {
  const map = useMap();
  return (
    <div className="zoom-controls">
      <button onClick={() => map.zoomIn()}>＋</button>
      <button onClick={() => map.zoomOut()}>－</button>
    </div>
  );
}

// Alerts panel
function AlertsPanel({ alerts }) {
  return (
    <div className="card alerts-card">
      <h4>Alerts</h4>
      <div className="alerts-list">
        {alerts.length === 0 && <div className="empty">No active alerts</div>}
        {alerts.map((a, idx) => (
          <div className="alert-item" key={idx}>
            <div
              className={`alert-badge ${
                a.severity === "High" ? "high" : "medium"
              }`}
            ></div>
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

// System health
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

// Event logs
function EventLogs({ logs }) {
  return (
    <div className="card logs-card">
      <h4>Event Logs</h4>
      <div className="logs-scroll">
        {logs.length === 0 && <div className="empty">No events yet</div>}
        {logs.map((l, i) => (
          <div key={i} className="log-item">
            <div className="log-time">{l.time}</div>
            <div className="log-text">{l.msg}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Sidebar
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
        <img src={process.env.PUBLIC_URL + "/logo.png"} alt="logo" />
        <h2>GeoShield</h2>
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

      <div className="card controls-card">
        <h4>Control Options</h4>
        <div className="controls-row">
          <button
            onClick={() => alert("Manual Spoofing Test (use drag or input)")}
            className="control-btn"
          >
            Manual Spoofing Test
          </button>
          <button
            onClick={() => {
              if (!simulationStarted) startSimulation();
            }}
            className="control-btn"
          >
            Simulation Mode
          </button>
          <button
            onClick={() =>
              setViewMode(viewMode === "map" ? "globe" : "map")
            }
            className="control-btn"
          >
            {viewMode === "map" ? "Switch to Globe Mode" : "Switch to Map Mode"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Globe component
function GlobeView({ planes, trajectories, spoofedPaths }) {
  const globeRef = useRef();

  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: 22, lng: 79, altitude: 2 });
    }
  }, []);

  return (
    <Globe
      ref={globeRef}
    globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
  backgroundColor="#0b1216" 
      pointsData={Object.keys(planes).map((p) => ({
        lat: planes[p].lat,
        lng: planes[p].lon,
        size: 1.5,
        color: planes[p].status === "SAFE" ? "lime" : "red",
        label: `${p} - ${planes[p].status}${
          planes[p].reason ? " (" + planes[p].reason + ")" : ""
        }`
      }))}
      arcsData={[
        ...Object.keys(trajectories).map((p) => ({
          startLat: trajectories[p][0]?.lat,
          startLng: trajectories[p][0]?.lon,
          endLat: trajectories[p][trajectories[p].length - 1]?.lat,
          endLng: trajectories[p][trajectories[p].length - 1]?.lon,
          color: ["lime", "green"],
          dashLength: 0.3,
          dashGap: 0.05,
          dashAnimateTime: 2000
        })),
        ...Object.keys(spoofedPaths).map((p) => ({
          startLat: spoofedPaths[p][0][0],
          startLng: spoofedPaths[p][0][1],
          endLat: spoofedPaths[p][1][0],
          endLng: spoofedPaths[p][1][1],
          color: ["red", "red"],
          dashLength: 0.3,
          dashGap: 0.05,
          dashAnimateTime: 2000
        }))
      ]}
    />
  );
}

function App() {
  const [planes, setPlanes] = useState({});
  const [trajectories, setTrajectories] = useState({});
  const [simulationStarted, setSimulationStarted] = useState(false);
  const [speedETA, setSpeedETA] = useState({});
  const [selectedPlane, setSelectedPlane] = useState(null);
  const [spoofedPaths, setSpoofedPaths] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [eventLogs, setEventLogs] = useState([]);
  const [viewMode, setViewMode] = useState("map"); // "map" | "globe"
  const audioRef = useRef(
    new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg")
  );
  const mapRef = useRef(null);

  const [health, setHealth] = useState([
    { title: "Backend/server uptime", ok: true },
    { title: "AI detection status", ok: true },
    { title: "Data source availability", ok: true }
  ]);

  // Start simulation
  const startSimulation = async () => {
    try {
      const csvFiles = ["plane1.csv", "plane2.csv", "plane3.csv"];
      const signature = await hashHMAC(csvFiles.join(","), "supersecretkey");

      const res = await fetch("http://localhost:5000/live_planes_multi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv_files: csvFiles, signature })
      });

      const data = await res.json();
      const trajs = {};
      const startPositions = {};
      Object.keys(data).forEach((plane) => {
        const allPoints = data[plane].trajectory;
        const interpolated = interpolatePath(allPoints, 60);
        trajs[plane] = interpolated;
        startPositions[plane] = {
          lat: interpolated[0].lat,
          lon: interpolated[0].lon,
          status: "SAFE"
        };
      });

      setPlanes(startPositions);
      setTrajectories(trajs);
      setSimulationStarted(true);
      addEventLog("Simulation started and trajectories loaded.");
    } catch (err) {
      console.error("Simulation error:", err);
      setHealth((prev) =>
        prev.map((h) =>
          h.title === "Backend/server uptime" ? { ...h, ok: false } : h
        )
      );
    }
  };

  // Step simulation
  useEffect(() => {
    if (!simulationStarted) return;
    const intervals = {};

    Object.keys(trajectories).forEach((plane) => {
      if (spoofedPaths[plane]) return;

      let index = 0;
      intervals[plane] = setInterval(() => {
        setPlanes((prev) => {
          if (index < trajectories[plane].length) {
            const prevPos =
              index > 0 ? trajectories[plane][index - 1] : trajectories[plane][0];
            const currPos = trajectories[plane][index];

            const dist = L.latLng(prevPos.lat, prevPos.lon).distanceTo(
              L.latLng(currPos.lat, currPos.lon)
            );
            const speed = (dist * 3.6).toFixed(1);
            const eta = Math.max(0, trajectories[plane].length - index) + "s";

            setSpeedETA((old) => ({ ...old, [plane]: { speed, eta } }));

            // Speed spoof detection
            const speedLimit = 450000; // 450 km/s
            if (parseFloat(speed) > speedLimit) {
              setPlanes((prev) => ({
                ...prev,
                [plane]: {
                  ...prev[plane],
                  status: "SPOOFED",
                  reason: "Impossible speed"
                }
              }));
              pushAlert({
                flight: plane,
                desc: "Impossible speed detected",
                severity: "High"
              });
              addEventLog(
                `${plane} flagged for impossible speed: ${speed} km/h`
              );
            }

            return {
              ...prev,
              [plane]: {
                ...prev[plane],
                lat: currPos.lat,
                lon: currPos.lon,
                status: prev[plane].status || "SAFE"
              }
            };
          }
          return prev;
        });
        index++;
      }, 1000);
    });

    return () => Object.values(intervals).forEach(clearInterval);
  }, [simulationStarted, trajectories, spoofedPaths]);

  // Drag spoof detection
  const handleDragEnd = (plane, e) => {
    const pos = e.target.getLatLng();
    const originalPos = planes[plane];

    setSpoofedPaths((prev) => ({
      ...prev,
      [plane]: [[originalPos.lat, originalPos.lon], [pos.lat, pos.lng]]
    }));

    setPlanes((prev) => ({
      ...prev,
      [plane]: {
        ...prev[plane],
        lat: pos.lat,
        lon: pos.lng,
        status: "SPOOFED",
        reason: "Unrealistic jump"
      }
    }));

    pushAlert({
      flight: plane,
      desc: "Manual Drag Spoof → Unrealistic jump",
      severity: "Medium"
    });
    addEventLog(`${plane} spoofed: Unrealistic jump after drag.`);
    audioRef.current.play();
  };

  // Destination spoof detection
  const checkDestination = (plane, lat, lon) => {
    if (!trajectories[plane]) return;
    const originalDest = trajectories[plane][trajectories[plane].length - 1];
    const d = L.latLng(lat, lon).distanceTo(
      L.latLng(originalDest.lat, originalDest.lon)
    );

    const zoom = mapRef.current ? mapRef.current.getZoom() : 5;
    const threshold = 200000 / zoom;

    if (d > threshold) {
      setPlanes((prev) => ({
        ...prev,
        [plane]: {
          ...prev[plane],
          lat,
          lon,
          status: "SPOOFED",
          reason: "GPS mismatch"
        }
      }));
      setSpoofedPaths((prev) => ({
        ...prev,
        [plane]: [
          [originalDest.lat, originalDest.lon],
          [lat, lon]
        ]
      }));
      pushAlert({ flight: plane, desc: "GPS mismatch", severity: "Medium" });
      addEventLog(`${plane} wrong destination → SPOOFED.`);
      audioRef.current.play();
    } else {
      addEventLog(`${plane} destination OK.`);
    }
  };

  const pushAlert = (a) => {
    const t = new Date();
    const time = t.toLocaleTimeString();
    setAlerts((prev) => [{ ...a, time }, ...prev].slice(0, 10));
  };

  const addEventLog = (msg) => {
    const t = new Date();
    const time = t.toLocaleTimeString();
    setEventLogs((prev) => [{ time, msg }, ...prev].slice(0, 30));
  };

  useEffect(() => {
    Object.keys(planes).forEach((p) => {
      if (planes[p].status === "SPOOFED") {
        if (!alerts.some((a) => a.flight === p && a.desc.includes("Spoof"))) {
          pushAlert({ flight: p, desc: "Spoof detected", severity: "High" });
        }
      }
    });
  }, [planes, alerts]);

  return (
    <div className="app-grid">
      <Sidebar
        planes={planes}
        speedETA={speedETA}
        selectedPlane={selectedPlane}
        setSelectedPlane={setSelectedPlane}
        checkDestination={checkDestination}
        startSimulation={startSimulation}
        simulationStarted={simulationStarted}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      <main className="main-area">
        <div className="map-card card">
          {!simulationStarted && (
            <div className="start-overlay">
              <button className="start-button" onClick={startSimulation}>
                Start Simulation
              </button>
            </div>
          )}

          {viewMode === "map" ? (
            <MapContainer
              center={indiaCenter}
              zoom={5}
              style={{ height: "100%", width: "100%" }}
              whenCreated={(map) => (mapRef.current = map)}
            >
              <ZoomControls />
              <LayersControl position="topright">
                <BaseLayer checked name="OpenStreetMap">
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                </BaseLayer>
                <BaseLayer name="ESRI Satellite">
                  <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                </BaseLayer>
              </LayersControl>

              {Object.keys(planes).map((plane) => {
                const pos = planes[plane];
                return (
                  <React.Fragment key={plane}>
                    <Polyline
                      positions={(trajectories[plane] || []).map((p) => [
                        p.lat,
                        p.lon
                      ])}
                      pathOptions={{ color: "green", dashArray: "6,8", weight: 3 }}
                    />
                    {spoofedPaths[plane] && (
                      <Polyline
                        positions={spoofedPaths[plane]}
                        pathOptions={{
                          color: "red",
                          dashArray: "6,8",
                          weight: 3
                        }}
                      />
                    )}
                    <Marker
                      position={[pos.lat, pos.lon]}
                      icon={planeIcon}
                      draggable={true}
                      eventHandlers={{ dragend: (e) => handleDragEnd(plane, e) }}
                    >
                      <Tooltip direction="top" offset={[0, -20]} permanent>
                        <div
                          className={`tooltip-text ${
                            pos.status === "SAFE" ? "safe" : "spoofed"
                          }`}
                        >
                          {plane}: {pos.status}
                          {pos.reason && (
                            <span className="spoof-reason">({pos.reason})</span>
                          )}
                        </div>
                      </Tooltip>
                    </Marker>
                    {pos.status === "SPOOFED" && (
                      <Marker
                        position={[pos.lat + 0.05, pos.lon]}
                        icon={alertIcon}
                        interactive={false}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </MapContainer>
          ) : (
            <GlobeView
              planes={planes}
              trajectories={trajectories}
              spoofedPaths={spoofedPaths}
            />
          )}
        </div>
        <div className="bottom-row">
          <EventLogs logs={eventLogs} />
        </div>
      </main>

      <aside className="right-col">
        <AlertsPanel alerts={alerts} />
        <SystemHealth health={health} />
      </aside>
    </div>
  );
}

// --- Helpers ---
function interpolatePath(points, steps) {
  if (!points || points.length < 2) return points || [];
  const interpolated = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const seg = t * (points.length - 1);
    const idx = Math.floor(seg);
    const frac = seg - idx;
    if (idx >= points.length - 1)
      interpolated.push(points[points.length - 1]);
    else {
      const p1 = points[idx],
        p2 = points[idx + 1];
      interpolated.push({
        lat: p1.lat + (p2.lat - p1.lat) * frac,
        lon: p1.lon + (p2.lon - p1.lon) * frac,
        status: "SAFE"
      });
    }
  }
  return interpolated;
}

async function hashHMAC(message, key) {
  const enc = new TextEncoder();
  const keyData = enc.encode(key);
  const msgData = enc.encode(message);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default App;
