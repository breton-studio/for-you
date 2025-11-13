// Audio Button Component - Animated audio playback button

class ForYouAudioButton {
  constructor() {
    this.container = null;
    this.button = null;
    this.label = null;
    this.progressBar = null;
    this.audioPlayer = null;
    this.brandName = '';
    this.isVisible = false;
    this.isPlaying = false;
    this.isLoading = false;
  }

  // Create and inject audio button into page
  create(brandName = 'this brand') {
    console.log('[AudioButton] Creating audio button...');

    this.brandName = brandName;

    // Create container
    this.container = document.createElement('div');
    this.container.id = 'for-you-audio-button';
    this.container.className = 'for-you-audio-button';

    // Create button
    this.button = document.createElement('button');
    this.button.className = 'for-you-audio-btn';
    this.button.setAttribute('aria-label', `Hear ${brandName}'s story`);

    // Create progress bar (background)
    this.progressBar = document.createElement('div');
    this.progressBar.className = 'for-you-audio-progress';
    this.progressBar.style.width = '0%';

    // Create label container
    const labelContainer = document.createElement('div');
    labelContainer.className = 'for-you-audio-label-container';

    // Create label (inner text that scrolls)
    this.label = document.createElement('div');
    this.label.className = 'for-you-audio-label';
    this.label.textContent = `Hear ${brandName}'s Story`;

    labelContainer.appendChild(this.label);

    // Assemble button
    this.button.appendChild(this.progressBar);
    this.button.appendChild(labelContainer);

    // Add button to container
    this.container.appendChild(this.button);

    // Add click handler
    this.button.addEventListener('click', () => this.handleClick());

    // Add keyboard support
    this.button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.handleClick();
      }
    });

    // Inject into page
    document.body.appendChild(this.container);

    // Check if brand name is long enough to require marquee
    this.checkMarqueeNeeded();

    console.log('[AudioButton] Audio button created');
  }

  // Check if brand name requires marquee animation
  checkMarqueeNeeded() {
    if (!this.label || !this.button) return;

    // Measure text width vs button width
    const labelWidth = this.label.scrollWidth;
    const buttonWidth = this.button.clientWidth;

    // If text overflows, add marquee class
    if (labelWidth > buttonWidth - 40) { // 40px padding for margins
      this.label.classList.add('marquee');
      console.log('[AudioButton] Marquee enabled for long brand name');
    }
  }

  // Show button with animation
  show() {
    if (this.isVisible || !this.container) return;

    console.log('[AudioButton] Showing audio button');

    // Delay slightly to allow For You toggle animation to complete
    setTimeout(() => {
      this.container.classList.add('visible');
      this.isVisible = true;

      // Re-check marquee after animation completes
      setTimeout(() => this.checkMarqueeNeeded(), 1100);
    }, 1000);
  }

  // Hide button with animation
  hide() {
    if (!this.isVisible || !this.container) return;

    console.log('[AudioButton] Hiding audio button');

    this.container.classList.remove('visible');
    this.isVisible = false;

    // Stop audio if playing
    if (this.audioPlayer && this.isPlaying) {
      this.audioPlayer.pause();
    }
  }

  // Remove button from DOM
  destroy() {
    console.log('[AudioButton] Destroying audio button');

    if (this.audioPlayer) {
      this.audioPlayer.cleanup();
      this.audioPlayer = null;
    }

    if (this.container) {
      this.container.remove();
      this.container = null;
    }

    this.isVisible = false;
    this.isPlaying = false;
    this.isLoading = false;
  }

  // Load audio from data URL
  async loadAudio(audioDataUrl) {
    if (!audioDataUrl) {
      console.error('[AudioButton] No audio data URL provided');
      return;
    }

    console.log('[AudioButton] Loading audio...');

    // Create audio player if not exists
    if (!this.audioPlayer) {
      this.audioPlayer = new ForYouAudioPlayer();

      // Set up event handlers
      this.audioPlayer.onPlay(() => {
        this.setPlayingState(true);
      });

      this.audioPlayer.onPause(() => {
        this.setPlayingState(false);
      });

      this.audioPlayer.onEnded(() => {
        this.setPlayingState(false);
        this.setProgress(0);
      });

      this.audioPlayer.onProgress((progress) => {
        this.setProgress(progress);
      });

      this.audioPlayer.onError((error) => {
        console.error('[AudioButton] Audio error:', error);
        this.setLoadingState(false);
      });
    }

    try {
      this.setLoadingState(true);
      await this.audioPlayer.load(audioDataUrl);
      this.setLoadingState(false);
      console.log('[AudioButton] Audio loaded successfully');
    } catch (error) {
      console.error('[AudioButton] Failed to load audio:', error);
      this.setLoadingState(false);
    }
  }

  // Handle button click
  async handleClick() {
    if (this.isLoading || !this.audioPlayer) {
      return;
    }

    console.log('[AudioButton] Button clicked');

    try {
      await this.audioPlayer.togglePlayPause();
    } catch (error) {
      console.error('[AudioButton] Play/pause failed:', error);
    }
  }

  // Update button state to playing or paused
  setPlayingState(playing) {
    this.isPlaying = playing;

    if (!this.button || !this.label) return;

    if (playing) {
      this.button.classList.add('playing');
      this.label.textContent = 'Pause';
      this.button.setAttribute('aria-label', 'Pause story');
    } else {
      this.button.classList.remove('playing');
      this.label.textContent = `Hear ${this.brandName}'s Story`;
      this.button.setAttribute('aria-label', `Hear ${this.brandName}'s story`);
      this.checkMarqueeNeeded();
    }
  }

  // Update button loading state
  setLoadingState(loading) {
    this.isLoading = loading;

    if (!this.button) return;

    if (loading) {
      this.button.classList.add('loading');
      this.button.disabled = true;
    } else {
      this.button.classList.remove('loading');
      this.button.disabled = false;
    }
  }

  // Update progress bar (0-1)
  setProgress(progress) {
    if (!this.progressBar) return;

    const percentage = Math.round(progress * 100);
    this.progressBar.style.width = `${percentage}%`;
  }
}

// Export for use in other scripts
window.ForYouAudioButton = ForYouAudioButton;
