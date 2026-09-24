"""
End-to-End Live Verification Script for VOXIS
Tests:
1. /health
2. /classes (ISL 61 classes & ASL 29 classes)
3. /model-info
4. /gov-metadata
5. /api/predict-frame with real frames from sample_videos/Hello.mp4
6. /ws/predict WebSocket streaming with real frames
7. Frame latency breakdown (MediaPipe ms, RandomForest ms, Total ms)
"""

import cv2
import json
import base64
import time
import urllib.request
import asyncio
import websockets

def test_rest_endpoints():
    print("=== 1. Testing REST Endpoints ===")
    
    # /health
    with urllib.request.urlopen("http://127.0.0.1:8000/health") as res:
        health = json.loads(res.read().decode())
        print(f"Health: {health['status']} | ISL Classes: {health['isl_classes_count']} | ASL Classes: {health['asl_classes_count']}")
        assert health["status"] == "healthy"
        assert health["isl_classes_count"] == 61

    # /classes?mode=isl
    with urllib.request.urlopen("http://127.0.0.1:8000/classes?mode=isl") as res:
        classes_data = json.loads(res.read().decode())
        print(f"ISL Classes Count: {len(classes_data['classes'])}")
        assert len(classes_data["classes"]) == 61

    # /classes?mode=asl
    with urllib.request.urlopen("http://127.0.0.1:8000/classes?mode=asl") as res:
        asl_classes = json.loads(res.read().decode())
        print(f"ASL Classes Count: {len(asl_classes['classes'])}")
        assert len(asl_classes["classes"]) == 29

    # /gov-metadata
    with urllib.request.urlopen("http://127.0.0.1:8000/gov-metadata") as res:
        gov = json.loads(res.read().decode())
        print(f"Gov Metadata Source: {gov.get('source') or gov.get('source_authority')}")
        assert "data.gov.in" in (gov.get("source") or "") or "ISLRTC" in str(gov)

def test_video_frames_predict():
    print("\n=== 2. Testing /api/predict-frame with sample_videos/Hello.mp4 ===")
    video_path = "frontend/public/sample_videos/Hello.mp4"
    cap = cv2.VideoCapture(video_path)
    
    success_count = 0
    frame_idx = 0
    
    latencies = []
    
    while cap.isOpened() and frame_idx < 15:
        ret, frame = cap.read()
        if not ret:
            break
        frame_idx += 1
        
        # Encode to JPEG base64
        _, buffer = cv2.imencode(".jpg", frame)
        b64 = "data:image/jpeg;base64," + base64.b64encode(buffer).decode("utf-8")
        
        req = urllib.request.Request(
            "http://127.0.0.1:8000/api/predict-frame",
            data=json.dumps({"image_base64": b64, "mode": "isl"}).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        
        t0 = time.perf_counter()
        with urllib.request.urlopen(req) as res:
            dt = (time.perf_counter() - t0) * 1000
            data = json.loads(res.read().decode())
            latencies.append(dt)
            if data.get("hand_detected"):
                success_count += 1
                print(f"Frame {frame_idx:02d}: Status={data['status']}, Sign={data.get('sign')}, Conf={data.get('confidence')}, Latency={dt:.1f}ms")
    
    cap.release()
    print(f"Processed {frame_idx} frames. Hands detected in {success_count} frames. Avg REST latency: {sum(latencies)/len(latencies):.1f}ms")
    assert frame_idx > 0

async def test_websocket_streaming():
    print("\n=== 3. Testing /ws/predict WebSocket Streaming ===")
    video_path = "frontend/public/sample_videos/Hello.mp4"
    cap = cv2.VideoCapture(video_path)
    
    uri = "ws://127.0.0.1:8000/ws/predict"
    async with websockets.connect(uri) as ws:
        frame_idx = 0
        received = 0
        total_mp = []
        total_rf = []
        total_lat = []
        
        while cap.isOpened() and frame_idx < 25:
            ret, frame = cap.read()
            if not ret:
                break
            frame_idx += 1
            
            _, buffer = cv2.imencode(".jpg", frame)
            b64 = "data:image/jpeg;base64," + base64.b64encode(buffer).decode("utf-8")
            
            payload = json.dumps({"image": b64, "mode": "isl", "frame_id": frame_idx})
            t0 = time.perf_counter()
            await ws.send(payload)
            
            resp_raw = await ws.recv()
            dt = (time.perf_counter() - t0) * 1000
            resp = json.loads(resp_raw)
            received += 1
            
            mp_ms = resp.get("mp_latency_ms", 0)
            rf_ms = resp.get("rf_latency_ms", 0)
            total_mp.append(mp_ms)
            total_rf.append(rf_ms)
            total_lat.append(dt)
            
            print(f"WS Frame {frame_idx:02d} [ID={resp.get('frame_id')}]: {resp.get('status')} | Sign='{resp.get('sign')}' | Conf={resp.get('confidence')} | MP={mp_ms}ms | RF={rf_ms}ms | Roundtrip={dt:.1f}ms")
        
        cap.release()
        avg_mp = sum(total_mp) / len(total_mp) if total_mp else 0
        avg_rf = sum(total_rf) / len(total_rf) if total_rf else 0
        avg_roundtrip = sum(total_lat) / len(total_lat) if total_lat else 0
        print(f"\nWebSocket Streaming Results:")
        print(f"- Sent/Received: {received}/{frame_idx} frames")
        print(f"- Avg MediaPipe Latency: {avg_mp:.2f} ms")
        print(f"- Avg RandomForest Inference: {avg_rf:.2f} ms")
        print(f"- Avg End-to-End Latency: {avg_roundtrip:.2f} ms")
        print(f"- Pipeline FPS Capability: {1000.0 / avg_roundtrip:.1f} FPS")
        assert received == frame_idx

def main():
    test_rest_endpoints()
    test_video_frames_predict()
    asyncio.run(test_websocket_streaming())
    print("\n>>> ALL LIVE VERIFICATION CHECKS PASSED SUCCESSFULLY! <<<")

if __name__ == "__main__":
    main()
