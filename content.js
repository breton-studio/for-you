// For You - Personalization that feels human
// Simple. Warm. Perfect.

// ========================================
// SQUARESPACE DETECTION - Only activate on Squarespace sites
// ========================================

function isSquarespaceSite() {
  // Check 1: Meta tags
  const metaTags = Array.from(document.querySelectorAll('meta'));
  const hasSquarespaceMeta = metaTags.some(meta =>
    (meta.getAttribute('content') || '').toLowerCase().includes('squarespace') ||
    (meta.getAttribute('name') || '').toLowerCase().includes('squarespace') ||
    (meta.getAttribute('generator') || '').toLowerCase().includes('squarespace')
  );

  if (hasSquarespaceMeta) {
    console.log('For You: Squarespace detected via meta tags');
    return true;
  }

  // Check 2: Scripts from Squarespace CDN
  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const hasSquarespaceScripts = scripts.some(script =>
    script.src.includes('squarespace.com') ||
    script.src.includes('sqsp.com')
  );

  if (hasSquarespaceScripts) {
    console.log('For You: Squarespace detected via script URLs');
    return true;
  }

  // Check 3: Squarespace-specific attributes
  const hasSquarespaceAttr = document.querySelector('[data-controller*="Squarespace"]') ||
                              document.querySelector('[class*="sqs-"]') ||
                              document.querySelector('.squarespace-comments');

  if (hasSquarespaceAttr) {
    console.log('For You: Squarespace detected via DOM attributes');
    return true;
  }

  // Check 4: Squarespace global object
  if (window.Static && window.Static.SQUARESPACE_CONTEXT) {
    console.log('For You: Squarespace detected via Static.SQUARESPACE_CONTEXT');
    return true;
  }

  // Check 5: Look for Squarespace in HTML comments (common in Squarespace sites)
  const htmlContent = document.documentElement.innerHTML;
  if (htmlContent.includes('Squarespace') || htmlContent.includes('sqsp')) {
    console.log('For You: Squarespace detected via HTML content');
    return true;
  }

  console.log('For You: Not a Squarespace site - extension will not activate');
  return false;
}

// ========================================
// PERSONAS - Eight paths from three questions
// ========================================

const personas = {
  'browse-classic-value': {
    hero: 'Timeless Finds at Great Prices',
    priority: ['deals', 'classics', 'popular', 'sale', 'value'],
    hide: ['new-arrivals', 'premium', 'luxury', 'exclusive'],
    cta: 'Explore Deals'
  },

  'browse-classic-quality': {
    hero: 'Our Finest Classic Collection',
    priority: ['premium', 'heritage', 'craftsmanship', 'quality', 'luxury'],
    hide: ['sales', 'trending', 'deals'],
    cta: 'View Collection'
  },

  'browse-fresh-value': {
    hero: 'New Discoveries, Great Prices',
    priority: ['new-arrivals', 'trending', 'deals', 'new', 'latest'],
    hide: ['heritage', 'premium', 'classic'],
    cta: "What's New"
  },

  'browse-fresh-quality': {
    hero: 'Exceptional New Arrivals',
    priority: ['new-arrivals', 'premium', 'exclusive', 'luxury', 'latest'],
    hide: ['sales', 'basics', 'deals'],
    cta: 'Discover'
  },

  'search-classic-value': {
    hero: 'Find Exactly What You Need',
    priority: ['search', 'categories', 'deals', 'shop', 'browse'],
    hide: ['blog', 'about', 'story'],
    cta: 'Quick Shop'
  },

  'search-classic-quality': {
    hero: 'Premium Selection, Refined Search',
    priority: ['categories', 'premium', 'search', 'shop', 'quality'],
    hide: ['deals', 'blog', 'about'],
    cta: 'Find Premium'
  },

  'search-fresh-value': {
    hero: 'Latest Deals, Fast Access',
    priority: ['search', 'new-arrivals', 'deals', 'latest', 'new'],
    hide: ['about', 'heritage', 'story'],
    cta: 'Shop Now'
  },

  'search-fresh-quality': {
    hero: 'New Premium, Direct Access',
    priority: ['search', 'new-arrivals', 'premium', 'exclusive', 'luxury'],
    hide: ['deals', 'basics', 'sale'],
    cta: 'Shop Premium'
  }
};

// ========================================
// QUIZ - Three warm questions
// ========================================

