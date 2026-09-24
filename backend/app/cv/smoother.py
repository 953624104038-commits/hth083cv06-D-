"""
Temporal Smoothing and Unknown Gesture Disambiguation (HTH-CV-09)
Implements a rolling prediction buffer to eliminate frame-to-frame flicker,
and robustly handles NO_HAND, GESTURE_UNCLEAR, and STABLE recognition states.

Key design decisions:
  - Window size 5 with min_stable_count 3 prevents noise/garbage
  - Confidence threshold 0.55 filters weak predictions
  - Immediate clear on hands_count=0 prevents sticky predictions
  - Decay mechanism ensures predictions don't persist after hand removal
"""

from collections import deque
import numpy as np
import time

class TemporalSmoother:
    def __init__(self, window_size=3, confidence_threshold=0.50, min_stable_count=2):
        self.window_size = window_size
        self.confidence_threshold = confidence_threshold
        self.min_stable_count = min_stable_count
        
        # Rolling buffers
        self.prediction_buffer = deque(maxlen=window_size)
        self.confidence_buffer = deque(maxlen=window_size)
        
        # State tracking
        self.last_stable_sign = None
        self.last_emitted_sign = None
        self.consecutive_stable_count = 0
        
        # Timing for "no hand" decay
        self.last_hand_seen_time = 0.0
        self.no_hand_frames = 0

    def process(self, predicted_label: str, confidence: float, hands_detected: int) -> dict:
        now = time.time()

        if hands_detected == 0:
            # Immediate clear when no hand is in frame
            self.prediction_buffer.clear()
            self.confidence_buffer.clear()
            self.consecutive_stable_count = 0
            self.last_stable_sign = None
            self.last_emitted_sign = None  # Reset state so re-signing triggers immediately
            self.no_hand_frames += 1
            return {
                "status": "NO_HAND",
                "sign": "NO_HAND",
                "display_name": "No Hand Detected",
                "confidence": 0.0,
                "hand_detected": False,
                "stable": False,
                "new_stable_event": False
            }

        # Hand is present — reset no-hand counter
        self.no_hand_frames = 0
        self.last_hand_seen_time = now

        # Reject very low confidence predictions
        if not predicted_label or confidence < 0.28:
            self.prediction_buffer.append("UNCLEAR")
            self.confidence_buffer.append(0.0)
        else:
            self.prediction_buffer.append(predicted_label)
            self.confidence_buffer.append(confidence)

        # Rapid gesture transition: if user intentionally switches to a new sign for 2+ frames,
        # prune old historical frames so the new sign immediately takes over
        buf_len = len(self.prediction_buffer)
        if buf_len >= 2 and self.prediction_buffer[-1] != "UNCLEAR" and self.prediction_buffer[-1] == self.prediction_buffer[-2]:
            recent_sign = self.prediction_buffer[-1]
            if recent_sign != self.last_stable_sign and self.confidence_buffer[-1] >= 0.70 and self.confidence_buffer[-2] >= 0.70:
                while len(self.prediction_buffer) > 2:
                    self.prediction_buffer.popleft()
                    self.confidence_buffer.popleft()
                buf_len = len(self.prediction_buffer)

        # Weighted voting with recency boost
        votes = {}
        for i, (sign, conf) in enumerate(zip(self.prediction_buffer, self.confidence_buffer)):
            if sign != "UNCLEAR":
                weight = 1.0 + (0.5 * i / max(1, buf_len - 1)) if buf_len > 1 else 1.0
                votes[sign] = votes.get(sign, 0.0) + (conf * weight)

        if not votes:
            # If unclear for multiple frames, allow re-triggering the same sign upon return
            if len(self.prediction_buffer) >= 2 and all(s == "UNCLEAR" for s in self.prediction_buffer):
                self.last_emitted_sign = None
            return {
                "status": "GESTURE_UNCLEAR",
                "sign": "GESTURE_UNCLEAR",
                "display_name": "Gesture Unclear",
                "confidence": 0.0,
                "hand_detected": True,
                "stable": False,
                "new_stable_event": False
            }

        # Winning candidate
        top_sign = max(votes.keys(), key=lambda k: votes[k])
        top_confs = [c for s, c in zip(self.prediction_buffer, self.confidence_buffer) if s == top_sign]
        avg_top_conf = float(np.mean(top_confs)) if top_confs else 0.0
        count_for_top = len(top_confs)

        # Responsive stability check
        is_clear = (top_sign != "UNCLEAR") and (avg_top_conf >= self.confidence_threshold)
        is_stable = is_clear and (count_for_top >= self.min_stable_count)

        # High-confidence fast trigger (>= 0.82 requires only 2 consecutive frames)
        if is_clear and avg_top_conf >= 0.82 and count_for_top >= 2:
            is_stable = True

        new_stable_event = False
        if is_stable:
            self.last_stable_sign = top_sign
            if top_sign != self.last_emitted_sign:
                self.last_emitted_sign = top_sign
                self.consecutive_stable_count = 1
                new_stable_event = True
            else:
                self.consecutive_stable_count += 1
        else:
            self.consecutive_stable_count = 0

        if not is_clear:
            return {
                "status": "GESTURE_UNCLEAR",
                "sign": "GESTURE_UNCLEAR",
                "display_name": "Gesture Unclear",
                "confidence": round(avg_top_conf, 2),
                "hand_detected": True,
                "stable": False,
                "new_stable_event": False
            }

        return {
            "status": "RECOGNIZED",
            "sign": top_sign,
            "display_name": top_sign.replace("_", " ").title(),
            "confidence": round(avg_top_conf, 2),
            "hand_detected": True,
            "stable": is_stable,
            "new_stable_event": new_stable_event
        }

    def reset(self):
        self.prediction_buffer.clear()
        self.confidence_buffer.clear()
        self.last_stable_sign = None
        self.last_emitted_sign = None
        self.consecutive_stable_count = 0
        self.no_hand_frames = 0
