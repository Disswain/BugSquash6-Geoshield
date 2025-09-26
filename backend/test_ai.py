import joblib
import numpy as np

# Load the trained model
clf = joblib.load("ai_model.pkl")

def test_case(name, features):
    pred = clf.predict([features])[0]
    proba = clf.predict_proba([features])[0]
    classes = ["SAFE", "SPOOFED", "JAMMED"]
    print(f"\n▶️ {name} | Input: {features}")
    print(f"Prediction: {classes[pred]} ({pred})")
    print(f"Probabilities: {proba.round(3)}")

# ---------------- Manual Test Cases ----------------

# Normal SAFE plane: strong health + link, no spoof
test_case("SAFE case", [10, 20, 600, 95, 90, 0.2, 0])

# Extra SAFE case: perfect health + very strong link
test_case("SAFE (perfect health/link)", [12, 22, 650, 100, 98, 0.1, 0])

# Spoofed satellite: healthy but spoof offset/time abnormal
test_case("SPOOFED case", [15, 25, 700, 85, 80, 20, 10])

# Jammed signal: weak health + collapsed link
test_case("JAMMED case", [5, 10, 500, 30, 5, 0.5, 0])


# ---------------- Stress Test (optional) ----------------
def stress_test(n=100):
    classes = ["SAFE", "SPOOFED", "JAMMED"]
    correct = {c: 0 for c in classes}

    for cls in range(3):
        for _ in range(n):
            if cls == 0:  # SAFE
                sample = [
                    np.random.uniform(-90, 90),
                    np.random.uniform(-180, 180),
                    np.random.uniform(450, 900),
                    np.random.uniform(50, 100),
                    np.random.uniform(30, 100),
                    np.random.uniform(0, 1),
                    0,
                ]
            elif cls == 1:  # SPOOFED
                sample = [
                    np.random.uniform(-90, 90),
                    np.random.uniform(-180, 180),
                    np.random.uniform(400, 850),
                    np.random.uniform(70, 100),
                    np.random.uniform(70, 100),
                    np.random.uniform(8, 50),
                    np.random.uniform(5, 20),
                ]
            else:  # JAMMED
                sample = [
                    np.random.uniform(-90, 90),
                    np.random.uniform(-180, 180),
                    np.random.uniform(350, 700),
                    np.random.uniform(10, 60),
                    np.random.uniform(0, 25),
                    np.random.uniform(0, 2),
                    0,
                ]

            pred = clf.predict([sample])[0]
            if pred == cls:
                correct[classes[cls]] += 1

    print("\n📊 Stress Test Results:")
    for c in classes:
        acc = correct[c] / n * 100
        print(f"{c}: {acc:.1f}% accurate over {n} samples")

# Run stress test
stress_test(100)
