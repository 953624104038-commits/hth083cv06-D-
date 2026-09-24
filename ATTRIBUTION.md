# Dataset Attribution and Provenance

## 1. Local Indian Sign Language Video Dataset
- **Name**: Indian Sign Language Video Dataset (ISL 61 Classes)
- **Source**: Kaggle / Open Academic Research Corpus
- **Format**: MP4 video clips (640x720, 30.0 FPS, H.264)
- **Scope**: 61 distinct classes, 3,630 total videos (20 base recordings + 40 camera tilt variations per class)
- **License / Terms**: Academic / Research use and education.
- **Attribution**: Provided as part of the Hackathon challenge workspace. Original raw video data preserved intact in `Video_Dataset/` and `Sample Videos/`.

---

## 2. Hugging Face ISL Isolated Word Dataset
- **Name**: ISL Isolated Word Dataset (40 words)
- **Dataset ID**: [`vidit031/isl-isolated-40words`](https://huggingface.co/datasets/vidit031/isl-isolated-40words)
- **Curator**: Vidit Agarwal (`vidit031`)
- **Format**: MP4 video clips (480p, ~30 FPS) with per-clip JSON metadata.
- **Source Benchmarks**: Built from normalized subsets of CISLR, ISL500, and INCLUDE benchmark datasets.
- **License / Terms**: Open research use (`license: other`).
- **Citation / Provenance**:
  ```
  @dataset{isl_isolated_40words_2024,
    title   = {ISL Isolated Word Dataset (40 words)},
    author  = {Vidit Agarwal},
    year    = {2024},
    url     = {https://huggingface.co/datasets/vidit031/isl-isolated-40words}
  }
  ```

---

## 3. Government of India — Open Government Data (OGD) Platform
- **Portal**: [data.gov.in](https://data.gov.in/)
- **Catalog**: [Indian Sign Language Dictionary](https://data.gov.in/catalog/indian-sign-language-dictionary)
- **Resource ID**: `fb44b68b-babb-4ba7-b2c7-ef334162c0ac`
- **Publishing Authority**: 
  - Ministry of Social Justice and Empowerment
  - Department of Empowerment of Persons with Disabilities (DEPwD)
  - Indian Sign Language Research and Training Centre (ISLRTC)
- **License**: [Government Open Data License - India (GODL)](https://data.gov.in/Godl)
- **Role in Project**: Official lexical reference, standardization of ISL terminology, service-counter vocabulary grounding, and official provenance verification.

---

## 4. Google MediaPipe Vision Models
- **Model**: Google MediaPipe Hand Landmarker (`hand_landmarker.task`)
- **Provider**: Google LLC
- **License**: Apache License 2.0
- **Use**: Real-time extraction of 21 3D hand coordinates for robust, appearance-invariant gesture classification.
