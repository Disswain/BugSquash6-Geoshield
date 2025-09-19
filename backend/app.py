from flask import Flask, jsonify, request
from flask_cors import CORS
from detection import process_csv
from auth import verify_signature

# 🔹 Import satellite detection functions
from satellite_detection import fetch_tle, validate_satellite
from datetime import datetime, timezone

app = Flask(__name__)
CORS(app)

@app.route("/live_planes_multi", methods=["POST"])
def live_planes_multi():
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

    # Send the full trajectory and current position
    response = {}
    for plane, traj in combined_data.items():
        response[plane] = {
            "current": traj[-1],
            "trajectory": traj  # ALL points, not just last few
        }

    return jsonify(response)


# 🔹 New route for satellite spoof detection
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
    satellite_group_url = data.get("satellite_group_url", "https://celestrak.org/NORAD/elements/gps-ops.txt")

    if not reported_position or len(reported_position) != 3:
        return jsonify({"error": "reported_position must be a list of 3 values [x,y,z] in km"}), 400

    try:
        tle_data = fetch_tle(satellite_group_url)
        sat_name, line1, line2 = tle_data[0]  # 🔹 Take first satellite in group for now

        result = validate_satellite(reported_position, line1, line2, datetime.now(timezone.utc))
        result["satellite_name"] = sat_name
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# 🔹 New route for live satellites (frontend fetch)
@app.route("/live_satellites", methods=["GET"])
def live_satellites():
    """
    Returns active satellites from Celestrak GPS-OPS group
    Example response:
    {
      "GPS BIIF-2": {"position": [x, y, z], "status": "ok"},
      ...
    }
    """
    try:
        url = "https://celestrak.org/NORAD/elements/gps-ops.txt"
        tle_data = fetch_tle(url)
        now = datetime.now(timezone.utc)

        satellites = {}
        for sat_name, line1, line2 in tle_data[:5]:  # limit to 5 for demo
            result = validate_satellite([26500, 0, 0], line1, line2, now)
            satellites[sat_name] = {
                "position": result.get("predicted_position"),
                "status": result.get("status", "unknown")
            }

        return jsonify(satellites)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
