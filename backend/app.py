import joblib
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS
from detection import process_csv
from auth import verify_signature

# 🔹 Satellite detection functions
from satellite_detection import fetch_tle, validate_satellite
from datetime import datetime, timezone
from sgp4.api import Satrec, WGS72  # ✅ needed for orbit propagation
import os

app = Flask(__name__)
CORS(app)

# 🔹 Load AI model (make sure ai_model.pkl exists in backend directory)
ai_model = joblib.load("ai_model.pkl")


# ---------------- Plane endpoints ----------------
@app.route("/live_planes_multi", methods=["POST"])
def live_planes_multi():
    """
    Accepts multiple CSV files + signature and returns combined plane trajectories.
    """
    data = request.json
    csv_files = data.get("csv_files", [])
    signature = data.get("signature")

    if not verify_signature(",".join(csv_files), signature):
        return jsonify({"error": "Invalid signature"}), 401

    combined_data = {}
    for csv_file in csv_files:
        results = process_csv(csv_file)  # full trajectory
        for row in results:
            plane = row["plane"]
            if plane not in combined_data:
                combined_data[plane] = []
            combined_data[plane].append({
                "lat": row["lat"],
                "lon": row["lon"],
                "status": row["status"],
                "timestamp": row["timestamp"]
            })

    response = {}
    for plane, traj in combined_data.items():
        response[plane] = {
            "current": traj[-1],
            "trajectory": traj  # ALL points
        }

    return jsonify(response)


# ---------------- Satellite spoof detection ----------------
@app.route("/check_satellite", methods=["POST"])
def check_satellite():
    """
    Example POST body:
    {
        "reported_position": [26500, 0, 0],   # [x, y, z] in km (ECI frame)
        "satellite_group_url": "https://celestrak.org/NORAD/elements/gps-ops.txt"
    }
    """
    data = request.json
    reported_position = data.get("reported_position")
    satellite_group_url = data.get(
        "satellite_group_url",
        "https://celestrak.org/NORAD/elements/gps-ops.txt"
    )

    if not reported_position or len(reported_position) != 3:
        return jsonify({"error": "reported_position must be [x,y,z] in km"}), 400

    try:
        tle_data = fetch_tle(satellite_group_url)
        sat_name, line1, line2 = tle_data[0]  # take first satellite in group

        result = validate_satellite(
            reported_position,
            line1,
            line2,
            datetime.now(timezone.utc)
        )
        result["satellite_name"] = sat_name
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------- Live satellites ----------------
@app.route("/live_satellites", methods=["GET"])
def live_satellites():
    """
    Returns active satellites from Celestrak GPS-OPS group.
    Example:
    {
      "GPS BIIF-2": {"position": [x, y, z], "status": "SAFE"},
      ...
    }
    """
    try:
        url = "https://celestrak.org/NORAD/elements/gps-ops.txt"
        tle_data = fetch_tle(url)
        now = datetime.now(timezone.utc)

        satellites = {}
        for sat_name, line1, line2 in tle_data[:5]:  # limit to 5 for demo
            sat = Satrec.twoline2rv(line1, line2, WGS72)
            jd = now.toordinal() + 1721424.5
            fr = (now.hour * 3600 + now.minute * 60 + now.second) / 86400.0
            _, predicted_pos, _ = sat.sgp4(jd, fr)

            satellites[sat_name] = {
                "position": [float(x) for x in predicted_pos],
                "status": "SAFE"  # default SAFE until spoof check says otherwise
            }

        return jsonify(satellites)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------- AI-powered anomaly classification ----------------
@app.route("/ai_classify", methods=["POST"])
def ai_classify():
    """
    Example POST body:
    {
        "features": [health, link, lat, lon, spoofLat, spoofLon, offsetDist, timeOffset]
    }
    Returns:
    {
        "prediction": "SAFE" | "SPOOFED" | "JAMMED",
        "probabilities": [safeProb, spoofedProb, jammedProb]
    }
    """
    try:
        data = request.get_json()
        features = data.get("features")

        if not features or not isinstance(features, list):
            return jsonify({"error": "features must be a list of numbers"}), 400

        X = np.array(features, dtype=float).reshape(1, -1)

        # 1️⃣ ML model output
        prediction = ai_model.predict(X)[0]
        if hasattr(ai_model, "predict_proba"):
            model_probs = np.array(ai_model.predict_proba(X)[0])
        else:
            model_probs = np.array([0.33, 0.33, 0.34])

        # 2️⃣ Heuristic adjustment
        health = features[0] if len(features) > 0 else 100
        link = features[1] if len(features) > 1 else 100
        lat = features[2] if len(features) > 2 else 0
        lon = features[3] if len(features) > 3 else 0
        spoofLat = features[4] if len(features) > 4 else 0
        spoofLon = features[5] if len(features) > 5 else 0
        offsetDist = features[6] if len(features) > 6 else 0
        timeOffset = features[7] if len(features) > 7 else 0

        heuristic_probs = model_probs.copy()

        # Rule 1: spoofed coords far from actual → SPOOFED
        if offsetDist > 5:
            heuristic_probs = np.array([0.05, 0.85, 0.10])

        # Rule 2: link very low but health is okay → JAMMED
        elif link < 50 and health > 60:
            heuristic_probs = np.array([0.10, 0.15, 0.75])

        # Rule 3: both health & link very low → JAMMED
        elif health < 40 and link < 40:
            heuristic_probs = np.array([0.05, 0.20, 0.75])

        # Rule 4: everything healthy & aligned → SAFE
        elif health > 80 and link > 80 and offsetDist < 1 and timeOffset < 5:
            heuristic_probs = np.array([0.95, 0.03, 0.02])

        # Normalize
        heuristic_probs = heuristic_probs / heuristic_probs.sum()

        labels = ["SAFE", "SPOOFED", "JAMMED"]
        final_prediction = labels[int(np.argmax(heuristic_probs))]

        # 3️⃣ Logging
        log_entry = (
            f"{datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')} | "
            f"features={features} | "
            f"ML={prediction} {model_probs.round(3).tolist()} | "
            f"Final={final_prediction} {heuristic_probs.round(3).tolist()}\n"
        )
        with open("ai_log.txt", "a") as f:
            f.write(log_entry)

        return jsonify({
            "prediction": final_prediction,
            "probabilities": [round(float(p), 3) for p in heuristic_probs]
        })

    except Exception as e:
        return jsonify({
            "prediction": "SAFE",
            "probabilities": [1.0, 0.0, 0.0],
            "error": str(e)
        })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))  # Use Render's assigned port
    app.run(host="0.0.0.0", port=port, debug=True)