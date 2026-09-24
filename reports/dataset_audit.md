# Dataset Audit Report: HTH-CV-09 Accessibility Bridge

**Date**: 2026-09-24  
**Target Language**: Indian Sign Language (ISL)  
**Domain Focus**: Public Service Counter / Accessibility Bridge  

## 1. Inventory Summary

- **Local Video Dataset**: 61 classes, 3630 MP4 clips  
- **Hugging Face Dataset (`vidit031/isl-isolated-40words`)**: 8 supplementary classes, 130 MP4 clips  
- **Government Reference (data.gov.in)**: Official ISLRTC Indian Sign Language Dictionary (28 resource records)  
- **Corrupt / Unreadable Files Detected**: 0  

## 2. Media Properties

### Local Dataset Video Profile
- **Resolution**: 640 x 720
- **Frame Rate**: 30.0 FPS
- **Typical Duration**: ~6.8 seconds (205 frames)
- **Structure**: 20 base takes per class + 20 left tilt + 20 right tilt variations

### Hugging Face Supplementary Video Profile
- **Resolution**: 480 x 480
- **Frame Rate**: 30.0 FPS
- **Typical Duration**: ~3.0 seconds (90 frames)
- **Structure**: Diverse real-world signers from CISLR, ISL500, and INCLUDE benchmarks

## 3. Target 16-Class Service-Counter Vocabulary Audit

| ID | Label | Display Name | Category | Primary Sources | Samples Available |
|:---|:---|:---|:---|:---|:---|
| 0 | `HELLO` | Hello / Namaste | Greeting | Local ISL + HuggingFace + ISLRTC Official | 60 |
| 1 | `THANK_YOU` | Thank You | Politeness | Local ISL + HuggingFace + ISLRTC Official | 60 |
| 2 | `GOOD_MORNING` | Good Morning | Greeting | Local ISL + ISLRTC Official | 60 |
| 3 | `COME` | Please Come | Direction | Local ISL + HuggingFace + ISLRTC Official | 60 |
| 4 | `GIVE` | Please Give | Transaction | Local ISL + ISLRTC Official | 60 |
| 5 | `HELP` | Need Help | Assistance | HuggingFace ISL + ISLRTC Official | 16 |
| 6 | `PLEASE` | Please | Politeness | HuggingFace ISL + ISLRTC Official | 18 |
| 7 | `YES` | Yes / Agree | Confirmation | HuggingFace ISL + ISLRTC Official | 17 |
| 8 | `NO` | No / Disagree | Confirmation | HuggingFace ISL + ISLRTC Official | 17 |
| 9 | `OKAY` | Okay / Understood | Status | HuggingFace ISL + ISLRTC Official | 23 |
| 10 | `WATER` | Water | Necessity | HuggingFace ISL + ISLRTC Official | 18 |
| 11 | `DRINK` | Drink | Necessity | Local ISL + HuggingFace + ISLRTC Official | 60 |
| 12 | `TEA` | Tea | Refreshment | Local ISL + HuggingFace + ISLRTC Official | 60 |
| 13 | `WHERE` | Where? / Location | Inquiry | HuggingFace ISL + ISLRTC Official | 17 |
| 14 | `WHAT_NAME` | What is your Name? | Identification | Local ISL + ISLRTC Official | 60 |
| 15 | `CLOSE` | Closed / Done | Status | Local ISL + ISLRTC Official | 60 |

## 4. Usable vs. Excluded Classes Analysis

### Highly Usable Service-Counter Classes (Selected 16)
The chosen 16 classes specifically serve a service-counter interaction (greetings, directions, requests, confirmations, basic needs) and possess visually distinct hand shapes, high landmark reliability, and consistent ISL conventions.

### Excluded Local Classes & Rationale
A total of 52 classes from the local 61-class pool were excluded from the primary 16-class MVP vocabulary. Examples:
- **Fauna & Flora** (`Bear`, `Elephant`, `Lion`, `Tiger`, `Peacock`, `Brinjal`, `Carrot`): Irrelevant to a service counter scenario.
- **High Motion / Dynamic Ambiguity** (`Jump`, `Cry`, `Volcano`): High inter-signer motion variance poorly suited for a low-latency 24-hr MVP.
- **Duplicate Semantics** (`Good afternoon` vs `Good Morning`): Kept `Good Morning` to preserve distinct decision boundaries.

## 5. Splitting and Data Leakage Mitigation

- **Group-Aware Splitting**: Videos originating from the same recording session / base recording ID (e.g. `WIN_..._Pro` with its `_left_tilt` and `_right_tilt` variations) are **strictly assigned to the same partition** (either Train, Val, or Test). This guarantees zero leakage between training and evaluation.
- **Split Ratios**: 65% Train, 15% Validation, 20% Test.

## 6. License and Usage Compliance

- **Local Dataset**: Academic/Educational research use.
- **Hugging Face Dataset**: Open research dataset (`license: other`).
- **data.gov.in**: Government Open Data License (GODL) India.
- **MediaPipe**: Apache 2.0.
