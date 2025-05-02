# 📺 Video Progress Tracker

## **📌 Overview**

The **Video Progress Tracker** is a lightweight, client-side JavaScript application that accurately tracks and displays a user's progress while watching a video. It focuses on **real-time progress visualization** without relying on external databases or APIs, ensuring privacy and simplicity.

### **🔹 Key Features**

✅ **Accurate Progress Tracking** – Only counts **newly watched** portions, ignoring rewound/replayed segments.  
✅ **Smooth UI Updates** – Progress bar updates in real-time while watching.  
✅ **Persistent Storage** – Uses `localStorage` to save progress between sessions.  
✅ **No Backend Needed** – Works entirely in the browser (no database/API).  
✅ **Responsive Design** – Works on desktop and mobile.

---

## **📂 Project Structure**

```
video-progress-tracker/
├── index.html          # Main HTML file
├── css/
│   └── style.css       # Styling for the progress bar & video player
└── js/
    ├── ProgressTracker.js # Core logic for tracking progress
    └── main.js         # Initializes the tracker
```

---

## **🚀 Basic Usage**

### **1. How It Works**

- The app tracks **watched intervals** (start & end times) of the video.
- If you watch a segment, it gets stored. If you rewind, it **does not** count again.
- Progress is saved in `localStorage` and persists on page refresh.

### **2. Core Logic**

- **`ProgressTracker` Class** handles:
  - Loading/saving progress (`localStorage`)
  - Detecting watched vs. unwatched segments
  - Updating the progress bar in real-time

### **3. UI Elements**

- **Video Player** – HTML5 `<video>` with controls.
- **Progress Bar** – Visual indicator of watched percentage.
- **Reset Button** – Clears all progress for testing.

---

## 🧱 Detailed Breakdown (by file)

### 📄 `index.html` – Structure & Components

Defines the core layout and elements:

- `<video id="lectureVideo">` – HTML5 video player.
- `.progress-container` – Contains:

  - `.progress-bar` – Outer bar
  - `.progress-fill` – Animated inner bar
  - `#progressText` – Shows percentage watched

- `#resetBtn` – Resets progress and video state.
- Scripts:

  ```html
  <script src="js/ProgressTracker.js"></script>
  <script src="js/main.js"></script>
  ```

---

### 🎨 `style.css` – Styling & Theming

- **Dark UI Theme** using CSS custom properties (`--dark-bg`, `--dark-text`, etc.)
- **Responsive Design** with media queries for tablets/mobile.
- **Smooth Progress Animation** via:

  ```css
  .progress-fill {
    transition: width 0.3s ease;
  }
  ```

- **Clean, modern button & layout styles** with hover/focus states.

---

### 🧠 `ProgressTracker.js` – Core Tracking Logic

The `ProgressTracker` class implements full logic for:

#### 📌 Initialization

```javascript
constructor(videoId, (storageKey = "videoProgress"));
```

- Grabs the video element by ID
- Loads any stored progress
- Sets up event listeners

#### 💾 Load/Save Progress

```js
loadProgress();
saveProgress();
```

- Saves `intervals`, `duration`, and `currentTime` to `localStorage`
- Restores them when the page is reloaded

#### 📺 Watching Detection

- **Start a New Interval** when playing forward into unseen sections:

  ```js
  handlePlayStart();
  handleSeeked();
  ```

- **Track Time Updates**:

  ```js
  handleTimeUpdate();
  ```

  - If playback is smooth and forward, current interval's `end` is extended.

- **Stop Interval** on:

  - Pause
  - Seek backward
  - Video end

  ```js
  finalizeCurrentInterval();
  ```

#### 📊 Real-Time UI Update

```js
updateUI();
```

- Calculates:

  ```js
  progress = (watchedTime / videoDuration) * 100;
  ```

- Updates:

  - `#progressFill` width
  - `#progressText` content

#### 🧠 Interval Merging

```js
mergeIntervals(intervals);
```

- Merges overlapping intervals to avoid double-counting.

#### ♻️ Reset

```js
resetProgress();
```

- Clears intervals
- Resets UI
- Resets video time to 0

---

### 🧩 `main.js` – App Entry Point

```js
document.addEventListener("DOMContentLoaded", () => {
  const tracker = new ProgressTracker("lectureVideo");
});
```

- Instantiates `ProgressTracker` once DOM is loaded.

---

## ⚙️ Edge Cases & Behaviors

| **Scenario**             | **Behavior**                               |
| ------------------------ | ------------------------------------------ |
| Seek forward (unwatched) | Starts a new watched interval              |
| Seek backward (watched)  | Pauses tracking for rewatched segments     |
| Pause                    | Finalizes the current interval             |
| Resume                   | Only resumes tracking if segment is unseen |
| End of Video             | Finalizes and saves progress               |
| Reload Page              | Restores progress from `localStorage`      |

---

## 🧪 Resetting & Testing

To test from a fresh state:

- Click the **Reset Progress** button
- All watched data is cleared
- Video jumps back to time `0`

---

### 📥 Live Demo: https://real-progress-tracker.netlify.app/
