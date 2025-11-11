// Quiz.js - Conversational quiz flow and logic

const ForYouQuiz = {
  currentQuestion: 0,
  answers: {},

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
        <h2>Perfect!</h2>
        <p>Your experience is ready</p>
        <button class="cta-button" id="quiz-done-button">See Your Personalized Site</button>
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

  // Complete quiz and trigger transformation
  async complete() {
    // Save preferences
    await ForYouStorage.savePreferences(this.answers);
    await ForYouStorage.saveToggleState(true);

    // Dismiss modal
    await this.dismiss();

    // Check if background crawl is still in progress
    if (window.ForYouCrawl && window.ForYouCrawl.isInProgress()) {
      console.log('');
      console.log('[For You] Site analysis still in progress');
      console.log('[For You] Waiting for completion to ensure accurate personalization...');

      // Update debug overlay instead of showing modal
      if (window.ForYouDebugOverlay) {
        window.ForYouDebugOverlay.update('waiting', 'Waiting: Analysis to complete');
      }

      // Wait for crawl to complete
      await window.ForYouCrawl.wait();

      // Update debug overlay
      if (window.ForYouDebugOverlay) {
        window.ForYouDebugOverlay.remove('waiting');
        window.ForYouDebugOverlay.update('status', 'Status: Transforming page');
      }

      console.log('[For You] Analysis complete. Proceeding with full site profile.');
      console.log('');
    } else {
      console.log('[For You] Brand materials ready. Beginning transformation.');
      if (window.ForYouDebugOverlay) {
        window.ForYouDebugOverlay.update('status', 'Status: Transforming page');
      }
    }

    // Trigger page transformation (with full profile if crawl completed, or current page if not)
    if (window.ForYouPersonalization) {
      await window.ForYouPersonalization.executeTransformation(this.answers);
    }

    // Update debug overlay
    if (window.ForYouDebugOverlay) {
      window.ForYouDebugOverlay.update('status', 'Status: Personalization active');
    }

    // Update module toggle state
    const toggle = document.querySelector('.for-you-toggle');
    if (toggle) {
      toggle.classList.add('on');
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
