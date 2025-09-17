// interpolate path for smooth trajectories
export function interpolatePath(points, steps) {
  if (!points || points.length < 2) return points || [];
  const interpolated = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const seg = t * (points.length - 1);
    const idx = Math.floor(seg);
    const frac = seg - idx;
    if (idx >= points.length - 1) interpolated.push(points[points.length - 1]);
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

// hash function for backend HMAC signature
export async function hashHMAC(message, key) {
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
