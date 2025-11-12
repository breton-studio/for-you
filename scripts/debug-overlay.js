// Debug Overlay - Shows crawl status and performance info

const ForYouDebugOverlay = {
  overlay: null,
  lines: {},

  // Create and inject debug overlay
  create() {
    if (this.overlay) return;

    this.overlay = document.createElement('div');
    this.overlay.id = 'foryou-debug-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(20px) saturate(150%);
      -webkit-backdrop-filter: blur(20px) saturate(150%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #00ff00;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      padding: 10px 12px;
      border-radius: 8px;
      z-index: 9999999;
      min-width: 250px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
      line-height: 1.4;
    `;

    document.body.appendChild(this.overlay);
    this.update('status', 'Debug: Initializing...');
  },

  // Update a specific line in the overlay
  update(key, value) {
    if (!this.overlay) this.create();

    this.lines[key] = value;
    this.render();
  },

  // Remove a line from the overlay
  remove(key) {
    delete this.lines[key];
    this.render();
  },

  // Render all lines
  render() {
    if (!this.overlay) return;

    const html = Object.entries(this.lines)
      .map(([key, value]) => `<div>${value}</div>`)
      .join('');

    this.overlay.innerHTML = html || '<div>Debug: Ready</div>';
  },

  // Hide overlay
  hide() {
    if (this.overlay) {
      this.overlay.style.display = 'none';
    }
  },

  // Show overlay
  show() {
    if (this.overlay) {
      this.overlay.style.display = 'block';
    } else {
      this.create();
    }
  },

  // Destroy overlay
  destroy() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
      this.lines = {};
    }
  }
};

// Make available globally
window.ForYouDebugOverlay = ForYouDebugOverlay;
