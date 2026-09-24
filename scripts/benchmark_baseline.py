import os
import sys
import time
import json
import ctypes

class MEMORYSTATUSEX(ctypes.Structure):
    _fields_ = [
        ("dwLength", ctypes.c_ulong),
        ("dwMemoryLoad", ctypes.c_ulong),
        ("ullTotalPhys", ctypes.c_ulonglong),
        ("ullAvailPhys", ctypes.c_ulonglong),
        ("ullTotalPageFile", ctypes.c_ulonglong),
        ("ullAvailPageFile", ctypes.c_ulonglong),
        ("ullTotalVirtual", ctypes.c_ulonglong),
        ("ullAvailVirtual", ctypes.c_ulonglong),
        ("sullAvailExtendedVirtual", ctypes.c_ulonglong),
    ]
import numpy as np
import cv2
import pickle

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.cv.landmarker import HandLandmarkerEngine
from backend.app.cv.features import extract_features_from_mediapipe_result, extract_single_hand_features
from backend.app.cv.smoother import TemporalSmoother

def benchmark():
    stat = MEMORYSTATUSEX()
    stat.dwLength = ctypes.sizeof(MEMORYSTATUSEX)
    ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(stat))
    total_ram_gb = round(stat.ullTotalPhys / (1024**3), 2)
    avail_ram_gb = round(stat.ullAvailPhys / (1024**3), 2)
    print(f"--- HARDWARE SPECS ---")
    print(f"CPU: 13th Gen Intel Core i7-13700H (14 cores, 20 logical threads)")
    print(f"Total RAM: {total_ram_gb} GB (Available: {avail_ram_gb} GB)")
    print(f"Python: {sys.version.split()[0]}")
    
    # 1. MediaPipe Landmarker benchmark (IMAGE mode)
    print("\n--- BENCHMARKING MEDIAPIPE (IMAGE MODE) ---")
    engine_img = HandLandmarkerEngine("models/hand_landmarker.task", num_hands=2)
    
    # Create test frames of different resolutions
    res_list = [(640, 480), (480, 360), (320, 240)]
    results = {}
    
    for w, h in res_list:
        test_frame = np.zeros((h, w, 3), dtype=np.uint8)
        # Draw a synthetic hand-like shape so mediapipe has real pixels to process
        cv2.circle(test_frame, (w//2, h//2), 60, (200, 180, 160), -1)
        
        # Warmup
        for _ in range(5):
            _ = engine_img.detect_frame(test_frame)
            
        times = []
        for _ in range(30):
            t0 = time.perf_counter()
            _ = engine_img.detect_frame(test_frame)
            times.append((time.perf_counter() - t0) * 1000.0)
            
        avg_t = np.mean(times)
        p95_t = np.percentile(times, 95)
        print(f"Resolution {w}x{h}: Mean={avg_t:.2f}ms, P95={p95_t:.2f}ms (FPS equiv: {1000/avg_t:.1f})")
        results[f"mediapipe_image_{w}x{h}"] = {"mean_ms": avg_t, "p95_ms": p95_t}

    # 2. Test MediaPipe in VIDEO mode
    print("\n--- BENCHMARKING MEDIAPIPE (VIDEO MODE) ---")
    import mediapipe as mp
    from mediapipe.tasks import python
    from mediapipe.tasks.python import vision
    
    base_options = python.BaseOptions(model_asset_path="models/hand_landmarker.task")
    options_video = vision.HandLandmarkerOptions(
        base_options=base_options,
        num_hands=2,
        min_hand_detection_confidence=0.5,
        min_hand_presence_confidence=0.5,
        min_tracking_confidence=0.5,
        running_mode=vision.RunningMode.VIDEO
    )
    detector_video = vision.HandLandmarker.create_from_options(options_video)
    
    frame_ts = int(time.time() * 1000)
    for w, h in res_list:
        test_frame = np.zeros((h, w, 3), dtype=np.uint8)
        cv2.circle(test_frame, (w//2, h//2), 60, (200, 180, 160), -1)
        rgb_frame = cv2.cvtColor(test_frame, cv2.COLOR_BGR2RGB)
        
        # Warmup
        for i in range(5):
            frame_ts += 33
            mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
            _ = detector_video.detect_for_video(mp_img, frame_ts)
            
        times = []
        for i in range(30):
            frame_ts += 33
            t0 = time.perf_counter()
            mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
            _ = detector_video.detect_for_video(mp_img, frame_ts)
            times.append((time.perf_counter() - t0) * 1000.0)
            
        avg_t = np.mean(times)
        p95_t = np.percentile(times, 95)
        print(f"VIDEO MODE {w}x{h}: Mean={avg_t:.2f}ms, P95={p95_t:.2f}ms (FPS equiv: {1000/avg_t:.1f})")
        results[f"mediapipe_video_{w}x{h}"] = {"mean_ms": avg_t, "p95_ms": p95_t}

    # 3. Feature Extraction Benchmark
    print("\n--- BENCHMARKING FEATURE EXTRACTION ---")
    dummy_hand = np.random.uniform(0.1, 0.9, size=(21, 3)).astype(np.float32)
    times_single = []
    for _ in range(100):
        t0 = time.perf_counter()
        _ = extract_single_hand_features(dummy_hand)
        times_single.append((time.perf_counter() - t0) * 1000.0)
    print(f"Single Hand Features (93-dim): Mean={np.mean(times_single):.3f}ms")
    
    # 4. Model Inference Benchmark (ISL 61 classes & ASL 29 classes)
    print("\n--- BENCHMARKING MODEL INFERENCE ---")
    with open("models/isl_words_model.pkl", "rb") as f:
        isl_model = pickle.load(f)
    with open("models/asl_alphabet_model.pkl", "rb") as f:
        asl_model = pickle.load(f)
        
    dummy_feat_194 = np.random.uniform(0, 1, (1, 194)).astype(np.float32)
    dummy_feat_93 = np.random.uniform(0, 1, (1, 93)).astype(np.float32)
    
    # Test with n_jobs=1 vs n_jobs=-1
    for nj in [1, 2, 4]:
        isl_model.n_jobs = nj
        times_isl = []
        for _ in range(50):
            t0 = time.perf_counter()
            _ = isl_model.predict_proba(dummy_feat_194)
            times_isl.append((time.perf_counter() - t0) * 1000.0)
        print(f"ISL RandomForest (160 trees, 61 classes, n_jobs={nj}): Mean={np.mean(times_isl):.2f}ms, P95={np.percentile(times_isl, 95):.2f}ms")

    asl_model.n_jobs = 1
    times_asl = []
    for _ in range(50):
        t0 = time.perf_counter()
        _ = asl_model.predict_proba(dummy_feat_93)
        times_asl.append((time.perf_counter() - t0) * 1000.0)
    print(f"ASL RandomForest (n_jobs=1): Mean={np.mean(times_asl):.2f}ms")

    # 5. Smoother benchmark
    print("\n--- BENCHMARKING SMOOTHER ---")
    smoother = TemporalSmoother(window_size=5)
    times_smooth = []
    for _ in range(100):
        t0 = time.perf_counter()
        _ = smoother.process("Hello", 0.95, 1)
        times_smooth.append((time.perf_counter() - t0) * 1000.0)
    print(f"Smoother: Mean={np.mean(times_smooth):.4f}ms")
    
    # 6. Check GPU delegate support in MediaPipe Python
    print("\n--- CHECKING MEDIAPIPE GPU DELEGATE SUPPORT ---")
    try:
        from mediapipe.tasks.python.core.base_options import BaseOptions
        gpu_base = BaseOptions(model_asset_path="models/hand_landmarker.task", delegate=BaseOptions.Delegate.GPU)
        gpu_options = vision.HandLandmarkerOptions(base_options=gpu_base, num_hands=2)
        gpu_detector = vision.HandLandmarker.create_from_options(gpu_options)
        print("MediaPipe GPU delegate: SUCCESSFUL")
    except Exception as e:
        print(f"MediaPipe GPU delegate NOT supported/fallback: {e}")

if __name__ == "__main__":
    benchmark()
