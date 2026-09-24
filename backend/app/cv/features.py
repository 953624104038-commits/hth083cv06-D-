"""
Real-time Hand Landmark Feature Extraction (HTH-CV-09)
Computes robust wrist-centric, scale-invariant, geometric invariant feature vectors.
Supports both:
  1. Single-hand features (93-dim) for ASL alphabet fingerspelling
  2. Dual-hand features (194-dim) for ISL word gestures
Deterministic hand ordering by X-coordinate eliminates multi-hand jitter.
"""

import numpy as np

WRIST = 0
INDEX_MCP = 5
MIDDLE_MCP = 9
PINKY_MCP = 17

INDEX_TIP = 8
THUMB_TIP = 4
MIDDLE_TIP = 12
RING_TIP = 16
PINKY_TIP = 20

FINGERTIPS = [4, 8, 12, 16, 20]
MCP_JOINTS = [2, 5, 9, 13, 17]
PIP_JOINTS = [3, 6, 10, 14, 18]

INTER_TIP_PAIRS = [
    (4, 8), (4, 12), (4, 16), (4, 20),
    (8, 12), (8, 16), (8, 20),
    (12, 16), (12, 20),
    (16, 20)
]

SINGLE_HAND_FEAT_DIM = 93
DUAL_HAND_FEAT_DIM = 194

def extract_single_hand_features(landmarks_21x3: np.ndarray, flip_x: bool = False) -> np.ndarray:
    pts = np.array(landmarks_21x3, dtype=np.float32).copy()
    if pts.shape != (21, 3):
        return np.zeros(SINGLE_HAND_FEAT_DIM, dtype=np.float32)

    if flip_x:
        pts[:, 0] = -pts[:, 0]

    # 1. Wrist Centering
    wrist = pts[WRIST, :].copy()
    pts_centered = pts - wrist

    # 2. Robust Palm Scale
    d_index = np.linalg.norm(pts_centered[INDEX_MCP])
    d_mid = np.linalg.norm(pts_centered[MIDDLE_MCP])
    d_pinky = np.linalg.norm(pts_centered[PINKY_MCP])
    palm_scale = (d_index + d_mid + d_pinky) / 3.0
    if palm_scale < 1e-4:
        palm_scale = 1.0
        
    pts_norm = pts_centered / palm_scale

    # 3. 63 Coordinates
    coords_feat = pts_norm.flatten()

    # 4. Fingertip to wrist distances (5)
    tip_wrist_dists = [np.linalg.norm(pts_norm[tip]) for tip in FINGERTIPS]

    # 5. Pairwise inter-fingertip distances (10)
    inter_tip_dists = [np.linalg.norm(pts_norm[p1] - pts_norm[p2]) for p1, p2 in INTER_TIP_PAIRS]

    # 6. Finger curl / extension ratios (5)
    ext_ratios = []
    for mcp, tip in zip(MCP_JOINTS, FINGERTIPS):
        mcp_d = np.linalg.norm(pts_norm[mcp])
        tip_d = np.linalg.norm(pts_norm[tip])
        ratio = tip_d / max(1e-3, mcp_d)
        ext_ratios.append(min(3.0, ratio))

    # 7. Joint bend cosine angles (10)
    angles = []
    for mcp, pip, tip in zip(MCP_JOINTS, PIP_JOINTS, FINGERTIPS):
        v1 = pts_norm[mcp]
        v2 = pts_norm[pip] - pts_norm[mcp]
        n1 = np.linalg.norm(v1)
        n2 = np.linalg.norm(v2)
        if n1 > 1e-4 and n2 > 1e-4:
            cos1 = np.clip(np.dot(v1, v2) / (n1 * n2), -1.0, 1.0)
        else:
            cos1 = 0.0
        angles.append(cos1)

        v3 = pts_norm[tip] - pts_norm[pip]
        n3 = np.linalg.norm(v3)
        if n2 > 1e-4 and n3 > 1e-4:
            cos2 = np.clip(np.dot(v2, v3) / (n2 * n3), -1.0, 1.0)
        else:
            cos2 = 0.0
        angles.append(cos2)

    return np.concatenate([
        coords_feat,
        np.array(tip_wrist_dists, dtype=np.float32),
        np.array(inter_tip_dists, dtype=np.float32),
        np.array(ext_ratios, dtype=np.float32),
        np.array(angles, dtype=np.float32)
    ])


