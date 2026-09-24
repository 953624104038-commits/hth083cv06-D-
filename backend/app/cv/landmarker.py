"""
MediaPipe Hand Landmarker Singleton Engine (HTH-CV-09)
Preloads task model once at startup to achieve low-latency real-time inference.
Uses IMAGE mode for maximum accuracy and strictest face-rejection thresholds.
"""

import os
import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

class HandLandmarkerEngine:
    def __init__(self, model_path="models/hand_landmarker.task", num_hands=2):
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"MediaPipe task model not found at {model_path}")
            
        base_options = python.BaseOptions(model_asset_path=model_path)
        options = vision.HandLandmarkerOptions(
            base_options=base_options,
            num_hands=num_hands,
            min_hand_detection_confidence=0.50,
            min_hand_presence_confidence=0.50,
            min_tracking_confidence=0.50,
            running_mode=vision.RunningMode.IMAGE
        )
        self.detector = vision.HandLandmarker.create_from_options(options)

    def detect_frame(self, bgr_image: np.ndarray):
        """
        Runs landmark detection on a BGR numpy image.
        Avoids redundant resizing when input is already standard dimension.
        """
        h, w = bgr_image.shape[:2]
        target_w = 640
        if w > target_w:
            scale = target_w / w
            proc_bgr = cv2.resize(bgr_image, (target_w, int(h * scale)), interpolation=cv2.INTER_LINEAR)
        else:
            proc_bgr = bgr_image

        rgb_image = cv2.cvtColor(proc_bgr, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_image)
        return self.detector.detect(mp_image)

_instance = None

def get_landmarker_engine(model_path="models/hand_landmarker.task") -> HandLandmarkerEngine:
    global _instance
    if _instance is None:
        _instance = HandLandmarkerEngine(model_path=model_path)
    return _instance
