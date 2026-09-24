# Hackathon Presentation: HTH-CV-09 Accessibility Bridge

## Slide 1: Title & Team
- **Project**: HTH-CV-09 — Accessibility-First Sign Language Communication Bridge
- **Theme**: Assistive Computer Vision for Public Service Delivery
- **Focus**: Predefined-Vocabulary Real-Time Indian Sign Language (ISL) Recognition

---

## Slide 2: The Problem
- Over 18 million Deaf and hard-of-hearing individuals live in India.
- In vital public service counters (hospitals, banks, civic registration, railway counters), communication barriers cause severe delays, misdiagnosis, and exclusion.
- Dedicated human sign language interpreters are expensive, scarce, and unavailable 24/7 at counter desks.

---

## Slide 3: Our Solution
- **Accessibility Bridge**: A lightweight, real-time Computer Vision application running on everyday counter PCs.
- Recognizes a predefined vocabulary of 16 high-impact Indian Sign Language (ISL) signs.
- Translates gestures into instant text (English + Devanagari Hindi) and audible speech (TTS).
- Provides a two-way staff response bridge with visual sign hints for Deaf citizens.

---

## Slide 4: System Architecture
- **Camera Ingestion**: 640x480 video feed at 15 FPS.
- **Vision Backbone**: Google MediaPipe HandLandmarker Tasks API (21 3D points per hand).
- **Geometric Engine**: Wrist-centering, palm-scale invariant normalization, joint extension angles.
- **Inference Core**: Random Forest Ensemble ($168$-dimensional geometric invariant feature vector).
- **Temporal Filter**: 7-frame rolling weighted consensus buffer.

---

## Slide 5: Dataset Sources & Provenance
- **Local Benchmark Dataset**: 61 ISL classes, 3,630 video recordings with multi-angle tilts.
- **Hugging Face Corpus (`vidit031/isl-isolated-40words`)**: Normalized isolated ISL clips with verified signer/session metadata.
- **Government Grounding (`data.gov.in`)**: Ministry of Social Justice & Empowerment / ISLRTC official dictionary catalog (`fb44b68b-babb-4ba7-b2c7-ef334162c0ac`).

---

## Slide 6: The 16-Class Service Counter Vocabulary
1. `HELLO` (Greeting)
2. `THANK_YOU` (Polite closing)
3. `GOOD_MORNING` (Morning greeting)
4. `COME` (Direction: approach desk)
5. `GIVE` (Transaction: submit doc/card)
6. `HELP` (Assistance request)
7. `PLEASE` (Polite inquiry)
8. `YES` (Confirmation)
9. `NO` (Negation)
10. `OKAY` (Status: understood)
11. `WATER` (Necessity: drinking water)
12. `DRINK` (Necessity: beverage/medicine)
13. `TEA` (Refreshment)
14. `WHERE` (Inquiry: desk/room location)
15. `WHAT_NAME` (Identification check)
16. `CLOSE` (Status: counter closed)

---

## Slide 7: Robustness & Invariance by Design
- **Background Invariance**: Uses hand kinematics exclusively; immune to wall colors, room lighting shifts, and crowd movement.
- **Distance Invariance**: Hand coordinates are scaled by palm length; works at any normal counter distance.
- **Position Invariance**: Translating hand to edges of webcam frame preserves geometric relations.
- **Orientation Tolerance**: Trained with 3D angular perturbations ($\pm 10^\circ$).

---

## Slide 8: Measured Performance & Benchmarks
- **Test Accuracy**: **80.70%** (strictly held-out recordings across independent signers).
- **Balanced Accuracy**: **76.32%**.
- **Macro F1 Score**: **75.00%**.
- **Inference Latency**: **0.12 ms/sample** on standard CPU (~8,300 FPS throughput).
- **Zero Cloud GPU Needed**: Operates 100% locally.

---

## Slide 9: Live Demo Highlights
- Real-time gesture recognition with skeleton overlay toggle.
- Multi-lingual display (English + Devanagari Hindi).
- Negative state handling: `NO_HAND` and `GESTURE_UNCLEAR` prevent false positives.
- Two-way staff microphone and quick responses with visual sign prompts.
- Offline demo mode for environments without a webcam.

---

## Slide 10: Future Roadmap & Impact
- Support for continuous sign sentence grammar parsing.
- Integration into DigiLocker & Government Common Service Centres (CSCs).
- Regional language speech synthesizer extensions (Tamil, Telugu, Bengali, Marathi).
- Edge deployment on low-cost Raspberry Pi 5 / Android kiosk hardware.
