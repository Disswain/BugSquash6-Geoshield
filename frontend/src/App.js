import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Tooltip, Polyline, LayersControl, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";

const { BaseLayer } = LayersControl;
const indiaCenter = [22.0, 79.0];

const planeIcon = new L.Icon({
  iconUrl: process.env.PUBLIC_URL + "/plane.png",
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

const alertIcon = new L.Icon({
  iconUrl: process.env.PUBLIC_URL + "/alert.png",
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// Sidebar with status icons + destination check
function Sidebar({ planes, speedETA, selectedPlane, setSelectedPlane, checkDestination }) {
  const [inputs, setInputs] = useState({});

  const handleInputChange = (plane, field, value) => {
    setInputs(prev => ({
      ...prev,
      [plane]: {
        ...prev[plane],
        [field]: value
      }
    }));
  };

  const handleCheck = (plane) => {
    if (inputs[plane] && inputs[plane].lat && inputs[plane].lon) {
      checkDestination(plane, parseFloat(inputs[plane].lat), parseFloat(inputs[plane].lon));
    }
  };

  return (
    <div className="sidebar">
      <h3>✈ Active Planes</h3>
      {Object.keys(planes).map(plane => {
        const info = speedETA[plane] || {};
        const isSelected = plane === selectedPlane;
        const status = planes[plane].status;
        const statusIcon = status === "SAFE" ? "🟢" : "🔴";

        return (
          <div
            key={plane}
            className={`plane-item ${isSelected ? "selected" : ""}`}
            onClick={() => setSelectedPlane(plane)}
          >
            <strong>{statusIcon} {plane}</strong> — <span>{status}</span>
            {info.speed && <div>Speed: {info.speed} km/h</div>}
            {info.eta && <div>ETA: {info.eta}</div>}

            {/* Destination input */}
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
              <button className="spoof-button" onClick={() => handleCheck(plane)}>Spoof</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Zoom Controls
function ZoomControls() {
  const map = useMap();
  return (
    <div style={{ position: "absolute", top: "80px", right: "20px", zIndex: 1000 }}>
      <button onClick={() => map.zoomIn()} style={{ display: "block", marginBottom: "5px" }}>＋</button>
      <button onClick={() => map.zoomOut()}>－</button>
    </div>
  );
}

function App() {
  const [planes, setPlanes] = useState({});
  const [trajectories, setTrajectories] = useState({});
  const [simulationStarted, setSimulationStarted] = useState(false);
  const [speedETA, setSpeedETA] = useState({});
  const [selectedPlane, setSelectedPlane] = useState(null);
  const [spoofedPaths, setSpoofedPaths] = useState({});
  const audioRef = useRef(new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg"));

  // Fetch trajectories once at start
  const startSimulation = async () => {
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
    Object.keys(data).forEach(plane => {
      const allPoints = data[plane].trajectory;
      const interpolated = interpolatePath(allPoints, 60);
      trajs[plane] = interpolated;
      startPositions[plane] = {
        lat: interpolated[0].lat,
        lon: interpolated[0].lon,
        status: interpolated[0].status
      };
    });

    setPlanes(startPositions);
    setTrajectories(trajs);
    setSimulationStarted(true);
  };

  // Step along trajectory (1 point per second)
  useEffect(() => {
    if (!simulationStarted) return;
    const intervals = {};

    Object.keys(trajectories).forEach(plane => {
      if (spoofedPaths[plane]) return; // stop moving spoofed planes

      let index = 0;
      intervals[plane] = setInterval(() => {
        setPlanes(prev => {
          if (index < trajectories[plane].length) {
            const prevPos = index > 0 ? trajectories[plane][index - 1] : trajectories[plane][0];
            const currPos = trajectories[plane][index];
            const dist = L.latLng(prevPos.lat, prevPos.lon).distanceTo(L.latLng(currPos.lat, currPos.lon));
            const speed = (dist * 3.6).toFixed(1);
            const eta = (trajectories[plane].length - index) + "s";

            setSpeedETA(old => ({ ...old, [plane]: { speed, eta } }));

            return {
              ...prev,
              [plane]: {
                ...prev[plane],
                lat: currPos.lat,
                lon: currPos.lon,
                status: currPos.status
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
    const lastCorrect = planes[plane]; // last safe position

    // Stop movement, draw red line from last correct to dragged point
    setSpoofedPaths(prev => ({
      ...prev,
      [plane]: [[lastCorrect.lat, lastCorrect.lon], [pos.lat, pos.lng]]
    }));

    setPlanes(prev => ({
      ...prev,
      [plane]: { ...prev[plane], lat: pos.lat, lon: pos.lng, status: "SPOOFED" }
    }));

    alert(`${plane} has gone off trajectory! Spoof attack detected.`);
    audioRef.current.play();
  };

  // Destination check
  const checkDestination = (plane, lat, lon) => {
    const originalDest = trajectories[plane][trajectories[plane].length - 1];
    const d = L.latLng(lat, lon).distanceTo(L.latLng(originalDest.lat, originalDest.lon));

    // Jump plane to manual coords
    setPlanes(prev => ({
      ...prev,
      [plane]: { ...prev[plane], lat, lon }
    }));

    if (d > 50000) {
      setPlanes(prev => ({
        ...prev,
        [plane]: { ...prev[plane], status: "SPOOFED" }
      }));
      setSpoofedPaths(prev => ({
        ...prev,
        [plane]: [[trajectories[plane][trajectories[plane].length - 2].lat,
                   trajectories[plane][trajectories[plane].length - 2].lon], [lat, lon]]
      }));
      alert(`${plane} reported wrong destination! Marked as SPOOFED.`);
    } else {
      alert(`${plane} destination verified as correct.`);
    }
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar
        planes={planes}
        speedETA={speedETA}
        selectedPlane={selectedPlane}
        setSelectedPlane={setSelectedPlane}
        checkDestination={checkDestination}
      />
      <div style={{ width: "88%", position: "relative" }}>
        {!simulationStarted && (
          <button className="start-button" onClick={startSimulation}>
            Start Simulation
          </button>
        )}

        <MapContainer center={indiaCenter} zoom={5} style={{ height: "100vh", width: "100%" }}>
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
                {/* Green dotted original path */}
                <Polyline positions={(trajectories[plane] || []).map(p => [p.lat, p.lon])}
                          color="green" dashArray="6,8" weight={3} />

                {/* Red dotted spoof path */}
                {spoofedPaths[plane] && (
                  <Polyline positions={spoofedPaths[plane]} color="red" dashArray="6,8" weight={3} />
                )}

                <Marker
                  position={[pos.lat, pos.lon]}
                  icon={planeIcon}
                  draggable={true}
                  eventHandlers={{ dragend: (e) => handleDragEnd(plane, e) }}
                >
                  <Tooltip direction="top" offset={[0, -20]} permanent>
                    <div style={{ color: pos.status === "SAFE" ? "green" : "red", fontWeight: "bold" }}>
                      {plane}: {pos.status}
                    </div>
                  </Tooltip>
                </Marker>

                {pos.status === "SPOOFED" && (
                  <Marker position={[pos.lat + 0.05, pos.lon]} icon={alertIcon} interactive={false} />
                )}
              </React.Fragment>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}

// --- Helpers ---
function interpolatePath(points, steps) {
  if (points.length < 2) return points;
  const interpolated = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const seg = t * (points.length - 1);
    const idx = Math.floor(seg);
    const frac = seg - idx;
    if (idx >= points.length - 1) {
      interpolated.push(points[points.length - 1]);
    } else {
      const p1 = points[idx];
      const p2 = points[idx + 1];
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
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default App;
