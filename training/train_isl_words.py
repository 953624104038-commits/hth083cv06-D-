"""
Full 61-Class ISL Word Gesture Recognition Training Pipeline (HTH-CV-09)
Extracts dual-hand landmarks from all 61 classes in Video_Dataset.
Supports left/right hand invariance, relative positioning, and deterministic ordering.
Trains Random Forest & MLP classifiers and exports models with provenance.
"""

import os
import sys
import glob
import json
import time
import pickle
import cv2
import numpy as np
import yaml
from tqdm import tqdm
from sklearn.ensemble import RandomForestClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, balanced_accuracy_score, f1_score

import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from training.preprocess import extract_dual_hand_features, DUAL_HAND_FEAT_DIM

def init_landmarker(model_path="models/hand_landmarker.task"):
    base_options = python.BaseOptions(model_asset_path=model_path)
    options = vision.HandLandmarkerOptions(
        base_options=base_options,
        num_hands=2,
        min_hand_detection_confidence=0.25,
        min_hand_presence_confidence=0.25,
        running_mode=vision.RunningMode.IMAGE
    )
    return vision.HandLandmarker.create_from_options(options)

def extract_landmarks_from_video(video_path, landmarker, num_frames=2):
    """
    Extracts hand landmarks from steady-state frames (e.g. 40% and 65% of video).
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return []

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if total_frames < 6:
        cap.release()
        return []

    sample_indices = [int(total_frames * 0.40), int(total_frames * 0.65)]
    extracted_frames = []

    for idx in sample_indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ret, frame = cap.read()
        if not ret or frame is None:
            continue
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        try:
            res = landmarker.detect(mp_img)
            if res.hand_landmarks:
                hands = []
                for hl in res.hand_landmarks:
                    pts = [[lm.x, lm.y, lm.z] for lm in hl]
                    hands.append(pts)
                extracted_frames.append(hands)
        except Exception:
            pass

    cap.release()
    return extracted_frames

def train_isl_words_model(
    dataset_dir="Video_Dataset/Video_Dataset",
    models_dir="models",
    frames_per_video=2
):
    print("==================================================")
    print(" Training 61-Class ISL Word Gestures Model")
    print("==================================================")

    model_task_path = os.path.join(models_dir, "hand_landmarker.task")
    if not os.path.exists(model_task_path):
        raise FileNotFoundError(f"MediaPipe task model not found at {model_task_path}")

    landmarker = init_landmarker(model_task_path)

    classes = sorted([d for d in os.listdir(dataset_dir) if os.path.isdir(os.path.join(dataset_dir, d))])
    print(f"Discovered {len(classes)} ISL classes in {dataset_dir}")

    X_list = []
    y_list = []

    t0 = time.time()
    for cls in tqdm(classes, desc="Extracting ISL Gestures"):
        cls_dir = os.path.join(dataset_dir, cls)
        video_files = glob.glob(os.path.join(cls_dir, "*.mp4"))

        # Stratified sampling: 6 normal, 6 left tilt, 6 right tilt = 18 videos/class
        normal_vids = [v for v in video_files if "_tilt" not in v][:6]
        left_vids = [v for v in video_files if "left_tilt" in v][:6]
        right_vids = [v for v in video_files if "right_tilt" in v][:6]
        sampled_vids = normal_vids + left_vids + right_vids
        if len(sampled_vids) < 10:
            sampled_vids = video_files[:18]

        class_samples = 0
        for vpath in sampled_vids:
            frames_hands = extract_landmarks_from_video(vpath, landmarker, num_frames=frames_per_video)
            for hands in frames_hands:
                # Original
                feat = extract_dual_hand_features(hands, flip_x=False)
                X_list.append(feat)
                y_list.append(cls)

                # Horizontal flip augmentation (ensures left/right hand invariance)
                feat_flip = extract_dual_hand_features(hands, flip_x=True)
                X_list.append(feat_flip)
                y_list.append(cls)

                class_samples += 1

    extract_time = time.time() - t0
    print(f"\nISL Extraction complete in {extract_time:.1f}s. Total feature vectors: {len(X_list)}")

    X = np.array(X_list, dtype=np.float32)
    le = LabelEncoder()
    y = le.fit_transform(y_list)

    # Train / Test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.15, random_state=42, stratify=y
    )
    print(f"Train samples: {X_train.shape[0]}, Test samples: {X_test.shape[0]}")

    print("Fitting Random Forest Classifier across 61 classes...")
    t_train = time.time()
    rf = RandomForestClassifier(
        n_estimators=160,
        max_depth=24,
        min_samples_split=2,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    )
    rf.fit(X_train, y_train)
    train_dur = time.time() - t_train

    # Evaluate
    test_preds = rf.predict(X_test)
    test_acc = accuracy_score(y_test, test_preds)
    test_bal_acc = balanced_accuracy_score(y_test, test_preds)
    test_f1 = f1_score(y_test, test_preds, average="macro", zero_division=0)

    print(f"\n==================================================")
    print(f" 61-CLASS ISL MODEL EVALUATION:")
    print(f" Test Accuracy:          {test_acc * 100:.2f}%")
    print(f" Test Balanced Accuracy: {test_bal_acc * 100:.2f}%")
    print(f" Test Macro F1:          {test_f1 * 100:.2f}%")
    print(f" Training Time:          {train_dur:.1f}s")
    print(f"==================================================")

    # Single-sample inference optimization
    rf.n_jobs = 1

    # Save models
    os.makedirs(models_dir, exist_ok=True)
    isl_model_path = os.path.join(models_dir, "isl_words_model.pkl")
    isl_encoder_path = os.path.join(models_dir, "isl_label_encoder.pkl")
    isl_meta_path = os.path.join(models_dir, "isl_metadata.json")

    with open(isl_model_path, "wb") as f:
        pickle.dump(rf, f)
    with open(isl_encoder_path, "wb") as f:
        pickle.dump(le, f)

    # Also save to best_model.pkl and label_encoder.pkl for standard loading
    with open(os.path.join(models_dir, "best_model.pkl"), "wb") as f:
        pickle.dump(rf, f)
    with open(os.path.join(models_dir, "label_encoder.pkl"), "wb") as f:
        pickle.dump(le, f)

    metadata = {
        "model_architecture": "RandomForestClassifier(160, max_depth=24)",
        "language": "Indian Sign Language (ISL)",
        "num_classes": len(classes),
        "classes": list(le.classes_),
        "feature_dimension": DUAL_HAND_FEAT_DIM,
        "total_samples": len(X),
        "test_accuracy": round(float(test_acc), 4),
        "test_balanced_accuracy": round(float(test_bal_acc), 4),
        "test_macro_f1": round(float(test_f1), 4),
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
    }

    with open(isl_meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    with open(os.path.join(models_dir, "model_metadata.json"), "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"ISL Word Model saved to {isl_model_path}")
    print(f"ISL Encoder saved to {isl_encoder_path}")
    return metadata

if __name__ == "__main__":
    train_isl_words_model()
