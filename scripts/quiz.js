// Quiz.js - Conversational quiz flow and logic

const ForYouQuiz = {
  currentQuestion: 0,
  answers: {},
  transformationComplete: false,
  transformationPromise: null,

  questions: [
    {
      id: 'decisionStyle',
      question: 'How do you like to make decisions?',
      options: [
        {
          value: 'quick-intuitive',
          title: 'Quick & intuitive',
          subtitle: 'I go with my gut'
        },
        {
          value: 'researched-planned',
          title: 'Researched & planned',
          subtitle: 'I like to explore all options'
        },
        {
          value: 'guided-experts',
          title: 'Guided by experts',
          subtitle: 'I trust the professionals'
        }
      ]
    },
    {
      id: 'visualStyle',
      question: 'What catches your eye?',
      options: [
        {
          value: 'bold-dramatic',
          title: 'Bold & dramatic',
          subtitle: 'Make it stand out'
        },
        {
          value: 'clean-minimal',
          title: 'Clean & minimal',
          subtitle: 'Less is more'
        },
        {
          value: 'warm-welcoming',
          title: 'Warm & welcoming',
          subtitle: 'Feels like home'
        }
      ]
    },
    {
      id: 'priority',
      question: 'What matters most right now?',
      options: [
        {
          value: 'quality-craft',
          title: 'Quality & craft',
          subtitle: 'The best of the best'
        },
        {
          value: 'personal-connection',
          title: 'Personal connection',
          subtitle: "It's about meaning"
        },
        {
          value: 'something-new',
          title: 'Something new',
          subtitle: "Let's explore"
        }
      ]
    }
  ],

  // Initialize and show quiz
  show() {
    this.currentQuestion = 0;
    this.answers = {};
    this.render();
  },

  // Create quiz modal structure
  createModal() {
    const overlay = document.createElement('div');
    overlay.className = 'for-you-quiz-overlay';
    overlay.id = 'for-you-quiz';

    const modal = document.createElement('div');
    modal.className = 'for-you-quiz-modal';

    const container = document.createElement('div');
    container.className = 'quiz-container';
    container.id = 'quiz-content';

    modal.appendChild(container);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    return overlay;
  },

  // Render current question or done screen
  render() {
    let overlay = document.getElementById('for-you-quiz');

    if (!overlay) {
      overlay = this.createModal();
    }

    const container = document.getElementById('quiz-content');

    if (this.currentQuestion < this.questions.length) {
      container.innerHTML = this.renderQuestion();
      this.attachEventListeners();
    } else {
      container.innerHTML = this.renderDoneScreen();
      this.attachDoneListener();
      // Start transformation immediately in background
      this.startTransformation();
    }
  },

  // Render a single question
  renderQuestion() {
    const question = this.questions[this.currentQuestion];
    const progress = `${this.currentQuestion + 1} of ${this.questions.length}`;

    return `
      <div class="quiz-progress">${progress}</div>
      <h2 class="quiz-question">${question.question}</h2>
      <div class="quiz-options">
        ${question.options.map((option, index) => `
          <div class="quiz-option" data-value="${option.value}" data-index="${index}">
            <div class="option-title">${option.title}</div>
            <div class="option-subtitle">${option.subtitle}</div>
          </div>
        `).join('')}
      </div>
    `;
  },

  // Render done screen
  renderDoneScreen() {
    return `
      <div class="quiz-done">
        <button class="cta-button" id="quiz-done-button">See The Site</button>
      </div>
    `;
  },

  // Attach click listeners to options
  attachEventListeners() {
    const options = document.querySelectorAll('.quiz-option');
    options.forEach(option => {
      option.addEventListener('click', (e) => {
        this.selectOption(e.currentTarget);
      });
    });
  },

  // Handle option selection
  async selectOption(optionElement) {
    const value = optionElement.getAttribute('data-value');
    const question = this.questions[this.currentQuestion];

    // Visual feedback
    document.querySelectorAll('.quiz-option').forEach(opt => {
      opt.classList.remove('selected');
    });
    optionElement.classList.add('selected');

    // Save answer
    this.answers[question.id] = value;

    // Wait for animation then move to next question
    await this.wait(200);
    this.currentQuestion++;
    this.render();
  },

  // Attach done button listener
  attachDoneListener() {
    const button = document.getElementById('quiz-done-button');
    if (button) {
      button.addEventListener('click', () => {
        this.complete();
      });
    }
  },

  // Start transformation in background (called when done screen shows)
  async startTransformation() {
    console.log('[Quiz] Starting transformation in background...');

    this.transformationComplete = false;

    // Save preferences immediately
    await ForYouStorage.savePreferences(this.answers);
    await ForYouStorage.saveToggleState(true);

    // Set toggle to loading state
    const toggle = document.querySelector('.for-you-toggle');
    if (toggle) {
      toggle.classList.add('loading');
      toggle.setAttribute('aria-checked', 'true');
      console.log('[Quiz] Toggle set to loading state');
    }

    // Check if background crawl is still in progress
    if (window.ForYouCrawl && window.ForYouCrawl.isInProgress()) {
      console.log('[Quiz] Waiting for site analysis to complete...');

      if (window.ForYouDebugOverlay) {
        window.ForYouDebugOverlay.update('waiting', 'Waiting: Analysis to complete');
      }

      await window.ForYouCrawl.wait();

      if (window.ForYouDebugOverlay) {
        window.ForYouDebugOverlay.remove('waiting');
        window.ForYouDebugOverlay.update('status', 'Status: Transforming page');
      }

      console.log('[Quiz] Analysis complete. Proceeding with transformation.');
    } else {
      console.log('[Quiz] Brand materials ready. Beginning transformation.');
      if (window.ForYouDebugOverlay) {
        window.ForYouDebugOverlay.update('status', 'Status: Transforming page');
      }
    }

    // Start API call in background
    if (window.ForYouPersonalization) {
      this.transformationPromise = window.ForYouPersonalization.executeTransformation(this.answers)
        .then(() => {
          console.log('[Quiz] Transformation complete');
          this.transformationComplete = true;

          if (window.ForYouDebugOverlay) {
            window.ForYouDebugOverlay.update('status', 'Status: Personalization active');
          }
          // Don't change toggle yet - wait for quiz dismiss
        })
        .catch((error) => {
          console.error('[Quiz] Transformation failed:', error);
          this.transformationComplete = false;
          // Handle error - remove loading immediately
          if (toggle) {
            toggle.classList.remove('loading', 'on');
          }
        });
    }
  },

  // Complete quiz (just dismiss and wait for transformation)
  async complete() {
    console.log('[Quiz] Dismissing quiz overlay...');

    // Dismiss quiz
    await this.dismiss();

    // Check if transformation is ready
    const toggle = document.querySelector('.for-you-toggle');

    if (this.transformationComplete) {
      // API already done - animate toggle to ON immediately
      console.log('[Quiz] Transformation ready - animating to ON');
      if (toggle) {
        toggle.classList.remove('loading');
        toggle.classList.add('on');
      }
    } else {
      // API still running - wait for it, then animate
      console.log('[Quiz] Waiting for transformation to complete...');
      if (this.transformationPromise) {
        await this.transformationPromise;
        if (toggle) {
          toggle.classList.remove('loading');
          toggle.classList.add('on');
          console.log('[Quiz] Toggle animation completed');
        }
      }
    }
  },

  // Dismiss modal with animation
  async dismiss() {
    const overlay = document.getElementById('for-you-quiz');
    if (overlay) {
      overlay.classList.add('hiding');
      await this.wait(250);
      overlay.remove();
    }
  },

  // Utility: wait function
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

// Make available globally
window.ForYouQuiz = ForYouQuiz;
