import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier

# ---- Synthetic Training Data ----
# Features: [health, link, speed_dev, offset, time_offset]
X = []
y = []

# SAFE samples
for _ in range(200):
    X.append([np.random.uniform(80, 100), np.random.uniform(80, 100),
              np.random.uniform(0, 50), np.random.uniform(0, 0.01),
              np.random.uniform(0, 2)])
    y.append("SAFE")

# JAMMED samples
for _ in range(200):
    X.append([np.random.uniform(40, 80), np.random.uniform(0, 40),
              np.random.uniform(0, 50), np.random.uniform(0, 0.01),
              np.random.uniform(0, 2)])
    y.append("JAMMED")

# SPOOFED samples
for _ in range(200):
    X.append([np.random.uniform(70, 100), np.random.uniform(50, 100),
              np.random.uniform(300000, 600000),
              np.random.uniform(0.05, 2),
              np.random.uniform(5, 30)])
    y.append("SPOOFED")

X = np.array(X)
y = np.array(y)

# ---- Train Model ----
clf = RandomForestClassifier(n_estimators=100, random_state=42)
clf.fit(X, y)

# Save model in backend directory
joblib.dump(clf, "ai_model.pkl")
print("✅ AI Model trained and saved to ai_model.pkl")
