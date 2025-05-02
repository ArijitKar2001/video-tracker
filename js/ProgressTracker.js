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

    this.loadProgress();
    this.setupEventListeners();
  }

  loadProgress() {
    const savedData = localStorage.getItem(this.storageKey);
    if (savedData) {
      const { intervals, duration, currentTime } = JSON.parse(savedData);
      this.watchedIntervals = intervals || [];
      this.videoDuration = duration || 0;
      this.video.currentTime = currentTime || 0;
      this.lastPosition = currentTime || 0;
      this.updateUI();
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
      this.checkAndStartNewInterval();
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
      this.checkAndStartNewInterval();
      if (!this.video.paused) this.startUIUpdates();
    });

    this.video.addEventListener("timeupdate", () => {
      const currentTime = this.video.currentTime;

      // Update current interval if exists
      if (this.currentInterval) {
        this.currentInterval.end = currentTime;
      }

      // Check if we moved backward into watched portion
      if (currentTime < this.lastPosition) {
        if (this.isTimeWatched(currentTime)) {
          this.finalizeCurrentInterval();
        } else {
          this.checkAndStartNewInterval();
        }
      }

      // Check if we entered unwatched territory while playing
      if (
        !this.currentInterval &&
        !this.isTimeWatched(currentTime) &&
        !this.video.paused
      ) {
        this.startNewInterval(currentTime);
      }

      this.lastPosition = currentTime;
      this.updateUI();
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

  checkAndStartNewInterval() {
    const currentTime = this.video.currentTime;
    if (
      !this.currentInterval &&
      !this.isTimeWatched(currentTime) &&
      !this.isSeeking &&
      !this.video.paused
    ) {
      this.startNewInterval(currentTime);
    }
  }

  startNewInterval(startTime) {
    this.currentInterval = {
      start: startTime,
      end: startTime,
    };
  }

  finalizeCurrentInterval() {
    if (this.currentInterval) {
      this.currentInterval.end = this.video.currentTime;

      // Only add if interval is meaningful (≥0.5 seconds) and not in watched portion
      if (
        this.currentInterval.end - this.currentInterval.start >= 0.5 &&
        !this.isTimeWatched(this.currentInterval.start)
      ) {
        this.addWatchedInterval(
          this.currentInterval.start,
          this.currentInterval.end
        );
      }

      this.currentInterval = null;
    }
  }

  startUIUpdates() {
    this.stopUIUpdates();
    this.uiUpdateInterval = setInterval(() => this.updateUI(), 100);
  }

  stopUIUpdates() {
    clearInterval(this.uiUpdateInterval);
    this.uiUpdateInterval = null;
  }

  addWatchedInterval(start, end) {
    if (start >= end) return;

    const newInterval = [start, end];
    let intervals = [...this.watchedIntervals, newInterval];

    intervals.sort((a, b) => a[0] - b[0]);
    const merged = [];

    for (const interval of intervals) {
      if (!merged.length) {
        merged.push([...interval]);
      } else {
        const last = merged[merged.length - 1];
        if (interval[0] <= last[1]) {
          last[1] = Math.max(last[1], interval[1]);
        } else {
          merged.push([...interval]);
        }
      }
    }

    this.watchedIntervals = merged;
  }

  getTotalWatchedTime() {
    let total = this.watchedIntervals.reduce(
      (sum, [start, end]) => sum + (end - start),
      0
    );

    // Add current interval if it's valid new content
    if (
      this.currentInterval &&
      !this.isTimeWatched(this.currentInterval.start) &&
      this.currentInterval.end - this.currentInterval.start >= 0
    ) {
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
    this.updateUI();
    this.saveProgress();
  }
}
