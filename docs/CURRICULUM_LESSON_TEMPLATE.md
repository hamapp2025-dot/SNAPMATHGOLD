# SnapMath Lesson Template (BoldVoice-Style)

Use this template for every Grade 12 Tawjihi lesson. One completed template = one shippable lesson in the app.

**North star:** 8–12 minute total session. Short coach moment → visual math → worked example → immediate practice → recap.

**Reference lesson:** `u1-l1` (Remainder & Factor Theorems) — match this quality bar.

**Where content lands in code:** `src/data/grade12.ts`  
**Where video lands:** `assets/media/lessons/{lesson-id}-hero-subtitled-voiced.mp4`

---

## 1. Lesson metadata

| Field | Value |
|-------|-------|
| Lesson ID | e.g. `u3-l2` |
| Unit | e.g. `u3` — Differentiation |
| Title (AR) | |
| Title (EN) | |
| Book reference | Jordan Grade 12 book — chapter / page |
| Exam weight | Low / Medium / High |
| Prerequisite lessons | e.g. `u3-l1` |
| Target session length | 8–12 min total |

---

## 2. Learning objective (one sentence)

**Arabic:**  
**English:**  
Student can ______ by the end of this session.

---

## 3. Session map (BoldVoice pacing)

| Segment | Duration | Purpose | Who on screen |
|---------|----------|---------|---------------|
| A. Coach hook | 8–18s | State goal + why it matters for Tawjihi | Founder / teacher avatar |
| B. Manim core | 35–70s | One key idea, visual, no lecture drift | Animation only |
| C. Worked example | 25–45s | Jordan book notation, step-by-step | Animation + subtitles |
| D. Practice push | 10–20s | “Try 3 questions now” | Coach or text card |
| E. Recap | 8–15s | Exam tip + what to review tomorrow | Coach |

**Total target:** ______ seconds (~______ min)

---

## 4. Segment scripts

### A. Coach hook (AR + EN)

**Arabic script:**  
**English script:**  
**On-screen text (optional):**

### B. Manim core — storyboard beats

| Beat | Visual | Narration (AR) | Subtitle line (AR) |
|------|--------|----------------|-------------------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

**Manim notes for producer:** (colors, axes, labels, what NOT to show)

### C. Worked example

**Problem statement (book-style):**  
**Solution steps (numbered):**

1.
2.
3.

**Common student mistake to call out:**  
**Exam trap to mention:**

### D. Practice push (voice or card)

**Arabic:**  
**English:**

### E. Recap

**Arabic (≤2 sentences):**  
**English:**  
**“Come back tomorrow” hook:**

---

## 5. Key formulas (Sound Library + lesson card)

Add 3–6 items. Match `grade12.ts` → `keyFormulas`.

| Label (EN) | Label (AR) | Formula (textbook notation) |
|------------|------------|----------------------------|
| | | |

---

## 6. Worked examples in app (optional extra)

Add 1–2 items for `examples` array in `grade12.ts`.

### Example 1

- **Q (AR):**
- **Q (EN):**
- **Answer (AR):**
- **Answer (EN):**

---

## 7. Practice questions (minimum 12 per lesson)

Target: **12–15 MCQs** per lesson. Mix: 40% easy, 40% medium, 20% exam-style.

### Question 1

- **Q (AR):**
- **Q (EN):**
- **Options:** A) B) C) D)
- **Correct:** (0–3)
- **Explanation (AR):**
- **Explanation (EN):**

*(Copy block for Q2–Q12)*

---

## 8. Quality checklist (teacher sign-off)

- [ ] Matches Jordan Grade 12 official book notation
- [ ] No concepts outside Tawjihi scope for this unit
- [ ] Arabic is natural (not Google-translate stiff)
- [ ] One main idea per lesson (not a full chapter cram)
- [ ] Manim segment can be understood without sound
- [ ] Every MCQ has a clear wrong-answer reason in explanation
- [ ] At least 2 questions mirror past Tawjihi style
- [ ] Subtitles ≤ 12 words per line where possible
- [ ] Total session ≤ 12 minutes
- [ ] Teacher name + date on sign-off: _______________

---

## 9. Production handoff

| Deliverable | Owner | File / location |
|-------------|-------|-----------------|
| Approved script | Teacher | This doc |
| Manim render | Video producer | `manim/` |
| Voiced MP4 | Voice + pipeline | `assets/media/lessons/{id}-hero-subtitled-voiced.mp4` |
| MCQs in app | Teacher → Dev | `src/data/grade12.ts` |
| Media override sync | Dev | `npm run lessons:sync-media` |

---

## 10. Example (filled snippet — u1-l1 style)

**Lesson ID:** `u1-l1`  
**Objective (AR):** يفهم الطالب نظرية الباقي ونظرية العامل ويستخدمهما في التحليل إلى عوامل خطية.

**Coach hook (AR):** اليوم رح نتعلم أداة قوية بتختصر عليك وقت الامتحان — نظرية الباقي والعامل.

**Recap (AR):** إذا عوّضت `x = a` وطلع الباقي صفر، إذاً `(x − a)` عامل. احفظها للأسئلة السريعة.

**Exam trap:** Students forget remainder vs factor distinction when `P(a) ≠ 0`.

---

*Template version 1.0 — SnapMath Academy curriculum team*
