import React, { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  Polyline,
  LayersControl
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";

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

function App() {
  const [planes, setPlanes] = useState({});
  const [trajectories, setTrajectories] = useState({});
  const [simulationStarted, setSimulationStarted] = useState(false);
  const [speedETA, setSpeedETA] = useState({});
  const [selectedPlane, setSelectedPlane] = useState(null);
  const [spoofedPaths, setSpoofedPaths] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [eventLogs, setEventLogs] = useState([]);

  // 🔑 Main mode state: "map" | "globe" | "space"
  const [viewMode, setViewMode] = useState("map");
  const [simulationModeEnabled, setSimulationModeEnabled] = useState(false);

  const audioRef = useRef(
    new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg")
  );
  const mapRef = useRef(null);

  const [health, setHealth] = useState([
    { title: "Backend/server uptime", ok: true },
    { title: "AI detection status", ok: true },
    { title: "Data source availability", ok: true },
  ]);

  // --- Start simulation ---
  const startSimulation = async () => {
    try {
      const csvFiles = ["plane1.csv", "plane2.csv", "plane3.csv"];
      const signature = await hashHMAC(csvFiles.join(","), "supersecretkey");

      const res = await fetch("http://localhost:5000/live_planes_multi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv_files: csvFiles, signature }),
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
          status: "SAFE",
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

  // --- Step simulation ---
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
          }
          return prev;
        });
        index++;
      }, 1000);
    });

    return () => Object.values(intervals).forEach(clearInterval);
  }, [simulationStarted, trajectories, spoofedPaths]);

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
      audioRef.current.play();
    } else {
      addEventLog(`${plane} destination OK.`);
    }
  };

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
          pushAlert({ flight: p, desc: "Spoof detected", severity: "High" });
        }
      }
    });
  }, [planes, alerts]);

  return (
    <div className="app-grid">
      {/* Sidebar with controls + planes */}
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

        </div>
      </main>

      <aside className="right-col">
        <AlertsPanel alerts={alerts} />
        <EventLogs logs={eventLogs} />
      </aside>
    </div>
  );
}

export default App;