const quiz = {
  questions: [
    {
      text: "How do you like to shop?",
      options: [
        { id: 'browse', label: 'Browse', desc: 'I like to explore' },
        { id: 'search', label: 'Search', desc: 'I know what I want' }
      ]
    },
    {
      text: "What catches your eye?",
      options: [
        { id: 'classic', label: 'Classic', desc: 'Timeless and refined' },
        { id: 'fresh', label: 'Fresh', desc: 'New and different' }
      ]
    },
    {
      text: "What matters most today?",
      options: [
        { id: 'value', label: 'Value', desc: 'Smart choices' },
        { id: 'quality', label: 'Quality', desc: 'The best available' }
      ]
    }
  ],

  current: 0,
  answers: [],

  show() {
    const q = this.questions[this.current];
    const html = `
      <div class="quiz-container">
        <div class="quiz-counter">${this.current + 1} of 3</div>
        <h2 class="quiz-question">${q.text}</h2>
        <div class="quiz-options">
          ${q.options.map(opt => `
            <div class="quiz-option" data-choice="${opt.id}">
              <h3>${opt.label}</h3>
              <p>${opt.desc}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    const overlay = document.querySelector('.quiz-overlay');
    overlay.innerHTML = html;

    // Attach listeners
    document.querySelectorAll('.quiz-option').forEach(opt => {
      opt.addEventListener('click', () => this.choose(opt.dataset.choice));
    });
  },

  choose(choice) {
    this.answers.push(choice);

    if (this.current < 2) {
      this.current++;
      setTimeout(() => this.show(), 150);
    } else {
      this.finish();
    }
  },

  finish() {
    const persona = this.answers.join('-');
    localStorage.setItem('for-you-persona', persona);

    console.log('For You: Persona selected:', persona);

    // Elegant exit
    const overlay = document.querySelector('.quiz-overlay');
    overlay.style.opacity = '0';

    setTimeout(() => {
      overlay.remove();
      transform(persona);
    }, 250);
  }
};

// ========================================
// BRAND EXTRACTION - Two variables
// ========================================

function extractBrand() {
  // 1. Get the primary font
  const h1 = document.querySelector('h1');
  const font = h1 ? getComputedStyle(h1).fontFamily : '-apple-system';

  // 2. Get the primary accent color
  let accent = '#007AFF'; // iOS blue default

  // Try to find accent from buttons first
  const button = document.querySelector('button, .btn, [class*="button"], [class*="Button"]');
  if (button) {
    const bg = getComputedStyle(button).backgroundColor;
    const borderColor = getComputedStyle(button).borderColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
      accent = bg;
    } else if (borderColor && borderColor !== 'rgba(0, 0, 0, 0)') {
      accent = borderColor;
    }
  }

  // Fallback to primary links
  if (accent === '#007AFF') {
    const link = document.querySelector('a[class*="button"], a[class*="Button"], nav a');
    if (link) {
      const color = getComputedStyle(link).color;
      const bg = getComputedStyle(link).backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        accent = bg;
      } else if (color && color !== 'rgba(0, 0, 0, 0)') {
        accent = color;
      }
    }
  }

  // 3. Apply to CSS variables
  document.documentElement.style.setProperty('--site-font', font);
  document.documentElement.style.setProperty('--site-accent', accent);

  console.log('For You: Brand extracted', { font, accent });

  return { font, accent };
}

// ========================================
// TRANSFORMATION - The magic moment
// ========================================

function transform(persona) {
  console.log('For You: Transforming page with persona:', persona);

  const config = personas[persona];
  if (!config) {
    console.error('For You: Unknown persona:', persona);
    return;
  }

  const brand = extractBrand();

  // 1. Update hero
  updateHero(config, brand);

  // 2. Reorder sections
  setTimeout(() => reorderSections(config.priority, config.hide), 100);

  // 3. Update CTAs
  setTimeout(() => updateCTAs(config.cta, brand.accent), 200);

  // 4. Add indicator
  setTimeout(() => addPersonalizedIndicator(brand.accent), 300);
}

function updateHero(config, brand) {
  // Find hero headline
  const hero = document.querySelector('h1') ||
                document.querySelector('[class*="hero"] h1') ||
                document.querySelector('.title h1');

  if (!hero) {
    console.warn('For You: No hero headline found');
    return;
  }

  // Store original text for reverting
  if (!hero.dataset.originalText) {
    hero.dataset.originalText = hero.textContent;
  }

  // Detect site type and adapt language
  const bodyText = document.body.textContent.toLowerCase();
  const isService = bodyText.includes('book') ||
                    bodyText.includes('reserve') ||
                    bodyText.includes('appointment') ||
                    bodyText.includes('consultation') ||
                    bodyText.includes('session');

  let heroText = config.hero;

  if (isService) {
    // Adapt language for service businesses
    heroText = heroText
      .replace('Shop', 'Book')
      .replace('Collection', 'Services')
      .replace('Find', 'Discover')
      .replace('Deals', 'Options')
      .replace(/at Great Prices/, 'That Fit Your Style')
      .replace('Fast Access', 'Easy Booking');
  }

  // Apply transformation
  hero.style.transition = 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)';
  hero.style.opacity = '0';

  setTimeout(() => {
    hero.textContent = heroText;
    hero.style.opacity = '1';
  }, 250);

  console.log('For You: Hero updated to:', heroText);
}

