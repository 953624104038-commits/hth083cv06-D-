"""
Feature-Level Data Augmentation for Hand Landmarks (HTH-CV-09)
Applies controlled geometric perturbations to raw landmarks before feature extraction.
Simulates variations in camera distance, hand orientation, and sensor noise.
IMPORTANT: Used for training data ONLY. Never applied to validation or test data.
"""

import numpy as np
import math

def rotate_landmarks_3d(points_21x3: np.ndarray, max_angle_deg: float = 10.0) -> np.ndarray:
    """
    Applies a small random 3D rotation around the wrist (origin).
    """
    pts = points_21x3.copy()
    
    # Random angles in radians
    theta_x = np.random.uniform(-max_angle_deg, max_angle_deg) * math.pi / 180.0
    theta_y = np.random.uniform(-max_angle_deg, max_angle_deg) * math.pi / 180.0
    theta_z = np.random.uniform(-max_angle_deg, max_angle_deg) * math.pi / 180.0
    
    # Rotation matrices
    Rx = np.array([
        [1, 0, 0],
        [0, math.cos(theta_x), -math.sin(theta_x)],
        [0, math.sin(theta_x), math.cos(theta_x)]
    ], dtype=np.float32)
    
    Ry = np.array([
        [math.cos(theta_y), 0, math.sin(theta_y)],
        [0, 1, 0],
        [-math.sin(theta_y), 0, math.cos(theta_y)]
    ], dtype=np.float32)
    
    Rz = np.array([
        [math.cos(theta_z), -math.sin(theta_z), 0],
        [math.sin(theta_z), math.cos(theta_z), 0],
        [0, 0, 1]
    ], dtype=np.float32)
    
    R = Rz @ Ry @ Rx
    return pts @ R.T


def augment_landmarks(
    hand_landmarks_list: list,
    jitter_std: float = 0.012,
    scale_range: tuple = (0.92, 1.08),
    max_rotation_deg: float = 10.0
) -> list:
    """
    Augments a list of detected hands (1 or 2 hands) with noise, scaling, and rotation.
    Returns augmented hand landmarks in the same nested list structure.
    """
    augmented = []
    
    # Sample common scale factor to keep multi-hand relations coherent
    scale = np.random.uniform(scale_range[0], scale_range[1])
    
    for hand in hand_landmarks_list:
        pts = np.array(hand, dtype=np.float32).copy()
        
        # 1. 3D Rotation
        pts = rotate_landmarks_3d(pts, max_angle_deg=max_rotation_deg)
        
        # 2. Scale variation
        pts = pts * scale
        
        # 3. Gaussian positional jitter
        noise = np.random.normal(0.0, jitter_std, size=pts.shape).astype(np.float32)
        pts = pts + noise
        
        augmented.append(pts)
        
    return augmented
