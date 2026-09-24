"""
Model and Inference Engine Validation Tests (HTH-CV-09)
"""

import sys
import os
import json
import time
import pickle
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.cv.smoother import TemporalSmoother

def test_model_loading_and_prediction():
    model_path = "models/isl_words_model.pkl"
    encoder_path = "models/isl_label_encoder.pkl"
    meta_path = "models/isl_metadata.json"

    assert os.path.exists(model_path), f"Missing {model_path}"
    assert os.path.exists(encoder_path), f"Missing {encoder_path}"
    assert os.path.exists(meta_path), f"Missing {meta_path}"

    with open(model_path, "rb") as f:
        model = pickle.load(f)
    with open(encoder_path, "rb") as f:
        encoder = pickle.load(f)
    with open(meta_path, "r", encoding="utf-8") as f:
        meta = json.load(f)

    classes = list(encoder.classes_)
    assert len(classes) == 61, f"Expected 61 classes, got {len(classes)}"
    print(f"[PASS] test_model_loading: Model loaded ({meta.get('model_architecture')}, 61 classes)")

    # Test single-sample inference latency with 194 features
    if hasattr(model, "n_jobs"):
        model.n_jobs = 1
    dummy_feat = np.random.normal(0, 1, (1, 194)).astype(np.float32)
    
    t0 = time.time()
    for _ in range(30):
        probs = model.predict_proba(dummy_feat)[0]
    elapsed_ms = (time.time() - t0) / 30.0 * 1000.0

    assert probs.shape == (61,), f"Expected 61 class probabilities, got {probs.shape}"
    assert abs(np.sum(probs) - 1.0) < 1e-4, "Probabilities must sum to 1.0"
    assert elapsed_ms < 60.0, f"Inference latency too slow: {elapsed_ms:.2f} ms"
    print(f"[PASS] test_inference_speed: {elapsed_ms:.3f} ms per sample (< 60 ms)")


def test_asl_model_loading():
    model_path = "models/asl_alphabet_model.pkl"
    encoder_path = "models/asl_label_encoder.pkl"
    meta_path = "models/asl_metadata.json"

    assert os.path.exists(model_path), f"Missing {model_path}"
    assert os.path.exists(encoder_path), f"Missing {encoder_path}"

    with open(model_path, "rb") as f:
        model = pickle.load(f)
    with open(encoder_path, "rb") as f:
        encoder = pickle.load(f)

    classes = list(encoder.classes_)
    assert len(classes) == 29, f"Expected 29 classes, got {len(classes)}"

    if hasattr(model, "n_jobs"):
        model.n_jobs = 1
    dummy_feat = np.random.normal(0, 1, (1, 93)).astype(np.float32)
    probs = model.predict_proba(dummy_feat)[0]
    assert probs.shape == (29,)
    print(f"[PASS] test_asl_model_loading: ASL Alphabet model loaded (29 classes, 93 features)")

def test_smoother_behavior():
    smoother = TemporalSmoother(window_size=7, confidence_threshold=0.65, min_stable_count=4)

    # 1. Test NO_HAND
    res0 = smoother.process("HELLO", 0.0, 0)
    assert res0["status"] == "NO_HAND"
    assert res0["hand_detected"] is False
    assert res0["stable"] is False

    # 2. Test GESTURE_UNCLEAR (low confidence)
    res_low = smoother.process("HELLO", 0.35, 1)
    assert res_low["status"] == "GESTURE_UNCLEAR"
    assert res_low["hand_detected"] is True

    # 3. Test stabilization over consecutive frames
    for i in range(3):
        res = smoother.process("THANK_YOU", 0.92, 2)
        # Not yet stable until min_stable_count is reached
    
    res_stable = smoother.process("THANK_YOU", 0.92, 2)
    assert res_stable["status"] == "RECOGNIZED"
    assert res_stable["sign"] == "THANK_YOU"
    assert res_stable["stable"] is True
    print("[PASS] test_smoother_behavior (NO_HAND, GESTURE_UNCLEAR, and STABLE transitions verified)")

if __name__ == "__main__":
    test_model_loading_and_prediction()
    test_smoother_behavior()
    print("\nAll model and smoother validation tests passed successfully!")
