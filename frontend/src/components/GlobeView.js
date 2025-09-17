// src/components/GlobeView.js
import React, { useRef, useEffect } from "react";
import Globe from "react-globe.gl";

function GlobeView({ planes, trajectories, spoofedPaths, spaceModeEnabled }) {
  const globeRef = useRef();

  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: 20, lng: 0, altitude: 2.5 });
    }
  }, []);

  // --- Sample satellites for space mode ---
  const satellites = [
    {
      name: "Sat-1",
      lat: 10,
      lng: 20,
      status: "SAFE",
      orbit: { startLat: 10, startLng: 20, endLat: 40, endLng: 80 }
    },
    {
      name: "Sat-2",
      lat: -15,
      lng: 60,
      status: "SPOOFED",
      orbit: { startLat: -15, startLng: 60, endLat: -40, endLng: 120 }
    }
  ];

  return (
    <Globe
      ref={globeRef}
      globeImageUrl={
        spaceModeEnabled
          ? "//unpkg.com/three-globe/example/img/earth-night.jpg" // darker earth
          : "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
      }
      backgroundImageUrl={
        spaceModeEnabled
          ? "//unpkg.com/three-globe/example/img/night-sky.png" // starfield
          : undefined
      }
      backgroundColor="#0b1216"
      animateIn={true}
      showAtmosphere={!spaceModeEnabled}
      atmosphereColor="lightskyblue"
      atmosphereAltitude={0.25}
      // --- Points (planes or satellites) ---
      pointsData={
        spaceModeEnabled
          ? satellites.map((s) => ({
              lat: s.lat,
              lng: s.lng,
              size: 2.5,
              color: s.status === "SAFE" ? "cyan" : "red",
              label: `${s.name} - ${s.status}`
            }))
          : Object.keys(planes).map((p) => ({
              lat: planes[p].lat,
              lng: planes[p].lon,
              size: 1.5,
              color: planes[p].status === "SAFE" ? "lime" : "red",
              label: `${p} - ${planes[p].status}${
                planes[p].reason ? " (" + planes[p].reason + ")" : ""
              }`
            }))
      }
      // --- Arcs (plane routes or orbits) ---
      arcsData={
        spaceModeEnabled
          ? satellites.map((s) => ({
              startLat: s.orbit.startLat,
              startLng: s.orbit.startLng,
              endLat: s.orbit.endLat,
              endLng: s.orbit.endLng,
              color: s.status === "SAFE" ? ["cyan", "white"] : ["red", "orange"],
              dashLength: 0.3,
              dashGap: 0.05,
              dashAnimateTime: 3000
            }))
          : [
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
            ]
      }
    />
  );
}

export default GlobeView;
