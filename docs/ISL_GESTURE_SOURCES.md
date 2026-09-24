# Indian Sign Language (ISL) Gesture Reference & Authoritative Sources

## 1. Authoritative Institutional Sources

This project prioritizes official Indian Sign Language authorities and standardized educational materials:

1. **Indian Sign Language Research and Training Centre (ISLRTC)**
   - **Entity**: Autonomous body under the Department of Empowerment of Persons with Disabilities (Divyangjan), Ministry of Social Justice and Empowerment, Government of India.
   - **Official Portal**: [https://islrtc.nic.in/](https://islrtc.nic.in/)
   - **Dictionary Repository**: 10,000-term official ISL Video Dictionary (Categories: Everyday, Academic, Medical, Legal, Technical, Agricultural).
   - **NCERT DIKSHA Collaboration**: [https://diksha.gov.in/](https://diksha.gov.in/) — Digital infrastructure hosting ISL terms for inclusive education.
   - **YouTube Official Channel**: [@ISLRTC17](https://www.youtube.com/@ISLRTC17)

2. **Faculty of Disability Management and Special Education (FDMSE), Ramakrishna Mission Vivekananda Educational and Research Institute (RKMVERI)**
   - **Dictionary Portal**: [https://indiansignlanguage.org/](https://indiansignlanguage.org/)
   - **Scope**: Comprehensive digital Indian Sign Language dictionary with video demonstrations for everyday conversational, banking, medical, and administrative terms.

3. **India Signing Hands (ISH Shiksha)**
   - **Portal**: [https://ishshiksha.com/](https://ishshiksha.com/)
   - **Educational Scope**: ISL basic, advanced, and conversational modules, emergency signs, and public utility communication.

---

## 2. Linguistic Note on ISL & Regional Variation

> [!IMPORTANT]
> As documented by ISLRTC and linguistic research on Indian Sign Language:
> - **ISL is a natural, full-fledged visual-spatial language** with its own distinct grammar, syntax, and morphology, completely separate from American Sign Language (ASL) and British Sign Language (BSL).
> - **Regional Variation**: ISL exhibits natural dialectal and regional variations across different states and communities in India (e.g., Delhi/Northern, Mumbai/Western, Kolkata/Eastern, and Bengaluru/Chennai/Southern sign variations).
> - Therefore, multiple visual forms for a concept can be legitimate ISL signs. The forms documented below represent widely recognized standard forms as cataloged by ISLRTC and FDMSE.
> - **ASL vs. ISL Distinction**: ASL one-handed fingerspelling (A-Z) is treated as a separate mode in this project and is never conflated with ISL lexical signs.

---

## 3. Supported Vocabulary (61 Classes in Trained ISL Model)

The current trained ISL model (`models/isl_words_model.pkl`) contains **61 classes** trained on 194 geometric/kinematic landmark features. Below is the complete authoritative documentation for every class:

| # | Model Label | English Meaning / Concept | ISL Sign Description (Standard ISLRTC / FDMSE) | Hands | Type | Source & Verification Notes |
|---|-------------|---------------------------|------------------------------------------------|-------|------|-----------------------------|
| 1 | **Hello** | Greeting / Welcome | Open flat hand held near temple/forehead, moving outward in a salute-like wave or palm forward gentle wave; also Namaste (two hands joined at chest). | 1 or 2 | Static/Dynamic | ISLRTC Everyday Signs; FDMSE Greeting. Very stable landmark signature. |
| 2 | **Good Morning** | Greeting | "Good" (thumbs up or flat hand at chin moving forward) followed by "Morning" (flat hand rising like sun or open hand facing upward). | 1 or 2 | Compound/Dynamic | ISLRTC & FDMSE Greetings. |
| 3 | **Good afternoon** | Greeting | "Good" followed by midday sun sign (hand upright at zenith). | 1 or 2 | Compound/Dynamic | ISLRTC Daily Vocabulary. |
| 4 | **Thank you** | Expression of gratitude | Flat open hand placed fingers touching chin/lips, then moving outward toward recipient. | 1 | Dynamic | ISLRTC & FDMSE Courtesy signs. High landmark reliability. |
| 5 | **Come** | Beckoning / Calling | Hand held palm facing signer, fingers curling inwards beckoning toward body. | 1 | Dynamic | ISLRTC Everyday Actions. Distinct palm-facing orientation. |
| 6 | **Give** | Offer / Hand over | Open cupped hand(s) moving from signer outward toward conversational partner. | 1 or 2 | Dynamic | ISLRTC Functional Verbs; FDMSE Common Actions. |
| 7 | **Drink** | Drinking liquid | "C"-shaped hand or fist with thumb near mouth, tilted as if holding a small cup or tumbler to mouth. | 1 | Static/Hold | ISLRTC Food & Beverage; FDMSE Daily Living. Highly reliable single-hand hold. |
| 8 | **Tea** | Beverage (Chai) | One hand holds imaginary saucer (flat palm upward), other hand pinches imaginary cup/teabag stirring or lifting to lips. | 2 | Static/Dynamic | ISLRTC Everyday Terms; FDMSE Food. Two-hand spatial separation is distinct. |
| 9 | **Water** | Water / Drinking | Flat hand near chin with fingers vibrating, or "W" index-middle-ring tapping chin (regional variation in educational settings). | 1 | Static/Dynamic | ISLRTC Basic Needs. Model recognizes the held finger posture. |
| 10 | **What is your Name** | Inquiry / Identity | Index finger pointing or "Name" sign (two fingers tapping) followed by questioning open palms shrugging posture. | 1 or 2 | Compound | ISLRTC Conversational phrases; FDMSE Administrative. |
| 11 | **Fever** | Medical / Illness | Back of dominant hand placed against forehead or neck to check body temperature. | 1 | Static/Hold | ISLRTC Medical Dictionary; FDMSE Health. Forehead-adjacent sign. |
| 12 | **Injury** | Medical / Wound | Index fingers or hands pointing to body site, twisting or showing broken surface/bandage gesture. | 1 or 2 | Dynamic | ISLRTC Medical & Emergency Vocabulary. |
| 13 | **Clean** | Hygiene / Sanitary | Flat dominant palm brushing smoothly across flat non-dominant palm facing upward. | 2 | Dynamic | ISLRTC Household & Hygiene; FDMSE Actions. |
| 14 | **Close** | Action / Door / Box | Two open palms facing each other brought together in contact, closing the space. | 2 | Dynamic/Hold | ISLRTC Daily Verbs. High dual-hand contact signature. |
| 15 | **Break** | Action / Snap / Interruption | Two fists held together as if holding a stick, then snapping downward/outward. | 2 | Dynamic | ISLRTC Verbs. Distinct dual-fist relative orientation. |
| 16 | **Cook** | Food preparation | Flat hand turning over non-dominant palm, imitating flipping flatbread (roti) on a tawa. | 2 | Dynamic | ISLRTC Culinary Vocabulary; FDMSE Home Science. |
| 17 | **Knife** | Tool / Cutlery | Index and middle finger of dominant hand slicing along index finger of non-dominant hand. | 2 | Dynamic | ISLRTC Household Items. Dual-hand relative coordinate key. |
| 18 | **Key** | Tool / Lock | Thumb and bent index finger twisting in an imaginary lock mechanism. | 1 | Static/Dynamic | ISLRTC Everyday Objects. |
| 19 | **Switch** | Action / Electric | Thumb or index finger flipping upward/downward on an imaginary wall switch. | 1 | Static/Dynamic | ISLRTC Home & Electricity. |
| 20 | **Temple** | Religious / Place | Hands joined in prayer (Namaste/Anjali mudra) with fingers pointing upward. | 2 | Static/Hold | ISLRTC Places & Culture; FDMSE Indian Culture. Highly stable two-hand pose. |
| 21 | **Busy** | Status / Occupation | Dominant "B" or flat hand rapidly moving side-to-side across non-dominant wrist or body. | 1 or 2 | Dynamic | ISLRTC Work & Employment. |
| 22 | **Fedup** | Emotion / Frustration | Flat hand held at throat/chin level, palm down, indicating "up to here" / full up. | 1 | Static/Hold | ISLRTC Emotional Expressions; FDMSE Psychological. |
| 23 | **Cry** | Emotion / Tear | Index fingers tracing path of tears downward from under eyes along cheeks. | 1 or 2 | Dynamic | ISLRTC Emotions. Hand near face; requires sensitive spatial validator. |
| 24 | **Exam** | Academic / Test | Flat hands forming writing surface and pencil writing, or two hands forming question boxes. | 2 | Dynamic | ISLRTC Academic Terms (NCERT/DIKSHA). |
| 25 | **Interview** | Professional | Two people facing each other depicted by two index fingers or "I" hands pointing back and forth. | 2 | Dynamic | ISLRTC Employment & Higher Education. |
| 26 | **Jump** | Action / Movement | Two bent fingers ("legs") on open flat palm leaping upward. | 2 | Dynamic | ISLRTC Physical Actions; FDMSE Verbs. |
| 27 | **Karnataka** | Geography / State | Regional state sign: specific initial handshape or emblem gesture representing Karnataka. | 1 or 2 | Regional | ISLRTC Indian States & Union Territories series. |
| 28 | **Lemon** | Food / Citrus | Fist near mouth twisting as if squeezing a lemon half, often with pucker facial expression. | 1 | Static/Dynamic | ISLRTC Fruits & Vegetables. |
| 29 | **Man** | Person / Gender | Hand touching chin/side of face indicating beard or moustache line. | 1 | Static/Dynamic | ISLRTC People & Family; FDMSE Social terms. |
| 30 | **Wife** | Person / Relation | "Woman" (pinching ear or cheek) combined with "Marry" (interlocking hands) or ring finger touch. | 1 or 2 | Compound | ISLRTC Family Relationships. |
| 31 | **Uncle** | Person / Relation | Specific family sign near face/moustache or fingerspelling compound. | 1 | Static/Dynamic | ISLRTC Family. |
| 32 | **Maths** | Academic Subject | Fingers tapping or sliding calculating gestures (representing calculation / abacus). | 2 | Dynamic | ISLRTC School Subjects (DIKSHA). |
| 33 | **Maybe** | Modal / Uncertainty | Open flat hands held palm-up rocking gently like a balance scale. | 2 | Dynamic/Hold | ISLRTC Discourse Markers; FDMSE Common Expressions. |
| 34 | **Wrong** | Evaluation / Error | "Y" hand or crossed index fingers tapping chin or crossing over chest. | 1 or 2 | Static/Hold | ISLRTC General Vocabulary. |
| 35 | **Still** | Aspect / Continuation | Both hands with "Y" or flat shape moving forward smoothly maintaining level. | 2 | Dynamic | ISLRTC Grammar & Discourse. |
| 36 | **Budget** | Finance / Admin | Money gesture (rubbing thumb & fingers) followed by paper or book sign. | 2 | Compound | ISLRTC Banking & Economics series. |
| 37 | **Writer** | Profession | Mime writing on open palm with index/pencil grip followed by person/agentive marker. | 2 | Compound | ISLRTC Occupations; FDMSE Professional. |
| 38 | **Hug** | Emotion / Action | Both arms crossing chest hugging body, or two curved hands clasping together. | 2 | Static/Hold | ISLRTC Social & Emotional terms. |
| 39 | **Pour** | Action / Kitchen | Hand tilted as if pouring water from a pitcher or jug into a container. | 1 or 2 | Dynamic | ISLRTC Kitchen Actions; FDMSE Verbs. |
| 40 | **Umbrella** | Object / Weather | One hand above head curved like canopy, other holding shaft, or two hands sliding open umbrella shaft. | 2 | Dynamic/Hold | ISLRTC Everyday Objects & Weather. |
| 41 | **Volcano** | Geography / Nature | Mountain shape formed with hands, then fingers erupting upward and spreading out. | 2 | Dynamic | ISLRTC Science Terms (NCERT). |
| 42 | **Vegetables** | Food Category | Mime cutting or generic garden sign; category term. | 2 | Compound | ISLRTC Food & Agricultural Vocabulary. |
| 43 | **Brinjal** | Vegetable (Eggplant) | Showing oval shape of eggplant and stem touch at crown. | 1 or 2 | Static/Hold | ISLRTC Vegetables series. |
| 44 | **Cabbage** | Vegetable | Two curved hands meeting to form a round head, or peeling outer leaves gesture. | 2 | Static/Hold | ISLRTC Vegetables series. |
| 45 | **Carrot** | Vegetable | Fist held at mouth biting while holding long tapered root, or peeling carrot. | 1 | Static/Dynamic | ISLRTC Vegetables series. |
| 46 | **Cauliflower** | Vegetable | Round flower head shape opened outward with textured fingers. | 2 | Static/Hold | ISLRTC Vegetables series. |
| 47 | **Chilli** | Vegetable / Spice | Pinching small elongated shape at lips and waving hand at mouth (hot/spicy). | 1 | Dynamic | ISLRTC Vegetables & Spices. |
| 48 | **Cucumber** | Vegetable | Showing long cylinder between hands, slicing gesture. | 2 | Dynamic | ISLRTC Vegetables. |
| 49 | **Onion** | Vegetable | Twisting knuckle at eye indicating tear-inducing vegetable. | 1 | Dynamic | ISLRTC Vegetables. |
| 50 | **Radish** | Vegetable | Showing white root pulled from ground and tapered shape. | 1 or 2 | Static/Dynamic | ISLRTC Vegetables. |
| 51 | **Bear** | Animal / Wildlife | Crossed arms on chest with curved claws scratching shoulders. | 2 | Static/Hold | ISLRTC Animals series; FDMSE Nature. |
| 52 | **Crocodile** | Animal / Reptile | Arms extended forward like upper and lower jaws clapping shut. | 2 | Dynamic | ISLRTC Wildlife series. |
| 53 | **Deer** | Animal / Wildlife | Open hands with spread fingers held at temples like antlers. | 2 | Static/Hold | ISLRTC Animals. High landmark visibility. |
| 54 | **Elephant** | Animal / Wildlife | Arm curved from nose outward tracing the shape of an elephant trunk. | 1 | Dynamic | ISLRTC Animals; FDMSE Wildlife. |
| 55 | **Giraffe** | Animal / Wildlife | Arm extended vertically upward indicating a tall elongated neck. | 1 | Static/Hold | ISLRTC Animals. |
| 56 | **Lion** | Animal / Wildlife | Curved claw hands framing head depicting majestic lion mane. | 2 | Static/Hold | ISLRTC Animals. |
| 57 | **Monkey** | Animal / Wildlife | Hands scratching sides of ribcage/underarms in classic primate gesture. | 2 | Dynamic | ISLRTC Animals. |
| 58 | **Peacock** | Bird / National Emblem | Hands held behind back or fanned out like peacock tail feathers. | 2 | Static/Hold | ISLRTC Birds series; FDMSE National Symbols. |
| 59 | **Pigeon** | Bird | Fist at chin pecking with index finger or fluttering wings. | 1 or 2 | Dynamic | ISLRTC Birds. |
| 60 | **Sparrow** | Bird | Small beak formed with thumb and index finger chirping. | 1 | Dynamic | ISLRTC Birds. |
| 61 | **Tiger** | Animal / Wildlife | Hands clawed drawing stripes across cheeks. | 2 | Dynamic | ISLRTC Animals; FDMSE Wildlife. |

---

## 4. Curated Demo Vocabulary (Service Counter & Live Expo Subset)

For the live judge demonstration, the following core functional subsets are recommended because they:
1. Feature high inter-class distinctiveness in landmark space.
2. Are immediately recognizable to both hearing judges and Deaf observers.
3. Form coherent, realistic sentences for public service counters (e.g. government office, hospital, railway reception).

### Demo Subset A: Reception & Assistance
- **Hello**
- **Help** (via Give / What is your Name)
- **What is your Name**
- **Thank you**
- **Good Morning**

### Demo Subset B: Hospital & Medical Help
- **Hello**
- **Fever**
- **Injury**
- **Drink** / **Tea**
- **Thank you**

### Demo Subset C: Hospitality & Refreshment
- **Good Morning**
- **Tea**
- **Water**
- **Clean**
- **Thank you**

---

## 5. Reference / Guide Only (Not in Current 61-Class Model)

The following concepts are common in ISLRTC dictionaries but are **NOT** present in `models/isl_words_model.pkl`. The UI explicitly marks them as **"Reference / Dictionary Only"** so users and judges understand the model's actual boundaries:
- *Doctor* (ISLRTC uses pulse check or stethoscope; in model use `Fever` or `Injury` for medical demo)
- *Medicine* (ISLRTC uses pill on tongue or mortar pestle; in model use `Drink` / `Fever`)
- *Police* (ISLRTC uses shoulder badge check)
- *Stop* (FDMSE uses flat palm stop; in model use `Close` or ASL)
- *Where* (Two open palms swaying side-to-side)
- *Yes / No* (Nodding fist / waving index; model focuses on lexical nouns/verbs)

---

## 6. Attribution and Rights

- **ISLRTC Materials**: Indian Sign Language Research and Training Centre (ISLRTC), Department of Empowerment of Persons with Disabilities, Ministry of Social Justice and Empowerment, Government of India. Referenced under Fair Dealing / Public Information for accessibility research and educational demonstration.
- **FDMSE Materials**: Faculty of Disability Management and Special Education, RKMVERI. Educational open dictionary.
- No proprietary copyrighted media files are bundled into the repository. Visual guides use procedural SVG diagrams and authoritative external reference links.
