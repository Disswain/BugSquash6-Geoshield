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


# import pandas as pd
# import folium
# from datetime import datetime

# CSV_FILE =  "data/gps_data.csv"
# OUTPUT_MAP = "output_map.html"

# # Load data
# df = pd.read_csv(CSV_FILE)

# # Initialize map at first coordinate
# m = folium.Map(location=[df.lat[0], df.lon[0]], zoom_start=5)

# def detect_spoof(prev, curr):
#     """Simple spoof detection based on sudden jumps or fake satellites."""
#     spoof_reason = None
    
#     # Check fake satellite ID (example: > G32 = invalid)
#     try:
#         sat_num = int(curr["satellite_id"][1:])
#         if sat_num > 32:  # GPS satellites are G01-G32
#             spoof_reason = "Invalid Satellite ID"
#     except:
#         spoof_reason = "Malformed Satellite ID"

#     # Check speed (jump distance in short time)
#     if prev is not None:
#         prev_lat, prev_lon = prev["lat"], prev["lon"]
#         curr_lat, curr_lon = curr["lat"], curr["lon"]

#         # crude distance in degrees (not km) for simplicity
#         dist = abs(curr_lat - prev_lat) + abs(curr_lon - prev_lon)
        
#         prev_time = datetime.fromisoformat(prev["timestamp"].replace("Z", "+00:00"))
#         curr_time = datetime.fromisoformat(curr["timestamp"].replace("Z", "+00:00"))
#         time_diff = (curr_time - prev_time).total_seconds()

#         if time_diff > 0 and dist / time_diff > 0.01:  # threshold
#             spoof_reason = spoof_reason or "Unrealistic Jump"

#     return spoof_reason

# prev_row = None
# for _, row in df.iterrows():
#     spoof_reason = detect_spoof(prev_row, row)
#     status = "SAFE" if spoof_reason is None else f"SPOOFED ({spoof_reason})"

#     color = "green" if status == "SAFE" else "red"
#     folium.CircleMarker(
#         location=[row["lat"], row["lon"]],
#         radius=6,
#         color=color,
#         fill=True,
#         fill_color=color,
#         fill_opacity=0.7,
#         tooltip=f"{status}\nTime: {row['timestamp']}\nSat: {row['satellite_id']}"
#     ).add_to(m)

#     prev_row = row

# # Save map
# m.save(OUTPUT_MAP)
# print(f"✅ Map saved as {OUTPUT_MAP}")

# visualization/map_plot.py


# 2//
# import pandas as pd
# import folium
# from datetime import datetime

# CSV_FILE = "data/gps_data.csv"
# OUTPUT_MAP = "output_map.html"

# # Load data
# df = pd.read_csv(CSV_FILE)

# # Initialize map at first coordinate
# m = folium.Map(location=[df.lat[0], df.lon[0]], zoom_start=5)

# def detect_spoof(prev, curr):
#     """Simple spoof detection based on sudden jumps or fake satellites."""
#     spoof_reason = None

#     # Check fake satellite ID (> G32 invalid for GPS)
#     try:
#         sat_num = int(curr["satellite_id"][1:])
#         if sat_num > 32:
#             spoof_reason = "Invalid Satellite ID"
#     except:
#         spoof_reason = "Malformed Satellite ID"

#     # Check unrealistic speed/jump
#     if prev is not None:
#         prev_lat, prev_lon = prev["lat"], prev["lon"]
#         curr_lat, curr_lon = curr["lat"], curr["lon"]

#         # crude distance in degrees
#         dist = abs(curr_lat - prev_lat) + abs(curr_lon - prev_lon)

#         prev_time = datetime.fromisoformat(prev["timestamp"].replace("Z", "+00:00"))
#         curr_time = datetime.fromisoformat(curr["timestamp"].replace("Z", "+00:00"))
#         time_diff = (curr_time - prev_time).total_seconds()

#         if time_diff > 0 and dist / time_diff > 0.01:  # threshold
#             spoof_reason = spoof_reason or "Unrealistic Jump"

#     return spoof_reason

# prev_row = None
# for _, row in df.iterrows():
#     spoof_reason = detect_spoof(prev_row, row)
#     status = "SAFE" if spoof_reason is None else f"SPOOFED ({spoof_reason})"

#     color = "green" if status == "SAFE" else "red"

#     # Marker for each point
#     folium.CircleMarker(
#         location=[row["lat"], row["lon"]],
#         radius=6,
#         color=color,
#         fill=True,
#         fill_color=color,
#         fill_opacity=0.7,
#         tooltip=f"{status}\nTime: {row['timestamp']}\nSat: {row['satellite_id']}"
#     ).add_to(m)

#     # Draw line from previous point
#     if prev_row is not None:
#         line_color = "green" if status == "SAFE" else "red"
#         folium.PolyLine(
#             locations=[(prev_row["lat"], prev_row["lon"]), (row["lat"], row["lon"])],
#             color=line_color,
#             weight=3,
#             opacity=0.8
#         ).add_to(m)

#     prev_row = row

# # Save map
# m.save(OUTPUT_MAP)
# print(f"✅ Map with paths saved as {OUTPUT_MAP}")




# # 3//
# import pandas as pd
# import folium
# from datetime import datetime
# import sys
# import os

# # Default file (if no argument given)
# DEFAULT_CSV = "data/gps_data.csv"

