from flask import Flask, request, jsonify
from detection import detect_anomaly
from auth import verify_message

app = Flask(__name__)

@app.route("/detect", methods=["POST"])
def detect():
    """
    POST request with:
    {
        "lat": float,
        "lon": float,
        "timestamp": str,
        "signature": str
    }
    """
    data = request.json
    lat, lon, ts, sig = data["lat"], data["lon"], data["timestamp"], data["signature"]

    # Step 1: Verify authenticity
    message = f"{lat},{lon},{ts}"
    if not verify_message(message, sig):
        return jsonify({"status": "spoofed", "reason": "Invalid Signature"})

    # Step 2: Run anomaly detection
    is_anomaly = detect_anomaly(lat, lon, ts)
    if is_anomaly:
        return jsonify({"status": "spoofed", "reason": "Anomaly Detected"})

    return jsonify({"status": "safe", "reason": "Valid & Consistent"})

if __name__ == "__main__":
    app.run(debug=True)
