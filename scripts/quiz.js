// Quiz logic and flow for For You extension

const ForYouQuiz = {
  currentQuestion: 0,
  answers: {},

  questions: [
    {
      id: 'vibe',
      question: "What's your vibe?",
      gridClass: 'grid-2x2',
      options: [
        {
          value: 'spontaneous',
          emoji: '🎯',
          label: 'Spontaneous',
          description: 'I decide quickly when something feels right'
        },
        {
          value: 'planned',
          emoji: '📋',
          label: 'Planned',
          description: 'I like to research before committing'
        },
        {
          value: 'trust-expert',
          emoji: '🎨',
          label: 'Trust-the-expert',
          description: 'I want guidance from someone who knows their craft'
        },
        {
          value: 'collaborative',
          emoji: '🤝',
          label: 'Collaborative',
          description: 'I want to be involved in shaping the experience'
        }
      ]
    },
    {
      id: 'drawsIn',
      question: "What draws you in?",
      gridClass: 'grid-2x2',
      options: [
        {
          value: 'bold',
          emoji: '💥',
          label: 'Bold & eye-catching',
          description: 'High contrast visuals'
        },
        {
          value: 'refined',
          emoji: '✨',
          label: 'Refined & minimal',
          description: 'Clean, understated visuals'
        },
        {
          value: 'warm',
          emoji: '🌟',
          label: 'Warm & inviting',
          description: 'Approachable, friendly visuals'
        },
        {
          value: 'unique',
          emoji: '🎪',
          label: 'Unique & experimental',
          description: 'Unconventional, artistic visuals'
        }
      ]
    },
    {
      id: 'important',
      question: "What's most important to you right now?",
      gridClass: 'grid-2x2',
      options: [
        {
          value: 'statement',
          emoji: '🔥',
          label: 'Making a statement',
          description: 'Something memorable and conversation-starting'
        },
        {
          value: 'quality',
          emoji: '💎',
          label: 'Quality & craftsmanship',
          description: 'The best materials and expert execution'
        },
        {
          value: 'personal-meaning',
          emoji: '💭',
          label: 'Personal meaning',
          description: 'Something that reflects who I am'
        },
        {
          value: 'new',
          emoji: '🌈',
          label: 'Trying something new',
          description: 'Exploring and discovering'
        }
      ]
    }
  ],

  // Create and show quiz modal
  show() {
    this.currentQuestion = 0;
    this.answers = {};

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'for-you-quiz-overlay';
    overlay.id = 'forYouQuizOverlay';

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'for-you-quiz-modal';

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'quiz-close';
    closeBtn.innerHTML = '×';
    closeBtn.addEventListener('click', () => this.close());

    // Progress indicator
    const progress = document.createElement('div');
    progress.className = 'quiz-progress';
    progress.innerHTML = `
      <div class="quiz-progress-text">
        <span id="quizProgressText">1 of ${this.questions.length}</span>
      </div>
      <div class="quiz-progress-bar">
        <div class="quiz-progress-fill" id="quizProgressFill" style="width: ${100 / this.questions.length}%"></div>
      </div>
    `;

    // Questions container
    const questionsContainer = document.createElement('div');
    questionsContainer.id = 'quizQuestionsContainer';

    // Create all question screens
    this.questions.forEach((q, index) => {
      const questionDiv = this.createQuestionScreen(q, index);
      questionsContainer.appendChild(questionDiv);
    });

    // Done screen
    const doneScreen = this.createDoneScreen();
    questionsContainer.appendChild(doneScreen);

    // Assemble modal
    modal.appendChild(closeBtn);
    modal.appendChild(progress);
    modal.appendChild(questionsContainer);
    overlay.appendChild(modal);

    // Add to page
    document.body.appendChild(overlay);

    // Trigger animation
    requestAnimationFrame(() => {
      overlay.classList.add('visible');
      document.querySelector('.quiz-question').classList.add('active');
    });
  },

  // Create a question screen
  createQuestionScreen(question, index) {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'quiz-question';
    questionDiv.dataset.questionIndex = index;
    if (index === 0) questionDiv.classList.add('active');

    const title = document.createElement('h2');
    title.textContent = question.question;

    const optionsDiv = document.createElement('div');
    optionsDiv.className = `quiz-options ${question.gridClass}`;

    question.options.forEach(option => {
      const optionDiv = document.createElement('div');
      optionDiv.className = 'quiz-option';
      optionDiv.dataset.value = option.value;

      optionDiv.innerHTML = `
        <span class="quiz-option-emoji">${option.emoji}</span>
        <div class="quiz-option-label">${option.label}</div>
        <div class="quiz-option-description">${option.description}</div>
      `;

      optionDiv.addEventListener('click', () => {
        this.selectOption(question.id, option.value, optionDiv);
      });

      optionsDiv.appendChild(optionDiv);
    });

    questionDiv.appendChild(title);
    questionDiv.appendChild(optionsDiv);

    return questionDiv;
  },

  // Create done screen
  createDoneScreen() {
    const doneDiv = document.createElement('div');
    doneDiv.className = 'quiz-done';
    doneDiv.id = 'quizDone';

    doneDiv.innerHTML = `
      <div class="celebration">✨</div>
      <h2>You're all set!</h2>
      <p>Watch the magic happen</p>
      <button class="cta-button" id="quizDoneButton">See Your Personalized Experience</button>
    `;

    return doneDiv;
  },

  // Handle option selection
  selectOption(questionId, value, optionElement) {
    // Save answer
    this.answers[questionId] = value;

    // Visual feedback
    const allOptions = optionElement.parentElement.querySelectorAll('.quiz-option');
    allOptions.forEach(opt => opt.classList.remove('selected'));
    optionElement.classList.add('selected');

    // Auto-advance after brief delay
    setTimeout(() => {
      this.nextQuestion();
    }, 400);
  },

  // Move to next question
  nextQuestion() {
    const currentQuestionDiv = document.querySelector(`.quiz-question[data-question-index="${this.currentQuestion}"]`);
    currentQuestionDiv.classList.remove('active');

    this.currentQuestion++;

    // Update progress
    const progressPercent = ((this.currentQuestion + 1) / this.questions.length) * 100;
    document.getElementById('quizProgressFill').style.width = `${progressPercent}%`;
    document.getElementById('quizProgressText').textContent = `${this.currentQuestion + 1} of ${this.questions.length}`;

    if (this.currentQuestion < this.questions.length) {
      // Show next question
      const nextQuestionDiv = document.querySelector(`.quiz-question[data-question-index="${this.currentQuestion}"]`);
      nextQuestionDiv.classList.add('active');
    } else {
      // Show done screen
      this.showDoneScreen();
    }
  },

  // Show done screen
  showDoneScreen() {
    const doneScreen = document.getElementById('quizDone');
    doneScreen.classList.add('active');

    // Hide progress bar
    document.querySelector('.quiz-progress').style.opacity = '0';

    // Setup done button
    const doneButton = document.getElementById('quizDoneButton');
    doneButton.addEventListener('click', () => {
      this.complete();
    });

    // Auto-dismiss after 2 seconds
    setTimeout(() => {
      this.complete();
    }, 2000);
  },

  // Complete quiz and trigger personalization
  async complete() {
    // Save preferences
    await window.ForYouStorage.savePreferences(this.answers);
    await window.ForYouStorage.setActive(true);

    // Close modal with animation
    const overlay = document.getElementById('forYouQuizOverlay');
    overlay.classList.remove('visible');

    setTimeout(() => {
      overlay.remove();

      // Trigger personalization
      if (window.ForYouPersonalization) {
        window.ForYouPersonalization.applyPersonalization(this.answers);
      }

      // Update toggle state
      const toggle = document.querySelector('.for-you-toggle input');
      if (toggle) {
        toggle.checked = true;
      }
    }, 300);
  },

  // Close quiz without completing
  close() {
    const overlay = document.getElementById('forYouQuizOverlay');
    overlay.classList.remove('visible');

    setTimeout(() => {
      overlay.remove();
    }, 300);
  }
};

// Make available globally
window.ForYouQuiz = ForYouQuiz;
