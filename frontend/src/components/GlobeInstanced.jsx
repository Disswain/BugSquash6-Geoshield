// src/components/GlobeInstanced.js
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const GLOBE_RADIUS = 5;

// --- Lat/Lon → Cartesian coords
function latLonToCartesian(lat, lon, radius = GLOBE_RADIUS) {
  if (lat == null || lon == null) return new THREE.Vector3(0, 0, 0);
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// --- Globe Scene with Sprites + interpolation
function GlobeScene({ flights, setFlights, planeTexture, onRightClick }) {
  const earthTexture = useMemo(
    () =>
      new THREE.TextureLoader().load(
        process.env.PUBLIC_URL + "/earth1-day.jpeg"
      ),
    []
  );

  // ✈️ Interpolate plane motion smoothly between API updates
  useFrame((_, delta) => {
    setFlights((prev) =>
      prev.map((f) => {
        if (!f.lat || !f.lon || !f.velocity || !f.heading) return f;

        const dist = f.velocity * delta; // meters traveled this frame
        const radHeading = (f.heading * Math.PI) / 180;

        // Approximation: 1° lat ≈ 111,320m, 1° lon depends on cos(lat)
        const dLat = (dist * Math.cos(radHeading)) / 111320;
        const dLon =
          (dist * Math.sin(radHeading)) /
          (111320 * Math.cos((f.lat * Math.PI) / 180));

        return { ...f, lat: f.lat + dLat, lon: f.lon + dLon };
      })
    );
  });

  return (
    <group>
      {/* 🌍 Earth */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
        <meshStandardMaterial map={earthTexture} />
      </mesh>

      {/* ✈️ Planes */}
      {flights.map((f, i) => {
        if (!f.lat || !f.lon) return null;
        const pos = latLonToCartesian(f.lat, f.lon, GLOBE_RADIUS + 0.05);
        return (
          <sprite
            key={f.icao24 + i}
            position={pos}
            scale={[0.07, 0.07, 1]}
            onContextMenu={(e) => {
              e.stopPropagation();
              onRightClick && onRightClick(f);
            }}
          >
            <spriteMaterial
              map={planeTexture}
              color={"#ffd700"}
              transparent
              depthWrite={false}
            />
          </sprite>
        );
      })}
    </group>
  );
}

// --- Main Component
export default function GlobeInstanced({ apiUrl, onTransferToMap }) {
  const [flights, setFlights] = useState([]);
  const planeTexture = useMemo(
    () => new THREE.TextureLoader().load(process.env.PUBLIC_URL + "/plane.png"),
    []
  );

  // ✅ Fetch OpenSky flights
  const fetchFlights = useCallback(async () => {
    try {
      const res = await fetch(apiUrl);
      if (!res.ok) return;
      const data = await res.json();

      const states = data.states || [];
      const normalized = states.slice(0, 2000).map((s) => ({
        icao24: s[0],
        callsign: s[1]?.trim() || "",
        lon: s[5],
        lat: s[6],
        altitude: s[7],
        velocity: s[9], // m/s
        heading: s[10], // degrees
        lastUpdate: s[3],
      }));
      setFlights(normalized);
    } catch (err) {
      console.error("fetchFlights error", err);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchFlights();
    const id = setInterval(fetchFlights, 1000); // ⏱ every 10s (safe for anonymous use)
    return () => clearInterval(id);
  }, [fetchFlights]);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Canvas id="globeCanvas" camera={{ position: [0, 0, 12], fov: 50 }}>
        {/* ✅ Lights go here, outside mesh */}
        <ambientLight intensity={1.2} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} />

        <OrbitControls
          enablePan
          enableZoom
          rotateSpeed={0.1}  // smoother rotation
          zoomSpeed={0.4}   // smoother zoom
          panSpeed={0.4}    // smoother panning
        />

        <GlobeScene
          flights={flights}
          setFlights={setFlights}
          planeTexture={planeTexture}
          onRightClick={(f) => onTransferToMap && onTransferToMap(f)}
        />
      </Canvas>

      {/* Overlay info */}
      <div
        style={{
          position: "absolute",
          left: 8,
          top: 8,
          color: "white",
          fontSize: 12,
        }}
      >
        <div
          style={{
            background: "rgba(0,0,0,0.5)",
            padding: 6,
            borderRadius: 6,
          }}
        >
          <div>🌍 Right-click a plane → Transfer to Map</div>
          <div style={{ fontSize: 11, opacity: 0.8 }}>
            Showing up to {flights.length} flights
          </div>
        </div>
      </div>
    </div>
  );
}
