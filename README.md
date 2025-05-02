# **Video Progress Tracker Documentation**

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
- **Reset Button** – Clears all progress.

---

## **⚙️ Advanced Functionality**

### **1. How Progress is Tracked**

- **`watchedIntervals`** stores arrays of `[startTime, endTime]`.
- **`currentInterval`** tracks the currently playing segment.
- **`isTimeWatched(time)`** checks if a timestamp was already viewed.

### **2. Smart Interval Handling**

- **New Interval Starts** when:
  - Playback begins in an **unwatched** section.
  - Seeking forward to an **unwatched** part.
- **Interval Stops** when:
  - Pausing/seeking backward into a **watched** section.
  - Video ends.

### **3. Real-Time UI Updates**

- **`timeupdate` Event** triggers progress bar updates (~10fps).
- **`getTotalWatchedTime()`** calculates:
  ```javascript
  totalWatched = watchedIntervals + (currentInterval if active)
  ```
- **Smooth Transitions** with CSS (`transition: width 0.2s ease`).

---

## **🔧 Edge Cases Handled**

| Scenario             | Behavior                           |
| -------------------- | ---------------------------------- |
| **Seeking Forward**  | Starts new interval if unwatched.  |
| **Seeking Backward** | Stops tracking if rewatching.      |
| **Pausing**          | Saves progress immediately.        |
| **Resuming**         | Continues tracking if new content. |
| **Video End**        | Finalizes interval and saves.      |
