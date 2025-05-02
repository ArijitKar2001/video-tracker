class ProgressTracker {
  constructor(videoId, storageKey = "videoProgress") {
    this.video = document.getElementById(videoId);
    this.storageKey = storageKey;
    this.watchedIntervals = [];
    this.currentInterval = null;
    this.videoDuration = 0;
    this.lastPosition = 0;
    this.isSeeking = false;
    this.uiUpdateInterval = null;
    this.lastValidTime = 0;
    this.minIntervalDuration = 0.5; // seconds

    this.loadProgress();
    this.setupEventListeners();
  }

  loadProgress() {
    const savedData = localStorage.getItem(this.storageKey);
    if (savedData) {
      try {
        const { intervals, duration, currentTime } = JSON.parse(savedData);
        this.watchedIntervals = this.mergeIntervals(intervals || []);
        this.videoDuration = duration || 0;
        this.video.currentTime = currentTime || 0;
        this.lastPosition = currentTime || 0;
        this.lastValidTime = currentTime || 0;
        this.updateUI();
      } catch (e) {
        console.error("Failed to load progress:", e);
      }
    }
  }

  saveProgress() {
    const data = {
      intervals: this.watchedIntervals,
      duration: this.videoDuration,
      currentTime: this.video.currentTime,
    };
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  setupEventListeners() {
    this.video.addEventListener("loadedmetadata", () => {
      this.videoDuration = this.video.duration;
      this.updateUI();
    });

    this.video.addEventListener("play", () => {
      this.handlePlayStart();
      this.startUIUpdates();
    });

    this.video.addEventListener("pause", () => {
      this.finalizeCurrentInterval();
      this.stopUIUpdates();
      this.saveProgress();
    });

    this.video.addEventListener("seeking", () => {
      this.isSeeking = true;
      this.finalizeCurrentInterval();
    });

    this.video.addEventListener("seeked", () => {
      this.isSeeking = false;
      this.handleSeeked();
      if (!this.video.paused) this.startUIUpdates();
    });

    this.video.addEventListener("timeupdate", () => {
      this.handleTimeUpdate();
      this.updateUI(); // Always update UI on timeupdate for real-time feedback
    });

    this.video.addEventListener("ended", () => {
      this.finalizeCurrentInterval();
      this.stopUIUpdates();
      this.saveProgress();
    });

    document.getElementById("resetBtn").addEventListener("click", () => {
      this.resetProgress();
    });
  }

  isTimeWatched(time) {
    return this.watchedIntervals.some(
      ([start, end]) => time >= start && time <= end
    );
  }

  handlePlayStart() {
    const currentTime = this.video.currentTime;
    if (!this.isTimeWatched(currentTime)) {
      this.startNewInterval(currentTime);
      this.lastValidTime = currentTime;
    }
  }

  handleSeeked() {
    const currentTime = this.video.currentTime;
    if (!this.video.paused && !this.isTimeWatched(currentTime)) {
      this.startNewInterval(currentTime);
      this.lastValidTime = currentTime;
    }
  }

  handleTimeUpdate() {
    const currentTime = this.video.currentTime;
    const delta = currentTime - this.lastValidTime;

    // Only count smooth forward playback (not jumps)
    if (!this.isSeeking && delta > 0 && delta < 1.0) {
      if (this.currentInterval) {
        this.currentInterval.end = currentTime;
      } else if (!this.isTimeWatched(currentTime)) {
        this.startNewInterval(currentTime);
      }
      this.lastValidTime = currentTime;
    }

    this.lastPosition = currentTime;
  }

  startNewInterval(startTime) {
    if (this.isTimeWatched(startTime)) return;
    this.currentInterval = {
      start: startTime,
      end: startTime,
    };
  }

  finalizeCurrentInterval() {
    if (!this.currentInterval) return;

    const duration = this.currentInterval.end - this.currentInterval.start;
    if (duration >= this.minIntervalDuration) {
      this.addWatchedInterval(
        this.currentInterval.start,
        this.currentInterval.end
      );
    }

    this.currentInterval = null;
  }

  addWatchedInterval(start, end) {
    if (start >= end) return;
    this.watchedIntervals = this.mergeIntervals([
      ...this.watchedIntervals,
      [start, end],
    ]);
  }

  mergeIntervals(intervals) {
    if (intervals.length === 0) return [];

    intervals.sort((a, b) => a[0] - b[0]);
    const merged = [intervals[0]];

    for (let i = 1; i < intervals.length; i++) {
      const last = merged[merged.length - 1];
      const current = intervals[i];

      if (current[0] <= last[1]) {
        last[1] = Math.max(last[1], current[1]);
      } else {
        merged.push(current);
      }
    }

    return merged;
  }

  startUIUpdates() {
    this.stopUIUpdates();
    this.uiUpdateInterval = setInterval(() => {
      this.updateUI();
    }, 100);
  }

  stopUIUpdates() {
    if (this.uiUpdateInterval) {
      clearInterval(this.uiUpdateInterval);
      this.uiUpdateInterval = null;
    }
  }

  getTotalWatchedTime() {
    let total = this.watchedIntervals.reduce(
      (total, [start, end]) => total + (end - start),
      0
    );

    // Include current interval if valid
    if (this.currentInterval && !this.isSeeking) {
      total += this.currentInterval.end - this.currentInterval.start;
    }

    return total;
  }

  calculateProgress() {
    if (!this.videoDuration) return 0;
    return Math.min(
      100,
      (this.getTotalWatchedTime() / this.videoDuration) * 100
    );
  }

  updateUI() {
    const progress = this.calculateProgress();
    const progressFill = document.getElementById("progressFill");
    const progressText = document.getElementById("progressText");

    progressFill.style.width = `${progress}%`;
    progressText.textContent = `${progress.toFixed(1)}%`;

    progressFill.style.transition =
      this.video.paused || this.isSeeking ? "none" : "width 0.2s ease";
  }

  resetProgress() {
    this.watchedIntervals = [];
    this.currentInterval = null;
    this.video.currentTime = 0;
    this.lastValidTime = 0;
    this.updateUI();
    this.saveProgress();
  }
}
