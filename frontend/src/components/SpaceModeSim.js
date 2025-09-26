// src/components/SpaceModeSim.js
import React, { useEffect, useRef, useState } from "react";

// Utility: generate unique id
const uid = () => Math.random().toString(36).slice(2, 9);

// Initial satellites
const initialSats = [
  { id: "SAT-1", name: "Orbital-1", orbitRadius: 8000, health: 100, linkQuality: 1.0, status: "OK" },
  { id: "SAT-2", name: "Orbital-2", orbitRadius: 9000, health: 100, linkQuality: 1.0, status: "OK" },
  { id: "SAT-3", name: "Orbital-3", orbitRadius: 10000, health: 100, linkQuality: 1.0, status: "OK" }
];

export default function SpaceModeSim({ spaceModeEnabled, onSatellitesUpdate, onNewAlert, onNewEvent }) {
  const [sats, setSats] = useState({});
  const simRef = useRef(null);

  // When space mode toggles ON → load satellites
  useEffect(() => {
    if (spaceModeEnabled) {
      const mapObj = {};
      initialSats.forEach(s => {
        mapObj[s.id] = { ...s, lastTelemetry: { position: null } };
      });
      setSats(mapObj);
    } else {
      setSats({});
    }
  }, [spaceModeEnabled]);

  // 🔥 NEW: propagate satellites upward whenever they change
  useEffect(() => {
    if (onSatellitesUpdate) {
      onSatellitesUpdate(Object.values(sats));
    }
  }, [sats, onSatellitesUpdate]);

  // Simulation loop: update telemetry + trigger random events
  useEffect(() => {
    if (!spaceModeEnabled) {
      if (simRef.current) {
        clearInterval(simRef.current);
        simRef.current = null;
      }
      return;
    }

    simRef.current = setInterval(() => {
      setSats(prev => {
        const newSats = { ...prev };

        Object.values(newSats).forEach(sat => {
          // Telemetry update (random position + jitter)
          sat.lastTelemetry = {
            position: {
              lat: (Math.random() * 180 - 90).toFixed(3),
              lon: (Math.random() * 360 - 180).toFixed(3)
            },
            ts: Date.now()
          };
          sat.linkQuality = Math.max(0, Math.min(1, sat.linkQuality + (Math.random() - 0.5) * 0.05));

          // Random events
          const p = Math.random();
          if (p < 0.02) simulateJamming(sat.id);
          else if (p < 0.04) simulateSpoofing(sat.id);
        });

        return { ...newSats };
      });
    }, 4000);

    return () => {
      if (simRef.current) clearInterval(simRef.current);
    };
  }, [spaceModeEnabled]);

  // --- Event helpers ---
  const pushEvent = (evt) => {
    if (onNewEvent) onNewEvent({ ...evt, id: uid() });
    if ((evt.severity === "medium" || evt.severity === "high") && onNewAlert) {
      onNewAlert({ ...evt, id: uid(), resolved: false });
    }
  };

  const simulateJamming = (satId) => {
    setSats(prev => {
      const sat = { ...prev[satId] };
      if (!sat) return prev;
      sat.status = "JAMMED";
      sat.linkQuality = Math.max(0, sat.linkQuality - 0.3);
      pushEvent({
        satId,
        type: "JAM",
        severity: "high",
        description: `${sat.name} is under simulated jamming`,
        timestamp: Date.now()
      });
      return { ...prev, [satId]: sat };
    });
  };

  const simulateSpoofing = (satId) => {
    setSats(prev => {
      const sat = { ...prev[satId] };
      if (!sat) return prev;
      sat.status = "SPOOFED";
      pushEvent({
        satId,
        type: "SPOOF",
        severity: "medium",
        description: `${sat.name} is receiving spoofed telemetry`,
        timestamp: Date.now()
      });
      return { ...prev, [satId]: sat };
    });
  };

  // UI
  return (
    <div style={{ padding: "12px", color: "white" }}>
      <h3>🛰 Space Mode Simulation</h3>
      {spaceModeEnabled ? (
        <p>Simulating {Object.keys(sats).length} satellites...</p>
      ) : (
        <p>Space Mode OFF</p>
      )}
    </div>
  );
}
