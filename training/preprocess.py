"""
Feature Normalization and Engineering for Hand Landmarks (HTH-CV-09)
Computes wrist-centric, scale-invariant, geometric invariant feature vectors.
Supports both single-hand (ASL alphabet) and dual-hand (ISL word gestures).
Deterministic hand ordering by X-coordinate eliminates multi-hand jitter.
"""

import numpy as np

# Landmark Indices according to MediaPipe Hands specification
WRIST = 0
THUMB_CMC = 1
THUMB_MCP = 2
THUMB_IP = 3
THUMB_TIP = 4

INDEX_MCP = 5
INDEX_PIP = 6
INDEX_DIP = 7
INDEX_TIP = 8

MIDDLE_MCP = 9
MIDDLE_PIP = 10
MIDDLE_DIP = 11
MIDDLE_TIP = 12

RING_MCP = 13
RING_PIP = 14
RING_DIP = 15
RING_TIP = 16

PINKY_MCP = 17
PINKY_PIP = 18
PINKY_DIP = 19
PINKY_TIP = 20

FINGERTIPS = [THUMB_TIP, INDEX_TIP, MIDDLE_TIP, RING_TIP, PINKY_TIP]
MCP_JOINTS = [THUMB_MCP, INDEX_MCP, MIDDLE_MCP, RING_MCP, PINKY_MCP]
PIP_JOINTS = [THUMB_IP, INDEX_PIP, MIDDLE_PIP, RING_PIP, PINKY_PIP]

INTER_TIP_PAIRS = [
    (THUMB_TIP, INDEX_TIP),
    (THUMB_TIP, MIDDLE_TIP),
    (THUMB_TIP, RING_TIP),
    (THUMB_TIP, PINKY_TIP),
    (INDEX_TIP, MIDDLE_TIP),
    (INDEX_TIP, RING_TIP),
    (INDEX_TIP, PINKY_TIP),
    (MIDDLE_TIP, RING_TIP),
    (MIDDLE_TIP, PINKY_TIP),
    (RING_TIP, PINKY_TIP),
]

SINGLE_HAND_FEAT_DIM = 93
DUAL_HAND_FEAT_DIM = 194  # 93 * 2 + 6 (relative) + 2 (presence mask)

def extract_single_hand_features(landmarks_21x3: np.ndarray, flip_x: bool = False) -> np.ndarray:
    """
    Extracts 93 normalized geometric features from 21 (x, y, z) landmarks of one hand.
    
    1. Wrist Centering: coords translated relative to wrist (L0).
    2. Scale Normalization: normalized by robust palm scale (mean distance to MCP joints).
    3. 63 normalized coordinates (x, y, z).
    4. 5 fingertip-to-wrist normalized distances.
    5. 10 pairwise inter-fingertip distances.
    6. 5 finger extension ratios (tip-to-wrist / mcp-to-wrist).
    7. 10 joint cosine angles (PIP and MCP joint bend).
    
    Returns:
        1D numpy array of length 93.
    """
    pts = np.array(landmarks_21x3, dtype=np.float32).copy()
    if pts.shape != (21, 3):
        return np.zeros(SINGLE_HAND_FEAT_DIM, dtype=np.float32)

    if flip_x:
        pts[:, 0] = -pts[:, 0]

    # 1. Wrist Centering
    wrist = pts[WRIST, :].copy()
    pts_centered = pts - wrist

    # 2. Robust Palm Scale (average distance to index, middle, and pinky MCP)
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

    # 6. Finger curl / extension ratios (5) (tip distance / mcp distance)
    ext_ratios = []
    for mcp, tip in zip(MCP_JOINTS, FINGERTIPS):
        mcp_d = np.linalg.norm(pts_norm[mcp])
        tip_d = np.linalg.norm(pts_norm[tip])
        ratio = tip_d / max(1e-3, mcp_d)
        ext_ratios.append(min(3.0, ratio))

    # 7. Joint bend cosine angles (10)
    # Cosine at MCP: between (wrist -> mcp) and (mcp -> pip)
    # Cosine at PIP: between (mcp -> pip) and (pip -> tip)
    angles = []
    for mcp, pip, tip in zip(MCP_JOINTS, PIP_JOINTS, FINGERTIPS):
        # Angle at MCP
        v1 = pts_norm[mcp]
        v2 = pts_norm[pip] - pts_norm[mcp]
        n1 = np.linalg.norm(v1)
        n2 = np.linalg.norm(v2)
        if n1 > 1e-4 and n2 > 1e-4:
            cos1 = np.clip(np.dot(v1, v2) / (n1 * n2), -1.0, 1.0)
        else:
            cos1 = 0.0
        angles.append(cos1)

        # Angle at PIP
        v3 = pts_norm[tip] - pts_norm[pip]
        n3 = np.linalg.norm(v3)
        if n2 > 1e-4 and n3 > 1e-4:
            cos2 = np.clip(np.dot(v2, v3) / (n2 * n3), -1.0, 1.0)
        else:
            cos2 = 0.0
        angles.append(cos2)

    features = np.concatenate([
        coords_feat,
        np.array(tip_wrist_dists, dtype=np.float32),
        np.array(inter_tip_dists, dtype=np.float32),
        np.array(ext_ratios, dtype=np.float32),
        np.array(angles, dtype=np.float32)
    ])
    return features


