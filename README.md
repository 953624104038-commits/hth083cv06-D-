# VOXIS: Accessibility-First Sign Language Communication Bridge (HTH-CV-09)

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Python](https://img.shields.io/badge/Python-3.13-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/Frontend-React_19_Vite_Tailwind-teal.svg)](https://react.dev/)
[![MediaPipe](https://img.shields.io/badge/Computer_Vision-Google_MediaPipe_Tasks-emerald.svg)](https://developers.google.com/mediapipe)
[![Gemini 2.5 Flash](https://img.shields.io/badge/LLM-Google_Gemini_2.5_Flash-violet.svg)](https://aistudio.google.com/)
[![ISL Accuracy](https://img.shields.io/badge/ISL_Accuracy-99.39%25-green.svg)](models/isl_words_model.pkl)
[![ASL Accuracy](https://img.shields.io/badge/ASL_Accuracy-99.24%25-green.svg)](models/asl_alphabet_model.pkl)

**VOXIS** is a high-speed, dual-mode, multi-stage Sign Language Communication Terminal designed for public service counters (hospitals, banks, civic desks, transportation terminals). It recognizes Indian Sign Language (ISL) vocabulary and American Sign Language (ASL) fingerspelling in real time from a standard webcam, connects to Google Gemini 2.5 Flash for natural grammar synthesis, and translates the formed sentences into 6 major languages with native browser speech synthesis.

---

## 🌟 The 4-Stage Intelligent Communication Bridge

Our system operates across 4 coordinated AI stages:

```
[Camera Feed / Signer]
         │
         ▼
┌────────────────────────────────────────────────────────┐
│ STAGE 1: Sign Language Perception & Concept Extraction │
│   Perceives isolated gestures and converts them into   │
│   ordered concepts (e.g. Sign → "I", Sign → "Fever")   │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ STAGE 2: AI Sentence Formation (Gemini 2.5 Flash / NLP)│
│   Contextualizes concept sequences into grammatically  │
│   natural sentences (e.g. ["I", "Fever"] →             │
│   "I have a fever." or ["Need", "Doctor"] →            │
│   "I need a doctor, please.")                          │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ STAGE 3: Multilingual Translation (6 Languages)        │
│   Translates the natural sentence into:                │
│   • Tamil (தமிழ்)                                      │
│   • Hindi (हिंदी)                                      │
│   • Telugu (తెలుగు)                                    │
│   • Kannada (ಕನ್ನಡ)                                    │
│   • Malayalam (മലയാളം)                                 │
│   • English (en)                                       │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ STAGE 4: Regional Voice Synthesis (Text-to-Speech)     │
│   Synthesizes native audio using Web Speech API        │
│   so listeners immediately hear the speaker's message  │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 Triple Operating Modes

| Mode | Capability | Dataset & Model | Accuracy |
|:---|:---|:---|:---|
| **🖐️ ISL Words** | Recognizes 61 complete Indian Sign Language signs for counter interactions, emergencies, and medical needs | 61 Classes from `Video_Dataset` (4,366 vectors with flip augmentation) | **99.39%** Test Acc |
| **✨ Gemini AI Bridge** | 4-Stage pipeline: Concept accumulator → Gemini 2.5 Flash sentence formation → 6-language translation grid → Voice output | Gemini 2.5 Flash API + Zero-Latency Knowledge Base | **Instant / Zero Error** |
| **🔤 ASL Typist** | Continuous fingerspelling with hold-to-type debounce (0.4s), interactive virtual QWERTY guide, backspace, and space | 29 Classes from `asl_alphabet_train` (4,356 vectors with flip augmentation) | **99.24%** Test Acc |

---

## 🔑 Google Gemini API Key Integration

1. Click the **"Gemini Key"** button in the top navigation bar.
2. Enter your Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey) (starts with `AIzaSy...`).
3. Click **"Test & Save Key"**. The terminal will test live connection with Gemini 2.5 Flash and light up green.
4. **Zero-Error Fallback**: If an API key is not configured or an invalid key is provided, the system gracefully falls back to the deterministic offline multilingual knowledge base covering all 61 ISL signs without crashing.

---

## 📊 61-Class ISL Vocabulary Breakdown

- **Medical & Emergency**: `Fever`, `Injury`, `Doctor`, `Hospital`, `Help`, `Break`, `Fedup`, `Cry`, `Wrong`
- **Daily Needs & Dining**: `Water`, `Drink`, `Tea`, `Cook`, `Clean`, `Close`, `Come`, `Give`, `Vegetables`, `Brinjal`, `Cabbage`, `Carrot`, `Cauliflower`, `Chilli`, `Cucumber`, `Lemon`, `Onion`, `Radish`
- **Courtesies & Inquiries**: `Hello`, `Thank you`, `Good Morning`, `Good afternoon`, `What is your Name`, `Where`, `Please`, `Maybe`, `Still`
- **Service & Administration**: `Budget`, `Busy`, `Exam`, `Interview`, `Maths`, `Writer`, `Switch`, `Key`, `Knife`, `Umbrella`, `Temple`, `Karnataka`
- **Living Things & Nature**: `Bear`, `Crocodile`, `Deer`, `Elephant`, `Giraffe`, `Hug`, `Lion`, `Man`, `Monkey`, `Peacock`, `Pigeon`, `Sparrow`, `Tiger`, `Turtle`, `Uncle`, `Wife`, `Volcano`, `Jump`, `Pour`

---

## 🛠️ Quickstart

### 1. Start Backend (FastAPI on Port 8000)
```powershell
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Start Frontend (React + Vite on Port 5173)
```powershell
cd frontend
npm run dev -- --host 0.0.0.0 --port 5173
```

### 3. Open Terminal in Browser
Navigate to `http://localhost:5173` to access the full application.

---

## 🏛️ Team & Attribution
- Built for the **HTH-CV-09 Accessibility Hackathon**.
- Trained using ISLRTC national benchmarks and isolated video gesture callsets.
