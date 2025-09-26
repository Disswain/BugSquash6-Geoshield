import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier

# Classes: 0=SAFE, 1=SPOOFED, 2=JAMMED
X, y = [], []

# ---------------- SAFE samples ----------------
# Healthy or slightly degraded, but NO spoof offset or time offset
for _ in range(1000):
    lat = np.random.uniform(-90, 90)
    lon = np.random.uniform(-180, 180)
    speed = np.random.uniform(450, 900)         # normal flight
    health = np.random.uniform(50, 100)         # SAFE even with mid health
    link = np.random.uniform(30, 100)           # SAFE even with weaker link
    spoof_offset = np.random.uniform(0, 1)      # almost zero
    time_offset = 0
    X.append([lat, lon, speed, health, link, spoof_offset, time_offset])
    y.append(0)

# Extra SAFE cases (perfect health + strong link)
for _ in range(500):
    lat = np.random.uniform(-90, 90)
    lon = np.random.uniform(-180, 180)
    speed = np.random.uniform(450, 900)
    health = 100.0                              # perfect health
    link = np.random.uniform(95, 100)           # very strong link
    spoof_offset = np.random.uniform(0, 0.3)    # almost zero
    time_offset = 0
    X.append([lat, lon, speed, health, link, spoof_offset, time_offset])
    y.append(0)

# ---------------- SPOOFED samples ----------------
# Looks healthy but offset/time are abnormal
for _ in range(1000):
    lat = np.random.uniform(-90, 90)
    lon = np.random.uniform(-180, 180)
    speed = np.random.uniform(400, 850)
    health = np.random.uniform(70, 100)          # spoof can look normal
    link = np.random.uniform(70, 100)            # signal still good
    spoof_offset = np.random.uniform(8, 50)      # strong offset
    time_offset = np.random.uniform(5, 20)       # delayed signal
    X.append([lat, lon, speed, health, link, spoof_offset, time_offset])
    y.append(1)

# ---------------- JAMMED samples ----------------
# Signal collapse, low health + link, no spoof
for _ in range(1000):
    lat = np.random.uniform(-90, 90)
    lon = np.random.uniform(-180, 180)
    speed = np.random.uniform(350, 700)
    health = np.random.uniform(10, 60)           # weak health
    link = np.random.uniform(0, 25)              # very weak link
    spoof_offset = np.random.uniform(0, 2)       # not spoofed
    time_offset = 0
    X.append([lat, lon, speed, health, link, spoof_offset, time_offset])
    y.append(2)

# ---------------- Train model ----------------
clf = RandomForestClassifier(
    n_estimators=400,
    max_depth=12,
    random_state=42,
    class_weight="balanced_subsample"
)
clf.fit(X, y)

# Save model
joblib.dump(clf, "ai_model.pkl")
print("✅ Updated AI model trained and saved as ai_model.pkl (with strong SAFE signals learned)")