def extract_dual_hand_features(hand_landmarks_list: list, flip_x: bool = False) -> np.ndarray:
    """
    Extracts fixed-length feature vector (194 elements) supporting one or two hands.
    Deterministically orders hands by their raw X coordinate (leftmost hand first).
    Includes relative distance and orientation vectors between both hands.
    
    Returns:
        1D numpy array of shape (194,).
    """
    num_hands = len(hand_landmarks_list)
    hand1_feat = np.zeros(SINGLE_HAND_FEAT_DIM, dtype=np.float32)
    hand2_feat = np.zeros(SINGLE_HAND_FEAT_DIM, dtype=np.float32)
    rel_feat = np.zeros(6, dtype=np.float32)
    mask = np.zeros(2, dtype=np.float32)

    if num_hands == 0:
        return np.concatenate([hand1_feat, hand2_feat, rel_feat, mask])

    # Deterministic sorting: sort by wrist x coordinate (leftmost hand first)
    sorted_hands = sorted(hand_landmarks_list, key=lambda h: h[WRIST][0])

    # Hand 1 (Leftmost)
    h1_pts = np.array(sorted_hands[0], dtype=np.float32)
    hand1_feat = extract_single_hand_features(h1_pts, flip_x=flip_x)
    mask[0] = 1.0

    if num_hands > 1:
        # Hand 2 (Rightmost)
        h2_pts = np.array(sorted_hands[1], dtype=np.float32)
        hand2_feat = extract_single_hand_features(h2_pts, flip_x=flip_x)
        mask[1] = 1.0

        # Relative features between the two hands
        w1 = h1_pts[WRIST]
        w2 = h2_pts[WRIST]
        tip1 = h1_pts[INDEX_TIP]
        tip2 = h2_pts[INDEX_TIP]

        diff_w = w2 - w1
        if flip_x:
            diff_w[0] = -diff_w[0]

        rel_feat[0:3] = diff_w  # (dx, dy, dz) between wrists
        rel_feat[3] = np.linalg.norm(diff_w)  # distance between wrists
        rel_feat[4] = np.linalg.norm(tip2 - tip1)  # distance between index tips
        rel_feat[5] = np.linalg.norm(h2_pts[THUMB_TIP] - h1_pts[THUMB_TIP])  # distance between thumbs

    return np.concatenate([hand1_feat, hand2_feat, rel_feat, mask])

FEATURE_DIM = DUAL_HAND_FEAT_DIM
