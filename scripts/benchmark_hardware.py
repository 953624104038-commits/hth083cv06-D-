import os
import sys
import platform
import time
import psutil
import pickle
import numpy as np
import cv2

print("=== SYSTEM HARDWARE INSPECTION ===")
print("OS:", platform.system(), platform.release(), platform.version())
print("Machine:", platform.machine(), platform.processor())
print("Python:", sys.version.split()[0])

cpu_count_physical = psutil.cpu_count(logical=False)
cpu_count_logical = psutil.cpu_count(logical=True)
cpu_freq = psutil.cpu_freq()
print(f"CPU Cores: {cpu_count_physical} physical, {cpu_count_logical} logical")
if cpu_freq:
    print(f"CPU Frequency: {cpu_freq.current:.1f} MHz (Max: {cpu_freq.max:.1f} MHz)")

mem = psutil.virtual_memory()
print(f"RAM: Total {mem.total / (1024**3):.2f} GB, Available {mem.available / (1024**3):.2f} GB ({mem.percent}% used)")

# Check GPU via OpenCV or WMI
try:
    import subprocess
    cmd = "powershell -Command \"Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name\""
    gpus = subprocess.check_output(cmd, shell=True, text=True).strip().splitlines()
    print("GPUs detected:", [g.strip() for g in gpus if g.strip()])
except Exception as e:
    print("GPU detection error:", e)

# Test MediaPipe support
try:
    import mediapipe as mp
    print("MediaPipe Version:", mp.__version__)
    from mediapipe.tasks import python
    from mediapipe.tasks.python import vision
    
    # Check GPU delegate support in MediaPipe Tasks
    print("Testing MediaPipe HandLandmarker with CPU vs GPU delegate...")
    base_cpu = python.BaseOptions(model_asset_path="models/hand_landmarker.task", delegate=python.BaseOptions.Delegate.CPU)
    opt_cpu = vision.HandLandmarkerOptions(base_options=base_cpu, num_hands=2, running_mode=vision.RunningMode.IMAGE)
    detector_cpu = vision.HandLandmarker.create_from_options(opt_cpu)
    print("MediaPipe CPU Delegate: initialized successfully.")
    
    gpu_supported = False
    try:
        base_gpu = python.BaseOptions(model_asset_path="models/hand_landmarker.task", delegate=python.BaseOptions.Delegate.GPU)
        opt_gpu = vision.HandLandmarkerOptions(base_options=base_gpu, num_hands=2, running_mode=vision.RunningMode.IMAGE)
        detector_gpu = vision.HandLandmarker.create_from_options(opt_gpu)
        gpu_supported = True
        print("MediaPipe GPU Delegate: initialized successfully!")
    except Exception as egpu:
        print(f"MediaPipe GPU Delegate not available on this configuration ({egpu}). CPU delegate will be used.")
except Exception as e:
    print("MediaPipe test error:", e)

# Benchmark current baseline inference speed
print("\n=== CURRENT BASELINE LATENCY BENCHMARK ===")
# 1. Dummy Frame creation
dummy_frame = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)

# 2. Benchmark JPEG encode/decode (Base64 path)
t0 = time.perf_counter()
N = 50
for _ in range(N):
    _, buf = cv2.imencode(".jpg", dummy_frame, [cv2.IMWRITE_JPEG_QUALITY, 65])
    _ = cv2.imdecode(buf, cv2.IMREAD_COLOR)
t_jpeg = (time.perf_counter() - t0) / N * 1000.0
print(f"JPEG encode + decode (640x480): {t_jpeg:.2f} ms")

# 3. MediaPipe IMAGE mode detection latency
mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(dummy_frame, cv2.COLOR_BGR2RGB))
# Warmup
detector_cpu.detect(mp_img)
t0 = time.perf_counter()
N_mp = 20
for _ in range(N_mp):
    _ = detector_cpu.detect(mp_img)
t_mp_image = (time.perf_counter() - t0) / N_mp * 1000.0
print(f"MediaPipe IMAGE mode detect: {t_mp_image:.2f} ms")

# 4. MediaPipe VIDEO mode detection latency
opt_video = vision.HandLandmarkerOptions(
    base_options=base_cpu,
    num_hands=2,
    running_mode=vision.RunningMode.VIDEO
)
detector_video = vision.HandLandmarker.create_from_options(opt_video)
# Warmup
detector_video.detect_for_video(mp_img, 1)
t0 = time.perf_counter()
for i in range(N_mp):
    _ = detector_video.detect_for_video(mp_img, 10 + i * 33)
t_mp_video = (time.perf_counter() - t0) / N_mp * 1000.0
print(f"MediaPipe VIDEO mode detect: {t_mp_video:.2f} ms (Speedup: {t_mp_image / t_mp_video:.2f}x)")

# 5. Model Inference Latency
with open("models/isl_words_model.pkl", "rb") as f:
    isl_model = pickle.load(f)
if hasattr(isl_model, "n_jobs"):
    isl_model.n_jobs = 1

dummy_feat = np.random.normal(0, 1, (1, 194)).astype(np.float32)
# Warmup
isl_model.predict_proba(dummy_feat)
t0 = time.perf_counter()
N_rf = 50
for _ in range(N_rf):
    _ = isl_model.predict_proba(dummy_feat)
t_rf = (time.perf_counter() - t0) / N_rf * 1000.0
print(f"RandomForest 61-class predict_proba: {t_rf:.2f} ms")

print("\nBenchmark complete.")
