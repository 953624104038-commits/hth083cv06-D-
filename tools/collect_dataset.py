"""
Supplementary Webcam Data Collection Tool (HTH-CV-09)
Allows rapid collection of supplementary sign language gestures with automatic
MediaPipe landmark extraction, countdowns, participant metadata, and variation tags.
"""

import os
import sys
import time
import json
import argparse
import cv2
import numpy as np

import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

def init_landmarker(model_path="models/hand_landmarker.task"):
    base_options = python.BaseOptions(model_asset_path=model_path)
    options = vision.HandLandmarkerOptions(
        base_options=base_options,
        num_hands=2,
        min_hand_detection_confidence=0.5,
        min_hand_presence_confidence=0.5,
        min_tracking_confidence=0.5,
        running_mode=vision.RunningMode.IMAGE
    )
    return vision.HandLandmarker.create_from_options(options)

def main():
    parser = argparse.ArgumentParser(description="Collect sign language landmark samples via webcam")
    parser.add_argument("--label", type=str, default="HELLO", help="Target sign label (e.g. HELLO, THANK_YOU)")
    parser.add_argument("--participant", type=str, default="P1", help="Participant / Signer ID (e.g. P1, P2)")
    parser.add_argument("--count", type=int, default=100, help="Number of samples to capture")
    parser.add_argument("--condition", type=str, default="NORMAL", help="Environment tag: LIGHT, DARK, ROTATED, FAR")
    parser.add_argument("--output_dir", type=str, default="datasets/supplementary", help="Output directory")
    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)
    task_model = "models/hand_landmarker.task"
    if not os.path.exists(task_model):
        print(f"Error: {task_model} not found.")
        sys.exit(1)

    print("Initializing MediaPipe HandLandmarker...")
    landmarker = init_landmarker(task_model)

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Could not open webcam.")
        sys.exit(1)

    print(f"\n==========================================")
    print(f" Ready to collect {args.count} samples for [{args.label}]")
    print(f" Signer: {args.participant} | Condition: {args.condition}")
    print(f" Press 's' to start countdown and capture.")
    print(f" Press 'q' to quit.")
    print(f"==========================================\n")

    captured_samples = []
    state = "READY"  # READY, COUNTDOWN, CAPTURING, DONE
    countdown_start = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame = cv2.flip(frame, 1)
        h, w, _ = frame.shape
        display = frame.copy()

        # Run detection
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        res = landmarker.detect(mp_image)

        hands_detected = 0
        current_landmarks = []
        if res.hand_landmarks:
            hands_detected = len(res.hand_landmarks)
            for hl in res.hand_landmarks:
                pts = [[lm.x, lm.y, lm.z] for lm in hl]
                current_landmarks.append(pts)
                # Draw landmarks on display
                for lm in hl:
                    cx, cy = int(lm.x * w), int(lm.y * h)
                    cv2.circle(display, (cx, cy), 4, (0, 255, 0), -1)

        # UI Overlay
        cv2.putText(display, f"SIGN: {args.label}", (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 0), 2)
        cv2.putText(display, f"Signer: {args.participant} | Cond: {args.condition}", (20, 75), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1)
        cv2.putText(display, f"Captured: {len(captured_samples)} / {args.count}", (20, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
        cv2.putText(display, f"Hands: {hands_detected}", (20, 145), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0) if hands_detected > 0 else (0, 0, 255), 2)

        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
        elif key == ord('s') and state == "READY":
            state = "COUNTDOWN"
            countdown_start = time.time()

        if state == "COUNTDOWN":
            rem = 3 - int(time.time() - countdown_start)
            if rem > 0:
                cv2.putText(display, f"GET READY: {rem}", (w // 2 - 120, h // 2), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 165, 255), 3)
            else:
                state = "CAPTURING"

        elif state == "CAPTURING":
            cv2.putText(display, "RECORDING GESTURE...", (w // 2 - 160, h // 2), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 255), 2)
            if hands_detected > 0:
                captured_samples.append({
                    "label": args.label,
                    "participant": args.participant,
                    "condition": args.condition,
                    "timestamp": time.time(),
                    "hands": current_landmarks
                })
                time.sleep(0.04)  # ~25 FPS sampling

            if len(captured_samples) >= args.count:
                state = "DONE"

        elif state == "DONE":
            cv2.putText(display, "COLLECTION COMPLETE! Press 's' for more, 'q' to save & exit.", (20, h - 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

        cv2.imshow("Sign Collector (HTH-CV-09)", display)

    cap.release()
    cv2.destroyAllWindows()

    if captured_samples:
        out_file = os.path.join(args.output_dir, f"{args.label}_{args.participant}_{args.condition}_{int(time.time())}.json")
        with open(out_file, "w", encoding="utf-8") as f:
            json.dump(captured_samples, f)
        print(f"\nSaved {len(captured_samples)} samples to {out_file}")
    else:
        print("\nNo samples captured.")

if __name__ == "__main__":
    main()
