import React, { useState, useEffect, useRef } from "react";
<<<<<<< HEAD
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  Polyline,
  LayersControl
} from "react-leaflet";
=======
import { MapContainer, TileLayer, Marker, Tooltip, Polyline, LayersControl, useMap } from "react-leaflet";
>>>>>>> 1acd6422434863ab27f208dc6f5fd59eb96ca5eb
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";

<<<<<<< HEAD
import GlobeView from "./components/GlobeView";
import SpaceView from "./components/SpaceView"; // ✅ NEW
import Sidebar from "./components/Sidebar";
import AlertsPanel from "./components/AlertsPanel";
import EventLogs from "./components/EventLogs";
import ZoomControls from "./components/ZoomControls";
import { interpolatePath, hashHMAC } from "./utils/helpers";

const { BaseLayer } = LayersControl;
const indiaCenter = [22.0, 79.0];

// Plane icon
const planeIcon = new L.Icon({
  iconUrl: process.env.PUBLIC_URL + "/plane.png",
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// Alert icon
const alertIcon = new L.Icon({
  iconUrl: process.env.PUBLIC_URL + "/alert.png",
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

=======
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
            <div className={`alert-badge ${a.severity === "High" ? "high" : "medium"}`}></div>
            <div className="alert-mid">
              <div className="alert-title">{a.flight}</div>
              <div className="alert-desc">{a.desc}</div>
            </div>
            <div className="alert-right">
              <div className="alert-time">{a.time}</div>
              <div className={`alert-sev ${a.severity === "High" ? "high" : "medium"}`}>{a.severity}</div>
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
            <div className={`health-state ${h.ok ? "ok" : "bad"}`}>{h.ok ? "OK" : "Fail"}</div>
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
function Sidebar({ planes, speedETA, selectedPlane, setSelectedPlane, checkDestination, startSimulation, simulationStarted }) {
  const [inputs, setInputs] = useState({});
  const handleInputChange = (plane, field, value) => {
    setInputs(prev => ({ ...prev, [plane]: { ...prev[plane], [field]: value } }));
  };
  const handleCheck = (plane) => {
    if (inputs[plane] && inputs[plane].lat && inputs[plane].lon) {
      checkDestination(plane, parseFloat(inputs[plane].lat), parseFloat(inputs[plane].lon));
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
          {Object.keys(planes).length === 0 && <div className="empty">No planes. Start simulation.</div>}
          {Object.keys(planes).map(plane => {
            const pos = planes[plane];
            const info = speedETA[plane] || {};
            const isSelected = plane === selectedPlane;
            return (
              <div key={plane} className={`plane-item ${isSelected ? "selected" : ""}`} onClick={() => setSelectedPlane(plane)}>
                <div className="pi-top">
                  <div><strong>{plane}</strong></div>
                  <div className={`status ${pos.status === "SAFE" ? "safe" : "spoofed"}`}>{pos.status}</div>
                </div>
                <div className="pi-bottom">
                  <div>Speed: {info.speed || "--"} km/h</div>
                  <div>ETA: {info.eta || "--"}</div>
                </div>

                <div className="dest-check">
                  <input type="number" step="0.0001" placeholder="Lat" value={inputs[plane]?.lat || ""} onChange={(e) => handleInputChange(plane, "lat", e.target.value)} />
                  <input type="number" step="0.0001" placeholder="Lon" value={inputs[plane]?.lon || ""} onChange={(e) => handleInputChange(plane, "lon", e.target.value)} />
                  <button className="spoof-button" onClick={() => handleCheck(plane)}>Spoof</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card controls-card">
        <h4>Control Options</h4>
        <div className="controls-row">
          <button onClick={() => { if(!simulationStarted) startSimulation(); }} className="control-btn">Manual Spoofing Test</button>
          <button onClick={() => { if(!simulationStarted) startSimulation(); }} className="control-btn">Simulation Mode</button>
          <button onClick={() => { alert("Live Mode toggled (demo)"); }} className="control-btn">Live Mode</button>
        </div>
      </div>
    </div>
  );
}

>>>>>>> 1acd6422434863ab27f208dc6f5fd59eb96ca5eb
function App() {
  const [planes, setPlanes] = useState({});
  const [trajectories, setTrajectories] = useState({});
  const [simulationStarted, setSimulationStarted] = useState(false);
  const [speedETA, setSpeedETA] = useState({});
  const [selectedPlane, setSelectedPlane] = useState(null);
  const [spoofedPaths, setSpoofedPaths] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [eventLogs, setEventLogs] = useState([]);
<<<<<<< HEAD

  // 🔑 Main mode state: "map" | "globe" | "space"
  const [viewMode, setViewMode] = useState("map");
  const [simulationModeEnabled, setSimulationModeEnabled] = useState(false);

  const audioRef = useRef(
    new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg")
  );
  const mapRef = useRef(null);
=======
  const audioRef = useRef(new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg"));
>>>>>>> 1acd6422434863ab27f208dc6f5fd59eb96ca5eb

  const [health, setHealth] = useState([
    { title: "Backend/server uptime", ok: true },
    { title: "AI detection status", ok: true },
    { title: "Data source availability", ok: true },
  ]);

<<<<<<< HEAD
  // --- Start simulation ---
=======
  // Start simulation
>>>>>>> 1acd6422434863ab27f208dc6f5fd59eb96ca5eb
  const startSimulation = async () => {
    try {
      const csvFiles = ["plane1.csv", "plane2.csv", "plane3.csv"];
      const signature = await hashHMAC(csvFiles.join(","), "supersecretkey");

      const res = await fetch("http://localhost:5000/live_planes_multi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
<<<<<<< HEAD
        body: JSON.stringify({ csv_files: csvFiles, signature }),
=======
        body: JSON.stringify({ csv_files: csvFiles, signature })
>>>>>>> 1acd6422434863ab27f208dc6f5fd59eb96ca5eb
      });

      const data = await res.json();
      const trajs = {};
      const startPositions = {};
<<<<<<< HEAD
      Object.keys(data).forEach((plane) => {
=======
      Object.keys(data).forEach(plane => {
>>>>>>> 1acd6422434863ab27f208dc6f5fd59eb96ca5eb
        const allPoints = data[plane].trajectory;
        const interpolated = interpolatePath(allPoints, 60);
        trajs[plane] = interpolated;
        startPositions[plane] = {
          lat: interpolated[0].lat,
          lon: interpolated[0].lon,
<<<<<<< HEAD
          status: "SAFE",
=======
          status: interpolated[0].status || "SAFE"
>>>>>>> 1acd6422434863ab27f208dc6f5fd59eb96ca5eb
        };
      });

      setPlanes(startPositions);
      setTrajectories(trajs);
      setSimulationStarted(true);
      addEventLog("Simulation started and trajectories loaded.");
    } catch (err) {
      console.error("Simulation error:", err);
<<<<<<< HEAD
      setHealth((prev) =>
        prev.map((h) =>
          h.title === "Backend/server uptime" ? { ...h, ok: false } : h
        )
      );
    }
  };

  // --- Step simulation ---
=======
      setHealth(prev => prev.map(h => h.title === "Backend/server uptime" ? { ...h, ok: false } : h));
    }
  };

  // Step simulation
>>>>>>> 1acd6422434863ab27f208dc6f5fd59eb96ca5eb
  useEffect(() => {
    if (!simulationStarted) return;
    const intervals = {};

<<<<<<< HEAD
    Object.keys(trajectories).forEach((plane) => {
=======
    Object.keys(trajectories).forEach(plane => {
>>>>>>> 1acd6422434863ab27f208dc6f5fd59eb96ca5eb
      if (spoofedPaths[plane]) return;

      let index = 0;
      intervals[plane] = setInterval(() => {
<<<<<<< HEAD
        setPlanes((prev) => {
          if (index < trajectories[plane].length) {
            const prevPos =
              index > 0
                ? trajectories[plane][index - 1]
                : trajectories[plane][0];
            const currPos = trajectories[plane][index];

            const dist = L.latLng(prevPos.lat, prevPos.lon).distanceTo(
              L.latLng(currPos.lat, currPos.lon)
            );
            const speed = (dist * 3.6).toFixed(1);
            const eta = Math.max(0, trajectories[plane].length - index) + "s";

            setSpeedETA((old) => ({ ...old, [plane]: { speed, eta } }));

            // Spoof detection: Impossible speed
            const speedLimit = 450000;
            if (parseFloat(speed) > speedLimit) {
              setPlanes((prev) => ({
                ...prev,
                [plane]: {
                  ...prev[plane],
                  status: "SPOOFED",
                  reason: "Impossible speed",
                },
              }));
              pushAlert({
                flight: plane,
                desc: "Impossible speed detected",
                severity: "High",
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
                status: prev[plane].status || "SAFE",
              },
            };
=======
        setPlanes(prev => {
          if (index < trajectories[plane].length) {
            const prevPos = index > 0 ? trajectories[plane][index - 1] : trajectories[plane][0];
            const currPos = trajectories[plane][index];

            const dist = L.latLng(prevPos.lat, prevPos.lon).distanceTo(L.latLng(currPos.lat, currPos.lon));
            const speed = (dist * 3.6).toFixed(1);
            const eta = Math.max(0, trajectories[plane].length - index) + "s";

            setSpeedETA(old => ({ ...old, [plane]: { speed, eta } }));

            if (parseFloat(speed) > 1200) {
              pushAlert({ flight: plane, desc: "Impossible speed", severity: "High" });
              addEventLog(`${plane} flagged for impossible speed: ${speed} km/h`);
            }

            return { ...prev, [plane]: { ...prev[plane], lat: currPos.lat, lon: currPos.lon, status: currPos.status || "SAFE" } };
>>>>>>> 1acd6422434863ab27f208dc6f5fd59eb96ca5eb
          }
          return prev;
        });
        index++;
      }, 1000);
    });

    return () => Object.values(intervals).forEach(clearInterval);
  }, [simulationStarted, trajectories, spoofedPaths]);

<<<<<<< HEAD
  // --- Drag spoof detection ---
  const handleDragEnd = (plane, e) => {
    const pos = e.target.getLatLng();
    const originalPos = planes[plane];

    setSpoofedPaths((prev) => ({
      ...prev,
      [plane]: [[originalPos.lat, originalPos.lon], [pos.lat, pos.lng]],
    }));

    setPlanes((prev) => ({
      ...prev,
      [plane]: {
        ...prev[plane],
        lat: pos.lat,
        lon: pos.lng,
        status: "SPOOFED",
        reason: "Unrealistic jump",
      },
    }));

    pushAlert({
      flight: plane,
      desc: "Manual Drag Spoof → Unrealistic jump",
      severity: "Medium",
    });
    addEventLog(`${plane} spoofed: Unrealistic jump after drag.`);
    audioRef.current.play();
  };

  // --- Destination spoof detection ---
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
          reason: "GPS mismatch",
        },
      }));
      setSpoofedPaths((prev) => ({
        ...prev,
        [plane]: [
          [originalDest.lat, originalDest.lon],
          [lat, lon],
        ],
      }));
      pushAlert({ flight: plane, desc: "GPS mismatch", severity: "Medium" });
      addEventLog(`${plane} wrong destination → SPOOFED.`);
=======
  
  // Drag spoof detection (supports multiple drags per plane)
const handleDragEnd = (plane, e) => {
  const pos = e.target.getLatLng();

  setSpoofedPaths(prev => {
    const existingPath = prev[plane] || [];
    const lastPoint = existingPath.length > 0 ? existingPath[existingPath.length - 1] : [planes[plane].lat, planes[plane].lon];
    return {
      ...prev,
      [plane]: [...existingPath, [pos.lat, pos.lng]]
    };
  });

  setPlanes(prev => ({
    ...prev,
    [plane]: { ...prev[plane], lat: pos.lat, lon: pos.lng, status: "SPOOFED" }
  }));

  pushAlert({ flight: plane, desc: "Manual Drag Spoof", severity: "Medium" });
  addEventLog(`${plane} dragged again -> spoofed location updated.`);
  audioRef.current.play();
};

  // Manual destination check
  const checkDestination = (plane, lat, lon) => {
    if (!trajectories[plane]) return;
    const originalDest = trajectories[plane][trajectories[plane].length - 1];
    const d = L.latLng(lat, lon).distanceTo(L.latLng(originalDest.lat, originalDest.lon));

    setPlanes(prev => ({ ...prev, [plane]: { ...prev[plane], lat, lon } }));

    if (d > 50000) {
      setPlanes(prev => ({ ...prev, [plane]: { ...prev[plane], status: "SPOOFED" } }));
      setSpoofedPaths(prev => ({ ...prev, [plane]: [[originalDest.lat, originalDest.lon], [lat, lon]] }));
      pushAlert({ flight: plane, desc: "GPS mismatch", severity: "Medium" });
      addEventLog(`${plane} wrong destination -> SPOOFED.`);
>>>>>>> 1acd6422434863ab27f208dc6f5fd59eb96ca5eb
      audioRef.current.play();
    } else {
      addEventLog(`${plane} destination OK.`);
    }
  };

<<<<<<< HEAD
  // --- Alerts ---
  const pushAlert = (a) => {
    const t = new Date();
    const time = t.toLocaleTimeString();
    setAlerts((prev) => [{ ...a, time }, ...prev].slice(0, 10));
  };

  // --- Logs ---
  const addEventLog = (msg) => {
    const t = new Date();
    const time = t.toLocaleTimeString();
    setEventLogs((prev) => [{ time, msg }, ...prev].slice(0, 30));
  };

  // --- Auto alert for spoofed planes ---
  useEffect(() => {
    Object.keys(planes).forEach((p) => {
      if (planes[p].status === "SPOOFED") {
        if (!alerts.some((a) => a.flight === p && a.desc.includes("Spoof"))) {
=======
  const pushAlert = (a) => {
    const t = new Date();
    const time = t.toLocaleTimeString();
    setAlerts(prev => [{ ...a, time }, ...prev].slice(0, 10));
  };

  const addEventLog = (msg) => {
    const t = new Date();
    const time = t.toLocaleTimeString();
    setEventLogs(prev => [{ time, msg }, ...prev].slice(0, 30));
  };

  useEffect(() => {
    Object.keys(planes).forEach(p => {
      if (planes[p].status === "SPOOFED") {
        if (!alerts.some(a => a.flight === p && a.desc.includes("SPOOF"))) {
>>>>>>> 1acd6422434863ab27f208dc6f5fd59eb96ca5eb
          pushAlert({ flight: p, desc: "Spoof detected", severity: "High" });
        }
      }
    });
  }, [planes, alerts]);

  return (
    <div className="app-grid">
<<<<<<< HEAD
      {/* Sidebar with controls + planes */}
=======
>>>>>>> 1acd6422434863ab27f208dc6f5fd59eb96ca5eb
      <Sidebar
        planes={planes}
        speedETA={speedETA}
        selectedPlane={selectedPlane}
        setSelectedPlane={setSelectedPlane}
        checkDestination={checkDestination}
        startSimulation={startSimulation}
        simulationStarted={simulationStarted}
<<<<<<< HEAD
        viewMode={viewMode}
        setViewMode={setViewMode}
        simulationModeEnabled={simulationModeEnabled}
        setSimulationModeEnabled={setSimulationModeEnabled}
      />

      {/* Map / Globe / Space */}
      <main className="main-area">
        <div className="map-card card">
          {viewMode === "map" && !simulationStarted && (
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
            positions={(trajectories[plane] || []).map((p) => [p.lat, p.lon])}
            pathOptions={{ color: "green", dashArray: "6,8", weight: 3 }}
          />
          {spoofedPaths[plane] && (
            <Polyline
              positions={spoofedPaths[plane]}
              pathOptions={{ color: "red", dashArray: "6,8", weight: 3 }}
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
) : viewMode === "globe" ? (
  <GlobeView
    planes={planes}
    trajectories={trajectories}
    spoofedPaths={spoofedPaths}
  />
) : (
  <SpaceView />   /* ✅ new space mode */
)}

=======
      />

      <main className="main-area">
        <div className="map-card card">
          {!simulationStarted && (
            <div className="start-overlay">
              <button className="start-button" onClick={startSimulation}>Start Simulation</button>
            </div>
          )}

          <MapContainer center={indiaCenter} zoom={5} style={{ height: "100%", width: "100%" }}>
            <ZoomControls />
            <LayersControl position="topright">
              <BaseLayer checked name="OpenStreetMap">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              </BaseLayer>
              <BaseLayer name="ESRI Satellite">
                <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
              </BaseLayer>
            </LayersControl>

            {Object.keys(planes).map(plane => {
              const pos = planes[plane];
              return (
                <React.Fragment key={plane}>
                  <Polyline positions={(trajectories[plane] || []).map(p => [p.lat, p.lon])} pathOptions={{ color: "green", dashArray: "6,8", weight: 3 }} />
                  {spoofedPaths[plane] && <Polyline positions={spoofedPaths[plane]} pathOptions={{ color: "red", dashArray: "6,8", weight: 3 }} />}
                  <Marker position={[pos.lat, pos.lon]} icon={planeIcon} draggable={true} eventHandlers={{ dragend: (e) => handleDragEnd(plane, e) }}>
                    <Tooltip direction="top" offset={[0, -20]} permanent>
                      <div className={`tooltip-text ${pos.status === "SAFE" ? "safe" : "spoofed"}`}>{plane}: {pos.status}</div>
                    </Tooltip>
                  </Marker>
                  {pos.status === "SPOOFED" && <Marker position={[pos.lat + 0.05, pos.lon]} icon={alertIcon} interactive={false} />}
                </React.Fragment>
              );
            })}
          </MapContainer>
        </div>
        <div className="bottom-row">
          <EventLogs logs={eventLogs} />
>>>>>>> 1acd6422434863ab27f208dc6f5fd59eb96ca5eb
        </div>
      </main>

      <aside className="right-col">
        <AlertsPanel alerts={alerts} />
<<<<<<< HEAD
        <EventLogs logs={eventLogs} />
=======
        <SystemHealth health={health} />
>>>>>>> 1acd6422434863ab27f208dc6f5fd59eb96ca5eb
      </aside>
    </div>
  );
}

<<<<<<< HEAD
=======
// --- Helpers ---
function interpolatePath(points, steps) {
  if (!points || points.length < 2) return points || [];
  const interpolated = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const seg = t * (points.length - 1);
    const idx = Math.floor(seg);
    const frac = seg - idx;
    if (idx >= points.length - 1) interpolated.push(points[points.length - 1]);
    else {
      const p1 = points[idx], p2 = points[idx + 1];
      interpolated.push({ lat: p1.lat + (p2.lat - p1.lat) * frac, lon: p1.lon + (p2.lon - p1.lon) * frac, status: "SAFE" });
    }
  }
  return interpolated;
}

async function hashHMAC(message, key) {
  const enc = new TextEncoder();
  const keyData = enc.encode(key);
  const msgData = enc.encode(message);
  const cryptoKey = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

>>>>>>> 1acd6422434863ab27f208dc6f5fd59eb96ca5eb
export default App;
