import folium
import pandas as pd

# Load data
df = pd.read_csv("../data/gps_data.csv")

# Create map centered at first point
m = folium.Map(location=[df.lat[0], df.lon[0]], zoom_start=5)

# Plot points
for i, row in df.iterrows():
    color = "red" if i == 3 else "green"  # spoofed example at index 3
    folium.Marker(
        [row.lat, row.lon],
        popup=f"{row.time}",
        icon=folium.Icon(color=color)
    ).add_to(m)

m.save("output_map.html")
print("Map saved as output_map.html")
