"""
MediaPipe Landmark Extraction Pipeline for HTH-CV-09
Extracts 21 3D hand landmarks from video clips using Google MediaPipe Tasks API.
Supports group-aware session tagging to prevent data leakage during train/test splits.
"""

import os
import glob
import json
import time
import cv2
import yaml
import numpy as np
from tqdm import tqdm

import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

def init_landmarker(model_path="models/hand_landmarker.task", num_hands=2):
    base_options = python.BaseOptions(model_asset_path=model_path)
    options = vision.HandLandmarkerOptions(
        base_options=base_options,
        num_hands=num_hands,
        min_hand_detection_confidence=0.5,
        min_hand_presence_confidence=0.5,
        min_tracking_confidence=0.5,
        running_mode=vision.RunningMode.IMAGE
    )
    return vision.HandLandmarker.create_from_options(options)

def extract_landmarks_from_video(video_path, landmarker, max_frames=12, margin=0.15):
    """
    Extracts hand landmarks from evenly spaced frames within the steady-state window.
    Returns list of dicts: [{'frame_idx': i, 'hands': [list_of_21x3]}]
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return []

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if total_frames < 5:
        cap.release()
        return []

    start_idx = int(total_frames * margin)
    end_idx = max(start_idx + 1, int(total_frames * (1.0 - margin)))
    
    indices = np.linspace(start_idx, end_idx - 1, min(max_frames, end_idx - start_idx), dtype=int)
    
    extracted = []
    current_frame = 0
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        if current_frame in indices:
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
            
            try:
                res = landmarker.detect(mp_image)
                hands = []
                if res.hand_landmarks:
                    for hl in res.hand_landmarks:
                        pts = [[lm.x, lm.y, lm.z] for lm in hl]
                        hands.append(pts)
                
                # Only record if at least one hand is detected
                if len(hands) > 0:
                    extracted.append({
                        "frame_idx": int(current_frame),
                        "hands": hands
                    })
            except Exception as e:
                pass
                
        current_frame += 1
        if current_frame > indices[-1]:
            break

    cap.release()
    return extracted

def get_recording_id(filepath):
    """
    Derives unique base recording ID to group original & tilted videos into the same split.
    Example: WIN_20231103_13_22_45_Pro_left_tilt.mp4 -> WIN_20231103_13_22_45_Pro
    """
    base = os.path.basename(filepath)
    base = base.replace("_left_tilt.mp4", "").replace("_right_tilt.mp4", "").replace(".mp4", "")
    return base

def run_extraction(config_path="config/dataset_config.yaml", limit_per_class=None):
    with open(config_path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    with open("config/vocabulary.json", "r", encoding="utf-8") as f:
        vocab = json.load(f)

    label_to_id = {c["label"]: c["id"] for c in vocab["classes"]}
    mapping = cfg.get("class_directory_mapping", {})
    
    model_path = cfg.get("paths", {}).get("models_dir", "models") + "/hand_landmarker.task"
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"MediaPipe task model not found at {model_path}")
        
    print(f"Initializing MediaPipe HandLandmarker from {model_path}...")
    landmarker = init_landmarker(model_path)
    
    out_dir = cfg.get("paths", {}).get("landmarks_dir", "datasets/landmarks")
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "extracted_dataset.json")

    all_samples = []
    summary = {}
    
    print("\nStarting video landmark extraction across 16 target classes...")
    start_time = time.time()
    
    for label, dirs in mapping.items():
        class_id = label_to_id.get(label)
        if class_id is None:
            print(f"Warning: Label {label} not in vocabulary. Skipping.")
            continue
            
        video_files = []
        for d in dirs:
            norm_d = os.path.normpath(d)
            vids = glob.glob(os.path.join(norm_d, "*.mp4"))
            video_files.extend(vids)
            
        if limit_per_class:
            video_files = video_files[:limit_per_class]
            
        print(f"\nProcessing class [{label}] (ID: {class_id}): {len(video_files)} videos found")
        class_samples = 0
        
        for vpath in tqdm(video_files, desc=f"Extracting {label}"):
            rec_id = get_recording_id(vpath)
            extracted = extract_landmarks_from_video(vpath, landmarker, max_frames=cfg["sampling"]["frames_per_video"])
            
            for item in extracted:
                sample = {
                    "label": label,
                    "class_id": class_id,
                    "recording_id": rec_id,
                    "video_path": os.path.basename(vpath),
                    "frame_idx": item["frame_idx"],
                    "hands": item["hands"]
                }
                all_samples.append(sample)
                class_samples += 1
                
        summary[label] = {
            "videos": len(video_files),
            "samples": class_samples
        }
        print(f"  --> Extracted {class_samples} valid hand landmark samples for {label}")

    elapsed = time.time() - start_time
    print(f"\nExtraction complete in {elapsed:.1f}s. Total samples collected: {len(all_samples)}")
    
    print(f"Saving extracted dataset to {out_file}...")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(all_samples, f)
        
    summary_file = os.path.join(out_dir, "extraction_summary.json")
    with open(summary_file, "w", encoding="utf-8") as f:
        json.dump({
            "total_samples": len(all_samples),
            "elapsed_seconds": round(elapsed, 1),
            "classes": summary
        }, f, indent=2)
        
    print(f"Extraction summary written to {summary_file}")
    return len(all_samples)

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None, help="Limit videos per class for fast testing")
    args = parser.parse_args()
    run_extraction(limit_per_class=args.limit)
