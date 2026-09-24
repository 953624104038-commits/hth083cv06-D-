"""
Unit Tests for Hand Landmark Normalization and Feature Extraction (HTH-CV-09)
"""

import sys
import os
import numpy as np

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from training.preprocess import extract_single_hand_features, extract_dual_hand_features, FEATURE_DIM

def test_feature_dimension():
    dummy_hand = np.random.uniform(0.1, 0.9, size=(21, 3)).astype(np.float32)
    single_feat = extract_single_hand_features(dummy_hand)
    assert single_feat.shape == (93,), f"Expected shape (93,), got {single_feat.shape}"

    dual_feat = extract_dual_hand_features([dummy_hand, dummy_hand])
    assert dual_feat.shape == (FEATURE_DIM,), f"Expected shape ({FEATURE_DIM},), got {dual_feat.shape}"
    assert FEATURE_DIM == 194
    print("[PASS] test_feature_dimension (93-dim single-hand, 194-dim dual-hand)")

def test_translation_invariance():
    base_hand = np.random.uniform(0.2, 0.6, size=(21, 3)).astype(np.float32)
    shift = np.array([0.35, -0.22, 0.45], dtype=np.float32)
    shifted_hand = base_hand + shift

    feat_base = extract_single_hand_features(base_hand)
    feat_shifted = extract_single_hand_features(shifted_hand)

    diff = float(np.max(np.abs(feat_base - feat_shifted)))
    assert diff < 1e-4, f"Translation invariance violated, max diff: {diff}"
    print(f"[PASS] test_translation_invariance (max diff: {diff:.2e})")

def test_scale_invariance():
    base_hand = np.random.uniform(0.2, 0.6, size=(21, 3)).astype(np.float32)
    wrist = base_hand[0].copy()
    
    scaled_hand_large = wrist + (base_hand - wrist) * 2.5
    scaled_hand_small = wrist + (base_hand - wrist) * 0.4

    feat_base = extract_single_hand_features(base_hand)
    feat_large = extract_single_hand_features(scaled_hand_large)
    feat_small = extract_single_hand_features(scaled_hand_small)

    diff_large = float(np.max(np.abs(feat_base - feat_large)))
    diff_small = float(np.max(np.abs(feat_base - feat_small)))

    assert diff_large < 1e-4, f"Scale invariance (large) violated, max diff: {diff_large}"
    assert diff_small < 1e-4, f"Scale invariance (small) violated, max diff: {diff_small}"
    print(f"[PASS] test_scale_invariance (large diff: {diff_large:.2e}, small diff: {diff_small:.2e})")

def test_presence_masks():
    dummy_hand = np.random.uniform(0.1, 0.9, size=(21, 3)).astype(np.float32)

    # 0 hands
    f0 = extract_dual_hand_features([])
    assert np.all(f0 == 0.0), "Zero hands should yield all-zero feature vector"
    assert f0[-2] == 0.0 and f0[-1] == 0.0

    # 1 hand
    f1 = extract_dual_hand_features([dummy_hand])
    assert f1[-2] == 1.0 and f1[-1] == 0.0
    assert not np.all(f1[:93] == 0.0)
    assert np.all(f1[93:186] == 0.0)

    # 2 hands
    f2 = extract_dual_hand_features([dummy_hand, dummy_hand])
    assert f2[-2] == 1.0 and f2[-1] == 1.0
    assert not np.all(f2[:93] == 0.0)
    assert not np.all(f2[93:186] == 0.0)
    print("[PASS] test_presence_masks (dual-hand 194-dim masks verified)")

if __name__ == "__main__":
    test_feature_dimension()
    test_translation_invariance()
    test_scale_invariance()
    test_presence_masks()
    print("\nAll normalization unit tests passed successfully!")
