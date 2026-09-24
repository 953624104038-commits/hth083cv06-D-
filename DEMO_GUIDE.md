# Live Demo Guide: HTH-CV-09 Accessibility Bridge

Follow this 3-minute flow to deliver a convincing hackathon presentation to the evaluation panel.

---

## Pre-Demo Quickstart

1. Launch both servers with one command:
   ```powershell
   python scripts/run_all.py
   # or
   powershell scripts/run.ps1
   ```
2. Open your browser at: **`http://localhost:5173`**
3. Verify backend status in header: `ENGINE LIVE` (green badge).

---

## 3-Minute Judge Demonstration Script

### Step 1: Scenario Introduction (30 seconds)
> *"Welcome judges. At public service counters—such as hospitals, banks, and railway helpdesks—Deaf visitors face a severe communication barrier. Our solution, **Accessibility Bridge (HTH-CV-09)**, is a real-time, zero-GPU Computer Vision bridge that recognizes a 16-class Indian Sign Language (ISL) vocabulary, grounded in the official Government of India ISLRTC dictionary."*

### Step 2: Live Sign Recognition & TTS (60 seconds)
1. Ensure your webcam is active (or click **Demo Benchmark** if webcam is unavailable).
2. **Show Sign 1: HELLO** (Open palm facing camera).
   - Point to the green status: `STABLE RECOGNITION ✓`.
   - Point to the recognized card showing **`HELLO / नमस्ते`** and confidence percentage (> 85%).
   - Listen to the browser Text-to-Speech announce *"Hello"*.
3. **Show Sign 2: THANK YOU** (Flat hand touching chin or moving outward).
   - Observe immediate transition and audio response.
4. **Show Sign 3: PLEASE** (Open hand over chest/circular motion).
   - Observe stability and update in conversation timeline below.
5. **Show Sign 4: WATER or DRINK** (C-hand or thumb to mouth gesture).
   - Show how necessity gestures register clearly.

### Step 3: Robustness & Scale Demonstration (45 seconds)
1. **Change Hand Position**: Shift hand to the far left or far right of the webcam frame.
   - Show judges that the system recognizes the sign without hesitation (demonstrating **translation invariance**).
2. **Change Distance**: Move your hand closer (near) and further back (far).
   - Point out that **palm-scale normalization** keeps the prediction stable.
3. **Toggle Landmark Skeleton**: Click the **`Skeleton ON / OFF`** button on the bottom control bar to show the live MediaPipe 21-joint skeleton.
4. **Demonstrate Negative Case (No Gesture / Low Confidence)**:
   - Lower your hand: UI immediately displays `NO HAND DETECTED`.
   - Make an arbitrary non-sign gesture (e.g. scratching nose): UI displays `GESTURE UNCLEAR` rather than hallucinating a false sign.

### Step 4: Two-Way Staff Communication (30 seconds)
1. Scroll down to the **Staff-to-Visitor Bridge** panel.
2. Click the quick button **"Please show or submit your document"**.
   - The phrase appears on the timeline and plays audio.
   - The Deaf visitor sees an on-screen prompt: *"💡 Show GIVE gesture"*.
3. (Optional) Click **Staff Mic** and speak a phrase using the browser microphone.
4. Click **Export Transcript** to show audit logging of the counter interaction.

### Step 5: Wrap-up & Q&A
> *"Our pipeline operates at under 1 ms inference latency on standard CPU hardware, requires zero cloud dependencies, and achieves 80.7% accuracy across 16 official ISL service-counter classes. Thank you!"*
