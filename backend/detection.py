from geopy.distance import geodesic
from datetime import datetime

def detect_spoofing(data):
    """
    data: list of dicts with lat, lon, time
    returns: list of alerts
    """
    alerts = []
    for i in range(1, len(data)):
        p1 = (data[i-1]["lat"], data[i-1]["lon"])
        p2 = (data[i]["lat"], data[i]["lon"])
        t1 = datetime.fromisoformat(data[i-1]["time"])
        t2 = datetime.fromisoformat(data[i]["time"])
        
        distance = geodesic(p1, p2).km
        time_diff = (t2 - t1).seconds / 3600  # in hours
        speed = distance / time_diff if time_diff else float("inf")

        if speed > 1000:  # spoofing threshold
            alerts.append({
                "index": i,
                "message": f"Unrealistic speed detected ({speed:.2f} km/h)"
            })
    return alerts
