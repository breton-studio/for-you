/**
 * ForYouCrawlProgress
 * Manages the crawl progress UI overlay
 */

const ForYouCrawlProgress = {
  overlay: null,
  progressFill: null,
  statusText: null,
  timeText: null,
  startTime: null,

  /**
   * Initialize and show the progress overlay
   * @param {boolean} subtle - If true, shows a small non-blocking notification instead of full overlay
   */
  show(subtle = false) {
    // Remove existing overlay if present
    this.hide();

    // For background crawls, don't show any UI - completely silent
    if (subtle) {
      console.log('[ForYouCrawlProgress] Background crawl in progress (silent mode)');
      return;
    }

    // Create overlay HTML
    const overlayHTML = `
      <div id="foryou-crawl-overlay">
        <div class="foryou-crawl-container">
          <div class="foryou-crawl-icon">
            🔍
          </div>
          <h2 class="foryou-crawl-title">Building your personalized experience</h2>
          <p class="foryou-crawl-subtitle">
            Analyzing key pages to understand this business and create a perfect match for your preferences
          </p>
          <div class="foryou-crawl-progress-bar">
            <div class="foryou-crawl-progress-fill"></div>
          </div>
          <p class="foryou-crawl-status">
            <strong>Preparing...</strong>
          </p>
          <p class="foryou-crawl-time">
            Estimated time: 15-20 seconds
          </p>
        </div>
      </div>
    `;

    // Insert into page
    const container = document.createElement('div');
    container.innerHTML = overlayHTML;
    document.body.appendChild(container.firstElementChild);

    // Store references
    this.overlay = document.getElementById('foryou-crawl-overlay');
    this.progressFill = this.overlay.querySelector('.foryou-crawl-progress-fill');
    this.statusText = this.overlay.querySelector('.foryou-crawl-status');
    this.timeText = this.overlay.querySelector('.foryou-crawl-time');

    // Track start time
    this.startTime = Date.now();

    // Fade in
    setTimeout(() => {
      this.overlay.classList.add('visible');
    }, 10);

    console.log('[ForYouCrawlProgress] Progress overlay shown');
  },

  /**
   * Update progress (0-100)
   */
  updateProgress(completed, total, currentPage = '') {
    if (!this.overlay) return;

    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Update progress bar
    if (this.progressFill) {
      this.progressFill.style.width = `${percent}%`;
    }

    // Update status text
    if (this.statusText) {
      let status = '';
      if (completed === 0) {
        status = '<strong>Starting site analysis...</strong>';
      } else if (completed < total) {
        status = `<strong>Analyzing ${completed} of ${total} pages</strong>`;
        if (currentPage) {
          status += `<br><span style="color: #999; font-size: 12px;">${currentPage}</span>`;
        }
      } else {
        status = '<strong>Finalizing...</strong>';
      }
      this.statusText.innerHTML = status;
    }

    // Update time estimate
    if (this.timeText && this.startTime) {
      const elapsed = Math.round((Date.now() - this.startTime) / 1000);
      const remaining = total > 0 && completed > 0
        ? Math.round((elapsed / completed) * (total - completed))
        : 15;

      if (completed === total) {
        this.timeText.textContent = `Completed in ${elapsed} seconds`;
      } else if (remaining > 0) {
        this.timeText.textContent = `About ${remaining} seconds remaining`;
      }
    }

    console.log(`[ForYouCrawlProgress] Progress: ${completed}/${total} (${percent}%)`);
  },

  /**
   * Set custom status message
   */
  setStatus(message, isHtml = false) {
    if (!this.statusText) return;

    if (isHtml) {
      this.statusText.innerHTML = message;
    } else {
      this.statusText.textContent = message;
    }
  },

  /**
   * Hide and remove the overlay
   */
  hide() {
    if (this.overlay) {
      // Fade out
      this.overlay.classList.remove('visible');

      // Remove after transition
      setTimeout(() => {
        if (this.overlay && this.overlay.parentNode) {
          this.overlay.parentNode.removeChild(this.overlay);
        }
        this.overlay = null;
        this.progressFill = null;
        this.statusText = null;
        this.timeText = null;
        this.startTime = null;
      }, 300);

      console.log('[ForYouCrawlProgress] Progress overlay hidden');
    }
  },

  /**
   * Show error state
   */
  showError(message) {
    if (!this.overlay) return;

    const icon = this.overlay.querySelector('.foryou-crawl-icon');
    const title = this.overlay.querySelector('.foryou-crawl-title');
    const subtitle = this.overlay.querySelector('.foryou-crawl-subtitle');

    if (icon) icon.textContent = '⚠️';
    if (title) title.textContent = 'Unable to complete full analysis';
    if (subtitle) subtitle.textContent = message || 'Continuing with single-page personalization...';
    if (this.statusText) this.statusText.innerHTML = '<strong>Continuing anyway</strong>';

    // Auto-hide after 3 seconds
    setTimeout(() => this.hide(), 3000);
  },

  /**
   * Show completion state briefly before hiding
   */
  showComplete() {
    if (!this.overlay) return;

    const icon = this.overlay.querySelector('.foryou-crawl-icon');
    if (icon) {
      icon.textContent = '✓';
      icon.classList.remove('spinning');
    }

    this.updateProgress(100, 100);
    this.setStatus('<strong>Analysis complete!</strong>', true);

    // Auto-hide after 1 second
    setTimeout(() => this.hide(), 1000);
  },

  /**
   * Show waiting state while crawl completes
   * Used when user completes quiz before background crawl finishes
   */
  showWaiting() {
    // Show full overlay (not subtle)
    this.show(false);

    if (!this.overlay) return;

    // Update to "waiting" messaging
    const icon = this.overlay.querySelector('.foryou-crawl-icon');
    const title = this.overlay.querySelector('.foryou-crawl-title');
    const subtitle = this.overlay.querySelector('.foryou-crawl-subtitle');

    if (icon) {
      icon.textContent = '⏳';
      icon.classList.remove('spinning');
    }

    if (title) {
      title.textContent = 'Preparing your personalized experience';
    }

    if (subtitle) {
      subtitle.textContent = 'Gathering insights from across the site for the best possible match...';
    }

    // Show indeterminate progress (middle of bar)
    this.updateProgress(50, 100);

    if (this.statusText) {
      this.statusText.innerHTML = '<strong>Analyzing site materials...</strong>';
    }

    if (this.timeText) {
      this.timeText.textContent = 'Just a moment...';
    }

    console.log('[ForYouCrawlProgress] Showing waiting state');
  }
};

// Make available globally
window.ForYouCrawlProgress = ForYouCrawlProgress;

// Listen for crawl progress events
window.addEventListener('foryou:crawl:progress', (event) => {
  const { completed, total } = event.detail;
  ForYouCrawlProgress.updateProgress(completed, total);
});
