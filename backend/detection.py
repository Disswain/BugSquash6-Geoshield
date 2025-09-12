import os
import pandas as pd

DATA_DIR = os.path.join(os.path.dirname(__file__), "../data")

def process_csv(csv_file):
    path = os.path.join(DATA_DIR, os.path.basename(csv_file))
    if not os.path.exists(path):
        print(f"CSV not found: {path}")
        return []

    df = pd.read_csv(path)
    results = []

    for _, row in df.iterrows():
        lat, lon = row.get("lat"), row.get("lon")
        plane = row.get("plane", "plane1")
        timestamp = row.get("timestamp", "N/A")
        speed = row.get("speed", 0)

        status = "SAFE"
        if speed > 1200:
            status = "SPOOFED"

        results.append({
            "plane": plane,
            "lat": lat,
            "lon": lon,
            "timestamp": timestamp,
            "status": status
        })

    return results
