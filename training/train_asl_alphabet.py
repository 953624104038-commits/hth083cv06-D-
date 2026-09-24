"""
ASL Alphabet Fingerspelling Model Training Pipeline (HTH-CV-09)
Extracts hand landmarks from 29 ASL alphabet classes (A-Z, space, del, nothing).
Trains a fast, robust classifier for real-time virtual keyboard and sentence typing.
"""

import os
import sys
import glob
import json
import time
import pickle
import cv2
import numpy as np
from tqdm import tqdm
from sklearn.ensemble import RandomForestClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report

import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from training.preprocess import extract_single_hand_features, SINGLE_HAND_FEAT_DIM

def init_landmarker(model_path="models/hand_landmarker.task"):
    base_options = python.BaseOptions(model_asset_path=model_path)
    options = vision.HandLandmarkerOptions(
        base_options=base_options,
        num_hands=1,
        min_hand_detection_confidence=0.25,
        min_hand_presence_confidence=0.25,
        running_mode=vision.RunningMode.IMAGE
    )
    return vision.HandLandmarker.create_from_options(options)

def extract_landmarks_from_image(img_path, landmarker):
    img = cv2.imread(img_path)
    if img is None:
        return None

    # First attempt: raw image
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
    res = landmarker.detect(mp_img)

    if res.hand_landmarks:
        hl = res.hand_landmarks[0]
        return [[lm.x, lm.y, lm.z] for lm in hl]

    # Second attempt: padded image (for tight crop ASL images)
    pad = 30
    img_pad = cv2.copyMakeBorder(img, pad, pad, pad, pad, cv2.BORDER_REPLICATE)
    rgb_pad = cv2.cvtColor(img_pad, cv2.COLOR_BGR2RGB)
    mp_img_pad = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_pad)
    res_pad = landmarker.detect(mp_img_pad)

    if res_pad.hand_landmarks:
        hl = res_pad.hand_landmarks[0]
        return [[lm.x, lm.y, lm.z] for lm in hl]

    return None

def train_asl_model(
    asl_dir="asl_alphabet_train/asl_alphabet_train",
    samples_per_class=90,
    models_dir="models"
):
    print("==================================================")
    print(" Training ASL Alphabet Model (A-Z, space, del)")
    print("==================================================")

    model_task_path = os.path.join(models_dir, "hand_landmarker.task")
    if not os.path.exists(model_task_path):
        raise FileNotFoundError(f"MediaPipe task model not found at {model_task_path}")

    landmarker = init_landmarker(model_task_path)

    classes = sorted([d for d in os.listdir(asl_dir) if os.path.isdir(os.path.join(asl_dir, d))])
    print(f"Found {len(classes)} ASL classes: {classes}")

    X_list = []
    y_list = []

    t0 = time.time()
    for cls in classes:
        cls_dir = os.path.join(asl_dir, cls)
        img_paths = glob.glob(os.path.join(cls_dir, "*.jpg"))
        # Sample evenly across the class
        step = max(1, len(img_paths) // samples_per_class)
        sampled_paths = img_paths[::step][:samples_per_class]

        valid_count = 0
        for p in sampled_paths:
            lm = extract_landmarks_from_image(p, landmarker)
            if lm is not None:
                # 1. Original features
                feat = extract_single_hand_features(np.array(lm), flip_x=False)
                X_list.append(feat)
                y_list.append(cls)

                # 2. Horizontally flipped features (ensures left-hand and right-hand invariance)
                feat_flipped = extract_single_hand_features(np.array(lm), flip_x=True)
                X_list.append(feat_flipped)
                y_list.append(cls)

                valid_count += 1

        print(f"  Class [{cls}]: {valid_count}/{len(sampled_paths)} valid samples (x2 with flip = {valid_count*2})")

    extract_time = time.time() - t0
    print(f"\nFeature extraction completed in {extract_time:.1f}s. Total feature vectors: {len(X_list)}")

    X = np.array(X_list, dtype=np.float32)
    le = LabelEncoder()
    y = le.fit_transform(y_list)

    # Train/Test Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.15, random_state=42, stratify=y
    )
    print(f"Train samples: {X_train.shape[0]}, Test samples: {X_test.shape[0]}")

    # Train Random Forest Classifier
    print("Training Random Forest Classifier for ASL Alphabet...")
    rf = RandomForestClassifier(
        n_estimators=140,
        max_depth=20,
        min_samples_split=2,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    )
    rf.fit(X_train, y_train)

    # Evaluate
    test_preds = rf.predict(X_test)
    test_acc = accuracy_score(y_test, test_preds)
    print(f"\n>>> ASL Alphabet Test Accuracy: {test_acc * 100:.2f}% <<<")

    # Set n_jobs = 1 for fast single-sample prediction
    rf.n_jobs = 1

    # Save ASL Model artifacts
    os.makedirs(models_dir, exist_ok=True)
    asl_model_path = os.path.join(models_dir, "asl_alphabet_model.pkl")
    asl_encoder_path = os.path.join(models_dir, "asl_label_encoder.pkl")
    asl_meta_path = os.path.join(models_dir, "asl_metadata.json")

    with open(asl_model_path, "wb") as f:
        pickle.dump(rf, f)

    with open(asl_encoder_path, "wb") as f:
        pickle.dump(le, f)

    meta = {
        "model": "ASL Alphabet Classifier",
        "num_classes": len(classes),
        "classes": list(le.classes_),
        "test_accuracy": round(float(test_acc), 4),
        "feature_dim": SINGLE_HAND_FEAT_DIM,
        "total_samples": len(X),
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
    }

    with open(asl_meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

    print(f"ASL Model saved to {asl_model_path}")
    print(f"ASL Encoder saved to {asl_encoder_path}")
    return meta

if __name__ == "__main__":
    train_asl_model()
