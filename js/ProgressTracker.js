class ProgressTracker {
  constructor(videoId, storageKey = "videoProgress") {
    this.video = document.getElementById(videoId);
    this.storageKey = storageKey;
    this.watchedIntervals = [];
    this.currentInterval = null;
    this.videoDuration = 0;
    this.seekStartTime = 0;

    this.loadProgress();
    this.setupEventListeners();
  }

  loadProgress() {
    const savedData = localStorage.getItem(this.storageKey);
    if (savedData) {
      const { intervals, duration, currentTime } = JSON.parse(savedData);
      this.watchedIntervals = intervals;
      this.videoDuration = duration;
      this.video.currentTime = currentTime || 0;
      this.updateProgressDisplay();
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
      this.updateProgressDisplay();
    });

    this.video.addEventListener("play", () => {
      this.startNewInterval();
    });

    this.video.addEventListener("pause", () => {
      this.endCurrentInterval();
      this.saveProgress();
    });

    this.video.addEventListener("seeking", () => {
      this.seekStartTime = this.video.currentTime;
      this.endCurrentInterval();
    });

    this.video.addEventListener("seeked", () => {
      this.startNewInterval();
    });

    this.video.addEventListener("timeupdate", () => {
      this.updateProgressDisplay();
    });

    this.video.addEventListener("ended", () => {
      this.endCurrentInterval();
      this.saveProgress();
    });

    document.getElementById("resetBtn").addEventListener("click", () => {
      this.resetProgress();
    });
  }

  startNewInterval() {
    if (!this.currentInterval) {
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
    this.updateProgressDisplay();
  }

  calculateWatchedTime() {
    return this.watchedIntervals.reduce(
      (total, [start, end]) => total + (end - start),
      0
    );
  }

  calculateProgress() {
    if (!this.videoDuration) return 0;
    const watched = this.calculateWatchedTime();
    return Math.min(100, (watched / this.videoDuration) * 100);
  }

  updateProgressDisplay() {
    const progress = this.calculateProgress();
    document.getElementById("progressFill").style.width = `${progress}%`;
    document.getElementById("progressText").textContent = `${progress.toFixed(
      1
    )}%`;
  }

  resetProgress() {
    this.watchedIntervals = [];
    this.currentInterval = null;
    this.video.currentTime = 0;
    this.updateProgressDisplay();
    this.saveProgress();
  }
}
