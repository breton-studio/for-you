// Audio Player Manager - Handles HTML5 audio playback lifecycle

class ForYouAudioPlayer {
  constructor() {
    this.audio = null;
    this.isPlaying = false;
    this.duration = 0;
    this.currentTime = 0;
    this.onPlayCallback = null;
    this.onPauseCallback = null;
    this.onProgressCallback = null;
    this.onEndedCallback = null;
    this.onErrorCallback = null;
  }

  // Load audio from data URL
  async load(audioDataUrl) {
    console.log('[AudioPlayer] Loading audio...');

    // Clean up existing audio
    this.cleanup();

    // Create new audio element
    this.audio = new Audio(audioDataUrl);

    // Set up event listeners
    this.audio.addEventListener('loadedmetadata', () => {
      this.duration = this.audio.duration;
      console.log(`[AudioPlayer] Audio loaded: ${Math.round(this.duration)}s`);
    });

    this.audio.addEventListener('timeupdate', () => {
      this.currentTime = this.audio.currentTime;
      const progress = this.duration > 0 ? this.currentTime / this.duration : 0;

      if (this.onProgressCallback) {
        this.onProgressCallback(progress, this.currentTime, this.duration);
      }
    });

    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      console.log('[AudioPlayer] Playing');

      if (this.onPlayCallback) {
        this.onPlayCallback();
      }
    });

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      console.log('[AudioPlayer] Paused');

      if (this.onPauseCallback) {
        this.onPauseCallback();
      }
    });

    this.audio.addEventListener('ended', () => {
      this.isPlaying = false;
      this.currentTime = 0;
      console.log('[AudioPlayer] Ended');

      if (this.onEndedCallback) {
        this.onEndedCallback();
      }
    });

    this.audio.addEventListener('error', (e) => {
      console.error('[AudioPlayer] Error:', e);

      if (this.onErrorCallback) {
        this.onErrorCallback(e);
      }
    });

    // Wait for audio to be loaded
    return new Promise((resolve, reject) => {
      this.audio.addEventListener('canplaythrough', () => {
        resolve();
      }, { once: true });

      this.audio.addEventListener('error', (e) => {
        reject(e);
      }, { once: true });
    });
  }

  // Play audio
  async play() {
    if (!this.audio) {
      console.warn('[AudioPlayer] No audio loaded');
      return;
    }

    try {
      await this.audio.play();
    } catch (error) {
      console.error('[AudioPlayer] Play failed:', error);

      // Handle autoplay restrictions
      if (error.name === 'NotAllowedError') {
        console.warn('[AudioPlayer] Autoplay blocked - user interaction required');
      }

      throw error;
    }
  }

  // Pause audio
  pause() {
    if (!this.audio) {
      console.warn('[AudioPlayer] No audio loaded');
      return;
    }

    this.audio.pause();
  }

  // Toggle play/pause
  async togglePlayPause() {
    if (this.isPlaying) {
      this.pause();
    } else {
      await this.play();
    }
  }

  // Seek to position (0-1)
  seek(position) {
    if (!this.audio || this.duration === 0) {
      return;
    }

    const newTime = position * this.duration;
    this.audio.currentTime = newTime;
  }

  // Get current playback progress (0-1)
  getProgress() {
    if (!this.audio || this.duration === 0) {
      return 0;
    }

    return this.currentTime / this.duration;
  }

  // Set volume (0-1)
  setVolume(volume) {
    if (!this.audio) {
      return;
    }

    this.audio.volume = Math.max(0, Math.min(1, volume));
  }

  // Clean up audio element
  cleanup() {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio.removeAttribute('src');
      this.audio.load(); // Clear buffer
      this.audio = null;
    }

    this.isPlaying = false;
    this.duration = 0;
    this.currentTime = 0;
  }

  // Event handlers
  onPlay(callback) {
    this.onPlayCallback = callback;
  }

  onPause(callback) {
    this.onPauseCallback = callback;
  }

  onProgress(callback) {
    this.onProgressCallback = callback;
  }

  onEnded(callback) {
    this.onEndedCallback = callback;
  }

  onError(callback) {
    this.onErrorCallback = callback;
  }
}

// Export for use in other scripts
window.ForYouAudioPlayer = ForYouAudioPlayer;
