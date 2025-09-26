import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier

# Classes: 0=SAFE, 1=SPOOFED, 2=JAMMED
X, y = [], []

# ---------------- SAFE samples ----------------
# realistic speeds and ETA values
for _ in range(1000):
    lat = np.random.uniform(-90, 90)
    lon = np.random.uniform(-180, 180)
    speed = np.random.uniform(400, 950)       # normal speed km/h
    eta = np.random.uniform(30, 600)          # 30s – 10min ETA
    X.append([lat, lon, speed, eta])
    y.append(0)

# ---------------- SPOOFED samples ----------------
# unrealistic speed or ETA mismatch
for _ in range(800):
    lat = np.random.uniform(-90, 90)
    lon = np.random.uniform(-180, 180)
    speed = np.random.choice([
        np.random.uniform(1500, 5000),   # way too fast
        np.random.uniform(50, 200)       # way too slow
    ])
    eta = np.random.choice([
        np.random.uniform(1, 5),         # absurdly short
        np.random.uniform(5000, 20000)   # absurdly long
    ])
    X.append([lat, lon, speed, eta])
    y.append(1)

# ---------------- JAMMED samples ----------------
# plane barely moving, ETA too long
for _ in range(800):
    lat = np.random.uniform(-90, 90)
    lon = np.random.uniform(-180, 180)
    speed = np.random.uniform(0, 100)        # very slow / stuck
    eta = np.random.uniform(1000, 20000)     # extremely long ETA
    X.append([lat, lon, speed, eta])
    y.append(2)

# ---------------- Train model ----------------
clf = RandomForestClassifier(
    n_estimators=300,
    max_depth=10,
    random_state=42,
    class_weight="balanced"
)
clf.fit(X, y)

# Save model
joblib.dump(clf, "ai_planes.pkl")
print("✅ Plane AI model trained and saved as ai_planes.pkl")
