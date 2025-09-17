import React from "react";
import { useMap } from "react-leaflet";

function ZoomControls() {
  const map = useMap();
  return (
    <div className="zoom-controls">
      <button onClick={() => map.zoomIn()}>＋</button>
      <button onClick={() => map.zoomOut()}>－</button>
    </div>
  );
}

export default ZoomControls;