# # CLI argument: python map_plot.py <csv_file>
# if len(sys.argv) > 1:
#     CSV_FILE = sys.argv[1]
# else:
#     CSV_FILE = DEFAULT_CSV

# if not os.path.exists(CSV_FILE):
#     print(f"❌ Error: File {CSV_FILE} not found.")
#     sys.exit(1)

# # Auto-generate output map name (e.g., gps_data_map.html)
# base_name = os.path.splitext(os.path.basename(CSV_FILE))[0]
# OUTPUT_MAP = f"{base_name}_map.html"

# # Load data
# df = pd.read_csv(CSV_FILE)

# # Initialize map at first coordinate
# m = folium.Map(location=[df.lat[0], df.lon[0]], zoom_start=5)

# def detect_spoof(prev, curr):
#     """Simple spoof detection based on sudden jumps or fake satellites."""
#     spoof_reason = None

#     # Check fake satellite ID (> G32 invalid for GPS)
#     try:
#         sat_num = int(curr["satellite_id"][1:])
#         if sat_num > 32:
#             spoof_reason = "Invalid Satellite ID"
#     except:
#         spoof_reason = "Malformed Satellite ID"

#     # Check unrealistic speed/jump
#     if prev is not None:
#         prev_lat, prev_lon = prev["lat"], prev["lon"]
#         curr_lat, curr_lon = curr["lat"], curr["lon"]

#         # crude distance in degrees
#         dist = abs(curr_lat - prev_lat) + abs(curr_lon - prev_lon)

#         prev_time = datetime.fromisoformat(prev["timestamp"].replace("Z", "+00:00"))
#         curr_time = datetime.fromisoformat(curr["timestamp"].replace("Z", "+00:00"))
#         time_diff = (curr_time - prev_time).total_seconds()

#         if time_diff > 0 and dist / time_diff > 0.01:  # threshold
#             spoof_reason = spoof_reason or "Unrealistic Jump"

#     return spoof_reason

# prev_row = None
# for _, row in df.iterrows():
#     spoof_reason = detect_spoof(prev_row, row)
#     status = "SAFE" if spoof_reason is None else f"SPOOFED ({spoof_reason})"

#     color = "green" if status == "SAFE" else "red"

#     # Marker for each point
#     folium.CircleMarker(
#         location=[row["lat"], row["lon"]],
#         radius=6,
#         color=color,
#         fill=True,
#         fill_color=color,
#         fill_opacity=0.7,
#         tooltip=f"{status}\nTime: {row['timestamp']}\nSat: {row['satellite_id']}"
#     ).add_to(m)

#     # Draw dotted line between points
#     if prev_row is not None:
#         line_color = "green" if status == "SAFE" else "red"
#         folium.PolyLine(
#             locations=[(prev_row["lat"], prev_row["lon"]), (row["lat"], row["lon"])],
#             color=line_color,
#             weight=3,
#             opacity=0.8,
#             dash_array="5, 5"  # dotted line
#         ).add_to(m)

#     prev_row = row

# # Save map
# m.save(OUTPUT_MAP)
# print(f"✅ Map generated from {CSV_FILE} → {OUTPUT_MAP}")


# 4//
import pandas as pd
import folium
from datetime import datetime
import os

# Base CSV filename (original)
BASE_CSV = "data/gps_data.csv"

# Use signed version if exists
signed_csv = BASE_CSV.replace(".csv", "_signed.csv")
CSV_FILE = signed_csv if os.path.exists(signed_csv) else BASE_CSV

# OUTPUT_MAP = CSV_FILE.replace(".csv", "_map.html") --> saves it in data folder

# Save map in the visualization folder
OUTPUT_MAP = os.path.join(
    os.path.dirname(__file__),  # folder of this script → visualization/
    os.path.basename(CSV_FILE).replace(".csv", "_map.html")
)


# Load data
df = pd.read_csv(CSV_FILE)

# Initialize map at first coordinate
m = folium.Map(location=[df.lat[0], df.lon[0]], zoom_start=5)

def detect_spoof(prev, curr):
    spoof_reason = None
    try:
        sat_num = int(curr["satellite_id"][1:])
        if sat_num > 32:
            spoof_reason = "Invalid Satellite ID"
    except:
        spoof_reason = "Malformed Satellite ID"

    if prev is not None:
        prev_lat, prev_lon = prev["lat"], prev["lon"]
        curr_lat, curr_lon = curr["lat"], curr["lon"]
        dist = abs(curr_lat - prev_lat) + abs(curr_lon - prev_lon)
        prev_time = datetime.fromisoformat(prev["timestamp"].replace("Z", "+00:00"))
        curr_time = datetime.fromisoformat(curr["timestamp"].replace("Z", "+00:00"))
        time_diff = (curr_time - prev_time).total_seconds()
        if time_diff > 0 and dist / time_diff > 0.01:
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

    if prev_row is not None:
        line_color = "green" if status == "SAFE" else "red"
        folium.PolyLine(
            locations=[(prev_row["lat"], prev_row["lon"]), (row["lat"], row["lon"])],
            color=line_color,
            weight=3,
            opacity=0.8,
            dash_array="5, 5"
        ).add_to(m)

    prev_row = row

# Save map
m.save(OUTPUT_MAP)
print(f"✅ Map generated from {CSV_FILE} → {OUTPUT_MAP}")
