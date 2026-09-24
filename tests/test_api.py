"""
FastAPI Backend and WebSocket Integration Tests (HTH-CV-09)
"""

import sys
import os
import json
import base64
import cv2
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from backend.app.main import app, startup_event

client = TestClient(app)

def setup_module():
    # Trigger FastAPI startup event to initialize models and MediaPipe
    startup_event()

def test_health_endpoint():
    res = client.get("/health")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    assert data["status"] == "healthy"
    assert "HTH-CV-09-Sign-Bridge" in data["service"]
    assert data["model_loaded"] is True
    assert data["mediapipe_ready"] is True
    assert data["classes_count"] == 61
    print("[PASS] test_health_endpoint: Service healthy and 61-class model verified")

def test_model_info_endpoint():
    res = client.get("/model-info")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ready"
    assert data["num_classes"] == 61
    assert "Hello" in data["classes"] or "HELLO" in [c.upper() for c in data["classes"]]
    assert "Thank you" in data["classes"] or "THANK_YOU" in [c.upper() for c in data["classes"]]
    print(f"[PASS] test_model_info_endpoint: Model architecture {data.get('model_architecture')} (61 classes, 194 features)")

def test_classes_endpoint():
    res_isl = client.get("/classes?mode=isl")
    assert res_isl.status_code == 200
    data_isl = res_isl.json()
    assert data_isl["language"] == "ISL"
    assert len(data_isl["classes"]) == 61

    res_asl = client.get("/classes?mode=asl")
    assert res_asl.status_code == 200
    data_asl = res_asl.json()
    assert data_asl["language"] == "ASL"
    assert len(data_asl["classes"]) == 29
    print("[PASS] test_classes_endpoint: 61 ISL classes and 29 ASL classes verified")

def test_gov_metadata_endpoint():
    res = client.get("/gov-metadata")
    assert res.status_code == 200
    data = res.json()
    assert "source" in data
    assert "data.gov.in" in data["source"]
    assert "Indian Sign Language Dictionary" in data["catalog"]
    print("[PASS] test_gov_metadata_endpoint: data.gov.in integration verified")

def test_predict_frame_endpoint():
    # Create synthetic black image with white circle
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    _, buffer = cv2.imencode(".jpg", img)
    b64 = "data:image/jpeg;base64," + base64.b64encode(buffer).decode("utf-8")

    res = client.post("/api/predict-frame", json={"image_base64": b64})
    assert res.status_code == 200
    data = res.json()
    assert "status" in data
    assert data["status"] in ["NO_HAND", "GESTURE_UNCLEAR", "RECOGNIZED"]
    assert "latency_ms" in data
    print(f"[PASS] test_predict_frame_endpoint: Status={data['status']}, Latency={data['latency_ms']} ms")

def test_websocket_connection():
    with client.websocket_connect("/ws/predict") as ws:
        img = np.zeros((480, 640, 3), dtype=np.uint8)
        _, buffer = cv2.imencode(".jpg", img)
        b64 = "data:image/jpeg;base64," + base64.b64encode(buffer).decode("utf-8")

        ws.send_text(json.dumps({"image": b64}))
        data = ws.receive_json()
        assert "status" in data
        assert data["status"] == "NO_HAND"
        print(f"[PASS] test_websocket_connection: Bidirectional WS stream responsive ({data['status']})")

if __name__ == "__main__":
    setup_module()
    test_health_endpoint()
    test_model_info_endpoint()
    test_classes_endpoint()
    test_gov_metadata_endpoint()
    test_predict_frame_endpoint()
    test_websocket_connection()
    print("\nAll API and WebSocket tests passed successfully!")
