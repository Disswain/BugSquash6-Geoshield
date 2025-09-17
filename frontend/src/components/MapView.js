import React from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  Polyline,
  LayersControl
} from "react-leaflet";
import ZoomControls from "./ZoomControls";
import L from "leaflet";

const { BaseLayer } = LayersControl;

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

function MapView({
  planes,
  trajectories,
  spoofedPaths,
  handleDragEnd,
  mapRef,
  indiaCenter
}) {
  return (
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
  );
}

export default MapView;
