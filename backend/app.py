from flask import Flask, jsonify, request
from flask_cors import CORS
from detection import process_csv
from auth import verify_signature

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

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
