import requests
from sgp4.api import Satrec, WGS72
from datetime import datetime
import numpy as np


def fetch_tle(satellite_group_url: str):
    """
    Fetch TLEs from a Celestrak group URL.
    Example URL: https://celestrak.org/NORAD/elements/gps-ops.txt
    """
    response = requests.get(satellite_group_url)
    if response.status_code != 200:
        raise Exception("Failed to fetch TLE data from Celestrak")

    lines = response.text.strip().split("\n")
    tle_list = []
    for i in range(0, len(lines), 3):
        if i + 2 < len(lines):  # avoid index errors
            name = lines[i].strip()
            line1 = lines[i + 1].strip()
            line2 = lines[i + 2].strip()
            tle_list.append((name, line1, line2))
    return tle_list


def validate_satellite(
    reported_position: list,
    tle_line1: str,
    tle_line2: str,
    timestamp: datetime,
    tolerance_km: float = 5.0,
):
    """
    Validate a reported satellite position against TLE-predicted position.
    reported_position → [x, y, z] in km (ECI frame)
    tolerance_km → threshold distance to flag spoofing
    """
    # Initialize satellite from TLE
    sat = Satrec.twoline2rv(tle_line1, tle_line2, WGS72)

    # Propagate orbit for the given timestamp
    jd = timestamp.toordinal() + 1721424.5  # Julian date
    fr = (timestamp.hour * 3600 + timestamp.minute * 60 + timestamp.second) / 86400.0
    error_code, predicted_pos, predicted_vel = sat.sgp4(jd, fr)

    if error_code != 0:
        return {
            "status": "error",
            "message": f"SGP4 error code {error_code}",
            "reported_position": reported_position,
        }

    # Calculate Euclidean error distance (in km)
    error_distance = np.linalg.norm(np.array(reported_position) - np.array(predicted_pos))

    if error_distance > tolerance_km:
        return {
            "status": "spoof_detected",
            "error_km": float(error_distance),
            "reported_position": reported_position,
            "predicted_position": [float(x) for x in predicted_pos],
        }

    return {
        "status": "ok",
        "error_km": float(error_distance),
        "reported_position": reported_position,
        "predicted_position": [float(x) for x in predicted_pos],
    }


if __name__ == "__main__":
    # 🔹 Example standalone test (run: python satellite_detection.py)
    url = "https://celestrak.org/NORAD/elements/gps-ops.txt"
    tle_data = fetch_tle(url)

    # Take the first satellite in the list
    sat_name, line1, line2 = tle_data[0]

    # Example: fake reported position (km, Earth-Centered Inertial frame)
    reported_position = [26500, 0, 0]
    now = datetime.utcnow()

    result = validate_satellite(reported_position, line1, line2, now)
    print(f"[{sat_name}] → {result}")
