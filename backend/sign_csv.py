# backend/sign_csv.py
import csv
import os
from auth import generate_hmac

DATA_DIR = "data"
CSV_FILES = ["gps_data.csv", "sample_real.csv", "sample_spoofed.csv"]

for filename in CSV_FILES:
    input_path = os.path.join(DATA_DIR, filename)
    output_path = os.path.join(DATA_DIR, f"{filename.split('.')[0]}_signed.csv")

    if not os.path.exists(input_path):
        print(f"❌ File {input_path} not found, skipping...")
        continue

    with open(input_path, newline='') as csvfile:
        reader = csv.DictReader(csvfile)
        rows = list(reader)

    for row in rows:
        message = f"{row['timestamp']},{row['lat']},{row['lon']},{row['satellite_id']}"
        row['signature'] = generate_hmac(message)

    with open(output_path, 'w', newline='') as csvfile:
        fieldnames = ['timestamp','lat','lon','satellite_id','signature']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"✅ Signed CSV saved: {output_path}")
