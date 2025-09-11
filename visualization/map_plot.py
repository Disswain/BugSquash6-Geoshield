# import folium
# import pandas as pd

# # Load data
# df = pd.read_csv("../data/gps_data.csv")

# # Create map centered at first point
# m = folium.Map(location=[df.lat[0], df.lon[0]], zoom_start=5)

# # Plot points
# for i, row in df.iterrows():
#     color = "red" if i == 3 else "green"  # spoofed example at index 3
#     folium.Marker(
#         [row.lat, row.lon],
#         popup=f"{row.time}",
#         icon=folium.Icon(color=color)
#     ).add_to(m)

# m.save("output_map.html")
# print("Map saved as output_map.html")

# map_plot.py
import pandas as pd
import folium
from datetime import datetime

CSV_FILE = "../data/gps_data.csv"
OUTPUT_MAP = "output_map.html"

# Load data
df = pd.read_csv(CSV_FILE)

# Initialize map at first coordinate
m = folium.Map(location=[df.lat[0], df.lon[0]], zoom_start=6)

def detect_spoof(prev, curr):
    """Simple spoof detection based on sudden jumps or fake satellites."""
    spoof_reason = None
    
    # Check fake satellite ID (example: > G32 = invalid)
    try:
        sat_num = int(curr["satellite_id"][1:])
        if sat_num > 32:  # GPS satellites are G01-G32
            spoof_reason = "Invalid Satellite ID"
    except:
        spoof_reason = "Malformed Satellite ID"

    # Check speed (jump distance in short time)
    if prev is not None:
        prev_lat, prev_lon = prev["lat"], prev["lon"]
        curr_lat, curr_lon = curr["lat"], curr["lon"]

        # crude distance in degrees (not km) for simplicity
        dist = abs(curr_lat - prev_lat) + abs(curr_lon - prev_lon)
        
        prev_time = datetime.fromisoformat(prev["timestamp"].replace("Z", "+00:00"))
        curr_time = datetime.fromisoformat(curr["timestamp"].replace("Z", "+00:00"))
        time_diff = (curr_time - prev_time).total_seconds()

        if time_diff > 0 and dist / time_diff > 0.01:  # threshold
            spoof_reason = spoof_reason or "Unrealistic Jump"

    return spoof_reason

prev_row = None
for _, row in df.iterrows():
    spoof_reason = detect_spoof(prev_row, row)
    status = "SAFE" if spoof_reason is None else f"SPOOFED ({spoof_reason})"

    color = "green" if status == "SAFE" else "red"
    folium.CircleMarker(
        location=[row["lat"], row["lon"]],
        radius=6,
        color=color,
        fill=True,
        fill_color=color,
        fill_opacity=0.7,
        tooltip=f"{status}\nTime: {row['timestamp']}\nSat: {row['satellite_id']}"
    ).add_to(m)

    prev_row = row

# Save map
m.save(OUTPUT_MAP)
print(f"✅ Map saved as {OUTPUT_MAP}")
