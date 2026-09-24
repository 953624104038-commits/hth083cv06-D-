"""
Model Training and Comparison Pipeline for HTH-CV-09
Uses Group-Aware splitting to eliminate signer/recording data leakage.
Applies feature augmentation exclusively to training data.
Trains and compares Random Forest and MLP classifiers.
"""

import os
import sys
import json
import time
import pickle
import numpy as np
import yaml

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sklearn.ensemble import RandomForestClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import accuracy_score, balanced_accuracy_score, f1_score, classification_report
from sklearn.model_selection import GroupShuffleSplit
from sklearn.preprocessing import LabelEncoder

from training.preprocess import extract_dual_hand_features, FEATURE_DIM
from training.augment import augment_landmarks

def train_and_select_model(
    landmarks_file="datasets/landmarks/extracted_dataset.json",
    config_file="config/dataset_config.yaml",
    models_dir="models"
):
    print("==================================================")
    print(" HTH-CV-09 Sign Language Recognition Training")
    print("==================================================")

    if not os.path.exists(landmarks_file):
        raise FileNotFoundError(f"Landmarks file not found: {landmarks_file}. Run extract_landmarks.py first.")

    with open(config_file, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    print(f"Loading raw extracted landmarks from {landmarks_file}...")
    with open(landmarks_file, "r", encoding="utf-8") as f:
        raw_samples = json.load(f)

    print(f"Loaded {len(raw_samples)} raw landmark samples.")

    # Group recordings
    recording_ids = np.array([s.get("recording_id", str(i)) for i, s in enumerate(raw_samples)])
    labels = np.array([s["label"] for s in raw_samples])

    # Encode labels
    le = LabelEncoder()
    y_all = le.fit_transform(labels)
    classes = list(le.classes_)
    print(f"Classes ({len(classes)}): {classes}")

    # First split: Train+Val (80%) vs Test (20%) using GroupShuffleSplit
    gss1 = GroupShuffleSplit(n_splits=1, test_size=cfg["split"]["test_size"], random_state=cfg["split"]["random_state"])
    train_val_idx, test_idx = next(gss1.split(raw_samples, y_all, groups=recording_ids))

    # Second split: Train (65% total) vs Val (15% total)
    train_val_groups = recording_ids[train_val_idx]
    train_val_y = y_all[train_val_idx]
    
    val_rel_size = cfg["split"]["val_size"] / (1.0 - cfg["split"]["test_size"])
    gss2 = GroupShuffleSplit(n_splits=1, test_size=val_rel_size, random_state=cfg["split"]["random_state"])
    train_sub_idx, val_sub_idx = next(gss2.split(train_val_idx, train_val_y, groups=train_val_groups))

    train_idx = train_val_idx[train_sub_idx]
    val_idx = train_val_idx[val_sub_idx]

    print(f"\nGroup-Aware Data Partitioning:")
    print(f"  Train: {len(train_idx)} samples ({len(set(recording_ids[train_idx]))} recordings)")
    print(f"  Val:   {len(val_idx)} samples ({len(set(recording_ids[val_idx]))} recordings)")
    print(f"  Test:  {len(test_idx)} samples ({len(set(recording_ids[test_idx]))} recordings)")

    # Feature extraction with augmentation for TRAIN ONLY
    print("\nExtracting normalized features & performing feature augmentation on training set...")
    X_train = []
    y_train = []

    aug_factor = cfg["augmentation"]["samples_per_original"] if cfg["augmentation"]["enabled_for_training_only"] else 0

    for idx in train_idx:
        sample = raw_samples[idx]
        hands = sample["hands"]
        label_idx = y_all[idx]

        # Original normalized feature
        feat_orig = extract_dual_hand_features(hands)
        X_train.append(feat_orig)
        y_train.append(label_idx)

        # Augmented samples
        for _ in range(aug_factor):
            aug_hands = augment_landmarks(
                hands,
                jitter_std=cfg["augmentation"]["jitter_std"],
                scale_range=cfg["augmentation"]["scale_variation"],
                max_rotation_deg=cfg["augmentation"]["rotation_max_deg"]
            )
            feat_aug = extract_dual_hand_features(aug_hands)
            X_train.append(feat_aug)
            y_train.append(label_idx)

    X_train = np.array(X_train, dtype=np.float32)
    y_train = np.array(y_train, dtype=np.int64)
    print(f"  --> Total Augmented Train Features: {X_train.shape}")

    # Validation features (strictly raw, NO augmentation)
    X_val = np.array([extract_dual_hand_features(raw_samples[i]["hands"]) for i in val_idx], dtype=np.float32)
    y_val = y_all[val_idx]

    # Test features (strictly raw, NO augmentation)
    X_test = np.array([extract_dual_hand_features(raw_samples[i]["hands"]) for i in test_idx], dtype=np.float32)
    y_test = y_all[test_idx]

    print(f"  --> Validation Features: {X_val.shape}")
    print(f"  --> Test Features:       {X_test.shape}")

    # Train Model 1: Random Forest
    print("\n--- Training Model 1: Random Forest Classifier ---")
    t0 = time.time()
    rf = RandomForestClassifier(
        n_estimators=150,
        max_depth=16,
        min_samples_split=3,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    )
    rf.fit(X_train, y_train)
    rf_train_time = time.time() - t0

    # Evaluate RF on Validation
    t0 = time.time()
    rf_val_preds = rf.predict(X_val)
    rf_lat_ms = (time.time() - t0) / max(1, len(X_val)) * 1000.0
    rf_acc = accuracy_score(y_val, rf_val_preds)
    rf_bal_acc = balanced_accuracy_score(y_val, rf_val_preds)
    rf_f1 = f1_score(y_val, rf_val_preds, average="macro", zero_division=0)
    print(f"Random Forest Val Balanced Acc: {rf_bal_acc*100:.2f}%, Macro F1: {rf_f1*100:.2f}%, Latency: {rf_lat_ms:.2f} ms/sample")

    # Train Model 2: Multi-Layer Perceptron (MLP)
    print("\n--- Training Model 2: Multi-Layer Perceptron (MLP) ---")
    t0 = time.time()
    mlp = MLPClassifier(
        hidden_layer_sizes=(128, 64),
        activation="relu",
        max_iter=350,
        early_stopping=True,
        n_iter_no_change=15,
        random_state=42
    )
    mlp.fit(X_train, y_train)
    mlp_train_time = time.time() - t0

    # Evaluate MLP on Validation
    t0 = time.time()
    mlp_val_preds = mlp.predict(X_val)
    mlp_lat_ms = (time.time() - t0) / max(1, len(X_val)) * 1000.0
    mlp_acc = accuracy_score(y_val, mlp_val_preds)
    mlp_bal_acc = balanced_accuracy_score(y_val, mlp_val_preds)
    mlp_f1 = f1_score(y_val, mlp_val_preds, average="macro", zero_division=0)
    print(f"MLP Val Balanced Acc: {mlp_bal_acc*100:.2f}%, Macro F1: {mlp_f1*100:.2f}%, Latency: {mlp_lat_ms:.2f} ms/sample")

    # Select Best Model based on Balanced Accuracy & Macro F1
    if (rf_bal_acc + rf_f1) >= (mlp_bal_acc + mlp_f1):
        best_name = "RandomForest"
        best_model = rf
        best_val_bal_acc = rf_bal_acc
        best_val_f1 = rf_f1
        best_lat = rf_lat_ms
    else:
        best_name = "MLPClassifier"
        best_model = mlp
        best_val_bal_acc = mlp_bal_acc
        best_val_f1 = mlp_f1
        best_lat = mlp_lat_ms

    print(f"\n==================================================")
    print(f" WINNING MODEL: {best_name}")
    print(f"==================================================")

    # Final Evaluation on Held-Out Test Set
    t0 = time.time()
    test_preds = best_model.predict(X_test)
    test_probs = best_model.predict_proba(X_test)
    test_lat_ms = (time.time() - t0) / max(1, len(X_test)) * 1000.0

    test_acc = accuracy_score(y_test, test_preds)
    test_bal_acc = balanced_accuracy_score(y_test, test_preds)
    test_f1 = f1_score(y_test, test_preds, average="macro", zero_division=0)

    print(f"Test Accuracy:          {test_acc*100:.2f}%")
    print(f"Test Balanced Accuracy: {test_bal_acc*100:.2f}%")
    print(f"Test Macro F1:          {test_f1*100:.2f}%")
    print(f"Test Latency:           {test_lat_ms:.2f} ms/sample")

    # Save artifacts
    os.makedirs(models_dir, exist_ok=True)
    model_path = os.path.join(models_dir, "best_model.pkl")
    encoder_path = os.path.join(models_dir, "label_encoder.pkl")
    meta_path = os.path.join(models_dir, "model_metadata.json")

    with open(model_path, "wb") as f:
        pickle.dump(best_model, f)
    with open(encoder_path, "wb") as f:
        pickle.dump(le, f)

    metadata = {
        "model_architecture": best_name,
        "feature_dimension": FEATURE_DIM,
        "classes": classes,
        "num_classes": len(classes),
        "training_samples_augmented": int(X_train.shape[0]),
        "validation_samples": int(X_val.shape[0]),
        "test_samples": int(X_test.shape[0]),
        "validation_balanced_accuracy": round(float(best_val_bal_acc), 4),
        "validation_macro_f1": round(float(best_val_f1), 4),
        "test_accuracy": round(float(test_acc), 4),
        "test_balanced_accuracy": round(float(test_bal_acc), 4),
        "test_macro_f1": round(float(test_f1), 4),
        "inference_latency_ms": round(float(test_lat_ms), 3),
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
    }

    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    # Save test predictions and ground truth for evaluate.py
    os.makedirs("datasets/processed", exist_ok=True)
    test_eval_cache = "datasets/processed/test_evaluation_cache.npz"
    np.savez_compressed(
        test_eval_cache,
        y_test=y_test,
        test_preds=test_preds,
        test_probs=test_probs,
        classes=np.array(classes)
    )

    print(f"\nModel exported successfully:")
    print(f"  - Model:         {model_path}")
    print(f"  - Label Encoder: {encoder_path}")
    print(f"  - Metadata:      {meta_path}")
    print(f"  - Test Cache:    {test_eval_cache}")

    return metadata

if __name__ == "__main__":
    train_and_select_model()