def extract_features_from_mediapipe_result(detection_result) -> tuple:
    """
    Parses MediaPipe HandLandmarker result and generates:
      - feat_dual: 194-dim vector for ISL word gestures
      - feat_single: 93-dim vector for ASL alphabet letters (primary hand)
      - hands_detected_count
      - overlay_landmarks
    """
    if not detection_result or not detection_result.hand_landmarks:
        return np.zeros(DUAL_HAND_FEAT_DIM, dtype=np.float32), np.zeros(SINGLE_HAND_FEAT_DIM, dtype=np.float32), 0, []

    hands_list = []
    overlay_landmarks = []
    for hl in detection_result.hand_landmarks:
        hand_pts = [[lm.x, lm.y, lm.z] for lm in hl]
        hands_list.append(hand_pts)
        overlay_landmarks.append([{"x": lm.x, "y": lm.y, "z": lm.z} for lm in hl])

    num_hands = len(hands_list)

    # Deterministic sorting by raw X coordinate (leftmost hand first)
    sorted_indices = sorted(range(num_hands), key=lambda i: hands_list[i][WRIST][0])
    sorted_hands = [hands_list[i] for i in sorted_indices]

    # 1. Dual Hand Features (for ISL words)
    hand1_feat = np.zeros(SINGLE_HAND_FEAT_DIM, dtype=np.float32)
    hand2_feat = np.zeros(SINGLE_HAND_FEAT_DIM, dtype=np.float32)
    rel_feat = np.zeros(6, dtype=np.float32)
    mask = np.zeros(2, dtype=np.float32)

    h1_pts = np.array(sorted_hands[0], dtype=np.float32)
    hand1_feat = extract_single_hand_features(h1_pts)
    mask[0] = 1.0

    if num_hands > 1:
        h2_pts = np.array(sorted_hands[1], dtype=np.float32)
        hand2_feat = extract_single_hand_features(h2_pts)
        mask[1] = 1.0

        w1 = h1_pts[WRIST]
        w2 = h2_pts[WRIST]
        diff_w = w2 - w1
        rel_feat[0:3] = diff_w
        rel_feat[3] = np.linalg.norm(diff_w)
        rel_feat[4] = np.linalg.norm(h2_pts[INDEX_TIP] - h1_pts[INDEX_TIP])
        rel_feat[5] = np.linalg.norm(h2_pts[THUMB_TIP] - h1_pts[THUMB_TIP])

    feat_dual = np.concatenate([hand1_feat, hand2_feat, rel_feat, mask]).astype(np.float32)

    # Runtime dimension validation
    if feat_dual.shape[0] != DUAL_HAND_FEAT_DIM:
        raise ValueError(f"ISL dual-hand feature dimension mismatch: expected {DUAL_HAND_FEAT_DIM}, got {feat_dual.shape[0]}")
    if hand1_feat.shape[0] != SINGLE_HAND_FEAT_DIM:
        raise ValueError(f"ASL single-hand feature dimension mismatch: expected {SINGLE_HAND_FEAT_DIM}, got {hand1_feat.shape[0]}")

    # 2. Single Hand Features (for ASL alphabet fingerspelling)
    feat_single = hand1_feat

    return feat_dual, feat_single, num_hands, overlay_landmarks


def extract_dual_hand_features(hand_landmarks_list) -> np.ndarray:
    """
    Standard dual-hand feature extraction helper (194-dim) for compatibility with tests.
    """
    num_hands = len(hand_landmarks_list)
    hand1_feat = np.zeros(SINGLE_HAND_FEAT_DIM, dtype=np.float32)
    hand2_feat = np.zeros(SINGLE_HAND_FEAT_DIM, dtype=np.float32)
    rel_feat = np.zeros(6, dtype=np.float32)
    mask = np.zeros(2, dtype=np.float32)

    if num_hands == 0:
        return np.concatenate([hand1_feat, hand2_feat, rel_feat, mask]).astype(np.float32)

    sorted_hands = sorted(hand_landmarks_list, key=lambda h: h[WRIST][0])

    h1_pts = np.array(sorted_hands[0], dtype=np.float32)
    hand1_feat = extract_single_hand_features(h1_pts)
    mask[0] = 1.0

    if num_hands > 1:
        h2_pts = np.array(sorted_hands[1], dtype=np.float32)
        hand2_feat = extract_single_hand_features(h2_pts)
        mask[1] = 1.0

        w1 = h1_pts[WRIST]
        w2 = h2_pts[WRIST]
        diff_w = w2 - w1
        rel_feat[0:3] = diff_w
        rel_feat[3] = np.linalg.norm(diff_w)
        rel_feat[4] = np.linalg.norm(h2_pts[INDEX_TIP] - h1_pts[INDEX_TIP])
        rel_feat[5] = np.linalg.norm(h2_pts[THUMB_TIP] - h1_pts[THUMB_TIP])

    feat_dual = np.concatenate([hand1_feat, hand2_feat, rel_feat, mask]).astype(np.float32)
    if feat_dual.shape[0] != DUAL_HAND_FEAT_DIM:
        raise ValueError(f"Dual-hand feature dimension mismatch: expected {DUAL_HAND_FEAT_DIM}, got {feat_dual.shape[0]}")
    return feat_dual