function reorderSections(priority, hide) {
  const sections = Array.from(document.querySelectorAll('section, [data-section], [class*="section"], main > div'));

  if (sections.length === 0) {
    console.warn('For You: No sections found to reorder');
    return;
  }

  const container = sections[0]?.parentElement;
  if (!container) return;

  // Enable flexbox ordering
  container.style.display = 'flex';
  container.style.flexDirection = 'column';

  sections.forEach((section, index) => {
    const content = section.textContent.toLowerCase();
    const classes = section.className.toLowerCase();
    const id = (section.id || '').toLowerCase();
    const combinedText = `${content} ${classes} ${id}`;

    let score = 100; // Default middle position

    // Score based on priority keywords
    priority.forEach((term, termIndex) => {
      if (combinedText.includes(term)) {
        score = Math.min(score, termIndex * 10);
      }
    });

    // Check if should hide
    const shouldHide = hide.some(term => combinedText.includes(term));

    // Apply changes with smooth transition
    section.style.transition = 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)';
    section.style.order = score;

    if (shouldHide) {
      setTimeout(() => {
        section.style.maxHeight = '0';
        section.style.overflow = 'hidden';
        section.style.opacity = '0';
        section.style.padding = '0';
        section.style.margin = '0';
      }, index * 30);
    }
  });

  console.log('For You: Sections reordered');
}

function updateCTAs(text, color) {
  const ctas = document.querySelectorAll('button, .btn, a[href*="contact"], a[href*="book"], [class*="button"], [class*="Button"]');

  ctas.forEach((cta, index) => {
    // Only update primary CTAs
    if (cta.tagName === 'BUTTON' ||
        cta.className.toLowerCase().includes('btn') ||
        cta.className.toLowerCase().includes('button')) {

      setTimeout(() => {
        cta.style.transition = 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)';

        // Update text if it's a button
        if (cta.tagName === 'BUTTON') {
          cta.textContent = text;
        }

        // Flash animation to draw attention
        cta.style.transform = 'scale(1.05)';
        setTimeout(() => {
          cta.style.transform = 'scale(1)';
        }, 250);
      }, index * 30);
    }
  });

  console.log('For You: CTAs updated');
}

function addPersonalizedIndicator(color) {
  // Remove existing indicator
  const existing = document.querySelector('.for-you-indicator');
  if (existing) existing.remove();

  const indicator = document.createElement('div');
  indicator.className = 'for-you-indicator';
  indicator.innerHTML = `
    <span class="for-you-indicator-dot" style="background: ${color}"></span>Personalized for you
  `;

  document.body.appendChild(indicator);

  // Auto-fade after 3 seconds
  setTimeout(() => {
    indicator.style.opacity = '0.3';
  }, 3000);

  console.log('For You: Indicator added');
}

// ========================================
// MODULE - The invitation
// ========================================

function createModule(isOn = false) {
  const module = document.createElement('div');
  module.className = 'for-you-module';
  module.innerHTML = `
    <span class="for-you-text">For You</span>
    <div class="for-you-toggle ${isOn ? 'on' : ''}"></div>
  `;

  document.body.appendChild(module);

  // Handle toggle click
  const toggle = module.querySelector('.for-you-toggle');
  toggle.addEventListener('click', () => {
    toggle.classList.toggle('on');

    if (toggle.classList.contains('on')) {
      localStorage.setItem('for-you-enabled', 'true');

      const savedPersona = localStorage.getItem('for-you-persona');
      if (savedPersona) {
        transform(savedPersona);
      } else {
        startQuiz();
      }
    } else {
      localStorage.setItem('for-you-enabled', 'false');
      location.reload(); // Clean reset
    }
  });

  // Handle scroll behavior
  let lastScrollY = window.scrollY;

  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY > lastScrollY && currentScrollY > 100) {
      // Scrolling down - hide
      module.classList.add('hidden');
    } else {
      // Scrolling up or at top - show
      module.classList.remove('hidden');
    }

    lastScrollY = currentScrollY;
  });

  console.log('For You: Module created');
}

function startQuiz() {
  const overlay = document.createElement('div');
  overlay.className = 'quiz-overlay';
  document.body.appendChild(overlay);

  quiz.current = 0;
  quiz.answers = [];
  quiz.show();

  console.log('For You: Quiz started');
}

// ========================================
// INITIALIZATION
// ========================================

function initForYou() {
  console.log('For You: Initializing...');

  // Check for existing preferences
  const savedPersona = localStorage.getItem('for-you-persona');
  const isEnabled = localStorage.getItem('for-you-enabled') === 'true';

  // Create module
  createModule(isEnabled);

  // Auto-apply if enabled
  if (savedPersona && isEnabled) {
    setTimeout(() => {
      console.log('For You: Auto-applying saved persona');
      transform(savedPersona);
    }, 500);
  }

  console.log('For You: Ready', { persona: savedPersona, enabled: isEnabled });
}

// Start when page loads - but only on Squarespace sites
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (isSquarespaceSite()) {
      setTimeout(initForYou, 1000);
    }
  });
} else {
  if (isSquarespaceSite()) {
    setTimeout(initForYou, 1000);
  }
}
