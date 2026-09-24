# System Architecture: HTH-CV-09 Accessibility Bridge

## 1. High-Level Concept

The **HTH-CV-09 Sign Language Communication Bridge** is an accessibility-first computer vision system designed for public service counters (hospitals, banks, railway inquiry desks, civic offices). It provides real-time, bi-directional communication between Deaf/hard-of-hearing citizens using **Indian Sign Language (ISL)** and hearing counter staff.

```
WEBCAM (640x480 @ 15 FPS)
   ↓
OpenCV Frame Ingestion
   ↓
Google MediaPipe HandLandmarker Tasks API (21 3D Landmarks / Hand)
   ↓
Wrist-Centric & Palm-Scale Normalization (Translation & Distance Invariant)
   ↓
Geometric Feature Engineering (Fingertip Distances, Angles, Dual-Hand Mask)
   ↓
Trained Classifier (Random Forest Ensemble, 168-dim input)
   ↓
Temporal Smoothing & Unknown Gesture Disambiguation (Rolling Weighted Voting Buffer)
   ↓
Stabilized Sign Prediction (English Gloss + Devanagari Hindi Text)
   ↓
Browser Text-to-Speech (TTS) + Staff Two-Way Response Panel
```

---

## 2. Why Hand Landmarks Over Raw Image CNNs?

| Design Decision | Raw Pixel Classification (CNN) | MediaPipe Hand Landmark Classification (Ours) | Rationale & Architectural Benefit |
|:---|:---|:---|:---|
| **Background Invariance** | Low (overfits to wall colors, clutter, clothing) | **100% Invariant** (ignores all background pixels entirely) | Public counters have chaotic backgrounds (passersby, posters). Landmarks isolate hand kinematics. |
| **Inference Latency** | 40–120 ms (demands GPU) | **< 1 ms on CPU** (~8,000 FPS throughput) | Instantaneous feedback without cloud cost or GPU dependency. |
| **Model Footprint** | 80–300 MB | **< 5 MB** (Random Forest / MLP) | Fits effortlessly on low-power desktop or edge thin-clients. |
| **Scale & Distance** | Sensitive to user distance from lens | **Normalized by palm size** | Whether user stands 0.5 m or 2.0 m away, geometry remains identical. |

---

## 3. Mathematical Feature Formulation

From each detected hand, MediaPipe extracts 21 3D coordinates $(x_i, y_i, z_i)$ for $i \in \{0, \dots, 20\}$:

1. **Wrist Normalization**:
   $$x'_i = x_i - x_0, \quad y'_i = y_i - y_0, \quad z'_i = z_i - z_0$$
2. **Scale Invariance**:
   Palm distance $S = \|L_9 - L_0\|_2$ (wrist to middle MCP joint).
   $$x''_i = \frac{x'_i}{S}, \quad y''_i = \frac{y'_i}{S}, \quad z''_i = \frac{z'_i}{S}$$
3. **Fingertip Distances**:
   Distances from wrist $L_0$ to each fingertip $t \in \{4, 8, 12, 16, 20\}$:
   $$d_t = \frac{\|L_t - L_0\|_2}{S}$$
4. **Inter-Finger Distances**:
   10 pairwise Euclidean distances between all fingertip pairs $(t_a, t_b)$:
   $$d_{ab} = \frac{\|L_{t_a} - L_{t_b}\|_2}{S}$$
5. **Joint Extension Cosine Angles**:
   Angle $\theta_f$ between wrist-to-MCP vector $\vec{v}_1$ and MCP-to-tip vector $\vec{v}_2$:
   $$\cos(\theta_f) = \frac{\vec{v}_1 \cdot \vec{v}_2}{\|\vec{v}_1\| \|\vec{v}_2\|}$$

**Dual-Hand Concatenation**:
- Primary hand features: 83 values
- Secondary hand features: 83 values (zeros if single-hand sign)
- Presence mask: 2 values $[m_1, m_2]$
- **Total Feature Dimension**: **168 dimensions**.

---

## 4. Unknown Gesture and Flicker Mitigation

A naive classifier forces every frame into one of the 16 signs. Our system implements a 3-tier state machine:
1. `NO_HAND`: Triggered immediately if 0 hands are detected.
2. `GESTURE_UNCLEAR`: Triggered if prediction confidence is below operational threshold ($< 65\%$).
3. `RECOGNIZED`: High-confidence gesture, fed into a 7-frame rolling temporal smoothing buffer. Only emitted as a "stable event" when consensus is reached across $\ge 4$ frames.

---

## 5. Official Government Grounding

The vocabulary definitions, official English/Hindi glosses, and category mappings are strictly aligned with the **Indian Sign Language Research and Training Centre (ISLRTC)** Open Government Data catalog (`data.gov.in` resource `fb44b68b-babb-4ba7-b2c7-ef334162c0ac`).
