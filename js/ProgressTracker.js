class ProgressTracker {
  constructor(videoId, storageKey = "videoProgress") {
    this.video = document.getElementById(videoId);
    this.storageKey = storageKey;
    this.watchedIntervals = [];
    this.currentInterval = null;
    this.videoDuration = 0;
    this.lastUpdateTime = 0;
    this.uiUpdateInterval = null;
    this.isSeeking = false;

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
      this.updateUI();
    }

    if (!this.videoDuration && this.video.duration) {
      this.videoDuration = this.video.duration;
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
      // Only start new interval if not in already watched portion
      if (!this.isInWatchedPortion(this.video.currentTime)) {
        this.startNewInterval();
      }
      this.startUIUpdates();
    });

    this.video.addEventListener("pause", () => {
      this.endCurrentInterval();
      this.stopUIUpdates();
      this.saveProgress();
    });

    this.video.addEventListener("seeking", () => {
      this.isSeeking = true;
      this.endCurrentInterval();
      this.stopUIUpdates();
    });

    this.video.addEventListener("seeked", () => {
      this.isSeeking = false;
      // Only start new interval if not in already watched portion
      if (
        !this.video.paused &&
        !this.isInWatchedPortion(this.video.currentTime)
      ) {
        this.startNewInterval();
      }
      if (!this.video.paused) {
        this.startUIUpdates();
      }
    });

    this.video.addEventListener("timeupdate", () => {
      // If we enter watched portion during playback, end current interval
      if (
        this.currentInterval &&
        this.isInWatchedPortion(this.video.currentTime)
      ) {
        this.endCurrentInterval();
      }
    });

    this.video.addEventListener("ended", () => {
      this.endCurrentInterval();
      this.stopUIUpdates();
      this.saveProgress();
    });

    document.getElementById("resetBtn").addEventListener("click", () => {
      this.resetProgress();
    });
  }

  isInWatchedPortion(time) {
    return this.watchedIntervals.some(
      ([start, end]) => time >= start && time <= end
    );
  }

  startUIUpdates() {
    this.stopUIUpdates();
    this.uiUpdateInterval = setInterval(() => this.updateUI(), 100);
  }

  stopUIUpdates() {
    if (this.uiUpdateInterval) {
      clearInterval(this.uiUpdateInterval);
      this.uiUpdateInterval = null;
    }
  }

  startNewInterval() {
    if (
      !this.currentInterval &&
      !this.isInWatchedPortion(this.video.currentTime)
    ) {
      this.currentInterval = {
        start: this.video.currentTime,
        end: this.video.currentTime,
      };
    }
  }

  endCurrentInterval() {
    if (this.currentInterval) {
      this.currentInterval.end = this.video.currentTime;

      if (this.currentInterval.end - this.currentInterval.start >= 0.5) {
        this.addWatchedInterval(
          this.currentInterval.start,
          this.currentInterval.end
        );
      }

      this.currentInterval = null;
    }
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

    // Add current playback time if watching new content
    if (this.currentInterval && !this.video.paused && !this.isSeeking) {
      total += this.video.currentTime - this.currentInterval.start;
    }

    return total;
  }

  calculateProgress() {
    if (!this.videoDuration) return 0;
    const watched = this.getTotalWatchedTime();
    return Math.min(100, (watched / this.videoDuration) * 100);
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
