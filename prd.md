This is a great project! Building a mobile-first Angular app for memory training is a perfect use case for modern web capabilities. Since you are using **Cursor AI**, the key is to provide a breakdown that is granular enough for an AI to digest in single "Context" windows, while keeping the architectural vision clear.

I have structured this response as a **Product Requirements Document (PRD)** followed by a **Phased Task Breakdown** specifically designed to be pasted into Cursor AI.

### **Product Requirements Document (PRD): Math Mastery Mini-App**

**Project Name:** HomeSchool Helper - Math Module
**Framework:** Angular (Latest Version), Standalone Components, Mobile-First CSS (Tailwind or Custom Scss).
**Goal:** Create a "drill-and-kill" style math flashcard tool that prioritizes **speed of retrieval** to ensure true memorization rather than calculation.

---

#### **1. Core Logic: The "Speed-Weighted" Algorithm**

The defining feature of this app is that "Slow" equals "Wrong".

* **Target Time:** Answers must be entered within  seconds (e.g., 3s) to be considered "Mastered".
* **Weighting:**
* **Correct & Fast:** Reduce frequency of appearance.
* **Correct & Slow:** Keep frequency high (treat as "needs practice").
* **Incorrect:** Increase frequency immediately.



#### **2. Data Model (TypeScript Interfaces)**

* **`MathSet`**: A collection of cards (e.g., "Multiplication 8s").
* **`MathCard`**: Represents a single equation (e.g., "8 x 7").
* *Properties:* `id`, `question`, `answer`, `weight` (probability of appearing), `stats` (history of speed/accuracy).



#### **3. User Flows**

* **Parent/Admin Flow:** Dashboard -> Create New Set -> Input list of sums -> Save.
* **Student Flow:** Home -> Select Set -> Start Session -> Input Answer -> Feedback (Instant) -> Next Question -> Summary Screen.

---

### **System Architecture Diagram**

This diagram illustrates the data flow for the exercise loop, which is critical for the AI to implement the logic correctly.

---

### **Task Breakdown (Cursor AI Optimized)**

You can copy and paste these phases directly into the Cursor AI chat. I have ordered them to ensure the **State Management** and **Logic** exist before the UI tries to consume them.

#### **Phase 1: Foundation & Data Structure**

*Focus: Setting up the shape of data and state management.*

1. **Create Interfaces:**
* Create a `models/math-card.model.ts` file.
* Define interfaces for `MathCard`, `MathSet`, and `SessionStats`.
* Include fields for `lastDurationMs`, `weight` (default 1), and `consecutiveCorrect`.


2. **Create Service (State):**
* Generate a service `services/math-state.service.ts`.
* Implement Signal-based state or RxJS BehaviorSubjects to hold the `currentSet` and `availableSets`.
* Add a method `mockData()` to populate the store with the Multiplication examples (3x5, 4x6, etc.) so we can test without building the Creator UI yet.



#### **Phase 2: The Core Game Loop (Logic Only)**

*Focus: The algorithm. We implement the "engine" before the visuals.*

3. **Engine Service:**
* Create `services/exercise-engine.service.ts`.
* **Task:** Implement a function `getNextCard(cards: MathCard[]): MathCard`.
* **Logic:** Use a "Weighted Random Selection" algorithm. Cards with higher `weight` should have a higher probability of being picked.


4. **Scoring Logic:**
* **Task:** Implement `submitAnswer(cardId, userAnswer, timeTakenMs)`.
* **Logic:**
* If `userAnswer != card.answer`: Mark wrong, increase `weight` significantly (e.g., +5).
* If `userAnswer == card.answer`:
* Check `timeTakenMs`.
* If `< 3000ms`: Mark "Mastered", decrease `weight` (min 1).
* If `> 3000ms`: Mark "Needs Practice", keep `weight` same or slight increase.







#### **Phase 3: The Student UI (Mobile First)**

*Focus: The actual screen the child interacts with.*

5. **Exercise Component (Layout):**
* Generate component `features/math/exercise`.
* Create a large, readable mobile layout. High contrast.
* Display the current question (e.g., "8 x 7") in the center.
* Add a numeric keypad (0-9, Enter, Backspace) on screen (better than native keyboard for mobile web apps to prevent layout shifting).


6. **Binding the Logic:**
* Connect the `ExerciseComponent` to the `ExerciseEngineService`.
* Start a timer when the question loads. Stop timer when 'Enter' is pressed.


7. **Feedback Visuals:**
* Add a CSS animation state for "Correct" (Green flash) and "Wrong" (Red shake).
* Add a "Too Slow" indicator (e.g., Turtle icon) if the answer was correct but took > 3 seconds.



#### **Phase 4: The Parent/Admin UI**

*Focus: Creating the content.*

8. **Set Creator Component:**
* Generate `features/math/set-creator`.
* Create a form to name the Set (e.g., "Hard 8s").
* Create a dynamic list input where the parent can type "3x5" and the app parses it into `question: "3 x 5"` and `answer: 15` automatically.


9. **Persistence:**
* Update `MathStateService` to save these sets to `localStorage` (so data persists between reloads).



#### **Phase 5: Polish & Enhancements**

*Focus: UX improvements.*

10. **Progress Bar:** Add a visual indicator of "Mastery" (e.g., how many cards have a weight of 1).
11. **Summary Screen:** After user quits, show a stats summary: "Fastest Answer", "Needs work on: 8x7".
12. **Settings:** Allow parent to configure the "Speed Threshold" (change from 3s to 5s etc).

---

