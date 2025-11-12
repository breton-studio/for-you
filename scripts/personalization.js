// Personalization.js - Core personalization logic, brand extraction, section reordering

const ForYouPersonalization = {
  brandStyles: null,
  siteType: null,
  isSquarespace: false,
  cachedBusinessProfile: null,  // Cache business profile to avoid recomputation

  // Universal Squarespace selectors
  SELECTORS: {
    sections: [
      'section[data-section-id]',
      '.page-section',
      '.sqs-layout > .sqs-row',
      'article section',
      'main > div[id*="block"]',
      'section'
    ],
    hero: [
      'section:first-of-type',
      '.page-section:first-of-type',
      '[data-section-id]:first-of-type',
      '#page section:first-child',
      'section:first-child'
    ],
    headings: ['h1', 'h2', '.sqs-block h1', '.sqs-block h2'],
    body: ['p', '.sqs-block-content p', '.sqs-html-content p'],
    buttons: [
      '.sqs-block-button-element',
      '.sqs-block-button a',
      'a.btn',
      'a[href*="contact"]',
      'a[href*="book"]',
      'button'
    ]
  },

  // Section types for categorization
  SECTION_TYPES: {
    HERO: 'hero',
    PROCESS: 'process',
    TEAM: 'team',
    PORTFOLIO: 'portfolio',
    CREDENTIALS: 'credentials',
    SOCIAL_PROOF: 'social-proof',
    PRICING: 'pricing',
    FAQ: 'faq',
    CTA: 'cta',
    GENERAL: 'general'
  },

  // Check if site is Squarespace
  checkIsSquarespace() {
    const indicators = [
      'script[src*="squarespace"]',
      'meta[content*="Squarespace"]',
      '.sqs-block',
      '[data-section-id]'
    ];

    this.isSquarespace = indicators.some(sel => document.querySelector(sel) !== null);
    return this.isSquarespace;
  },

  // Utility: Yield to event loop to prevent blocking
  async yieldToEventLoop() {
    return new Promise(resolve => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => resolve(), { timeout: 50 });
      } else {
        setTimeout(resolve, 0);
      }
    });
  },

  // Find element with fallbacks
  findElement(selectorArray) {
    for (const selector of selectorArray) {
      const element = document.querySelector(selector);
      if (element) return element;
    }
    return null;
  },

  // Find all elements with fallbacks
  findAllElements(selectorArray) {
    let elements = [];
    for (const selector of selectorArray) {
      const found = document.querySelectorAll(selector);
      if (found.length > 0) {
        elements = [...elements, ...found];
      }
    }
    // Remove duplicates
    return [...new Set(elements)];
  },

  // Detect site type based on content
  detectSiteType() {
    const indicators = {
      // Sports, training, athletic programs (CHECK FIRST - most specific)
      sports: ['training', 'camps', 'clinics', 'league', 'tournament', 'athletic', 'coach', 'soccer', 'basketball', 'baseball', 'fitness', 'gym'],
      // Education, learning, courses
      education: ['course', 'class', 'lesson', 'curriculum', 'tutor', 'learn', 'student', 'school', 'academy', 'workshop'],
      // Events, conferences, gatherings
      events: ['event', 'conference', 'seminar', 'festival', 'gathering', 'summit'],
      // Restaurants (more specific keywords to avoid false positives)
      restaurant: ['reservation', 'dine', 'cuisine', 'chef', 'dishes', 'culinary', 'restaurant', 'dining'],
      // E-commerce, retail
      ecommerce: ['shop', 'cart', 'product', 'buy', 'add to cart', 'store', 'purchase'],
      // Services, appointments
      service: ['book', 'appointment', 'consultation', 'schedule'],
      // Portfolio, creative work
      portfolio: ['portfolio', 'work', 'projects', 'case studies'],
      // Professional services
      professional: ['services', 'expertise', 'team', 'about us']
    };

    const bodyText = document.body.textContent.toLowerCase();
    const metaDescription = document.querySelector('meta[name="description"]')?.content.toLowerCase() || '';
    const searchText = bodyText + ' ' + metaDescription;

    let scores = {};
    for (const [type, keywords] of Object.entries(indicators)) {
      scores[type] = keywords.reduce((score, keyword) => {
        return score + (searchText.split(keyword).length - 1);
      }, 0);
    }

    this.siteType = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
    console.log('For You: Site type detection scores:', scores);
    console.log('For You: Detected site type:', this.siteType);
    return this.siteType;
  },

  // Extract brand adjectives from page content
  extractBrandAdjectives() {
    const allText = this.collectAllText().toLowerCase();

    // Common adjectives that describe brands
    const brandAdjectivePatterns = [
      // Quality/Craft
      'premium', 'exceptional', 'finest', 'quality', 'crafted',
      'artisan', 'handmade', 'masterful', 'meticulous', 'exquisite',

      // Experience/Service
      'personal', 'personalized', 'tailored', 'custom', 'bespoke',
      'attentive', 'dedicated', 'thoughtful', 'caring',

      // Innovation/Modern
      'innovative', 'modern', 'contemporary', 'fresh', 'new',
      'cutting-edge', 'advanced', 'progressive', 'creative',

      // Trust/Expertise
      'trusted', 'experienced', 'expert', 'professional', 'established',
      'proven', 'certified', 'award-winning', 'reliable',

      // Warmth/Approachability
      'welcoming', 'friendly', 'warm', 'comfortable', 'inviting',
      'approachable', 'genuine', 'authentic', 'intimate',

      // Bold/Dramatic
      'bold', 'striking', 'powerful', 'dynamic', 'confident',
      'distinctive', 'extraordinary', 'vibrant', 'elegant'
    ];

    const found = {};

    // Count occurrences of each adjective
    brandAdjectivePatterns.forEach(adj => {
      const regex = new RegExp(`\\b${adj}\\b`, 'gi');
      const matches = allText.match(regex);
      if (matches && matches.length >= 2) { // Must appear 2+ times to be significant
        found[adj] = matches.length;
      }
    });

    // Return top 5 most used adjectives
    return Object.entries(found)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  },

  // Collect all meaningful text from page
  collectAllText() {
    let text = '';

    // Get hero text if available
    const hero = this.findElement(this.SELECTORS.hero);
    if (hero) {
      text += hero.innerText + ' ';
    }

    // Get all headings
    const headings = this.findAllElements(this.SELECTORS.headings);
    headings.forEach(h => {
      text += h.textContent + ' ';
    });

    // Get first 10 paragraphs (enough for brand voice, not too much noise)
    const paragraphs = this.findAllElements(this.SELECTORS.body);
    paragraphs.slice(0, 10).forEach(p => {
      text += p.textContent + ' ';
    });

    // Add meta description
    const metaDescription = document.querySelector('meta[name="description"]')?.content;
    if (metaDescription) {
      text += metaDescription + ' ';
    }

    return text;
  },

  // Detect price tier based on language, typography, and visual signals
  detectPriceTier() {
    let score = 50; // Start neutral (mid tier)

    // 1. Language/keyword analysis
    const bodyText = document.body.textContent.toLowerCase();

    // Premium indicators (+points)
    const premiumWords = [
      'luxury', 'luxurious', 'bespoke', 'premium', 'exclusive',
      'finest', 'curated', 'artisan', 'boutique', 'exceptional',
      'investment', 'masterful', 'distinguished', 'elite', 'exquisite'
    ];

    // Accessible indicators (-points)
    const accessibleWords = [
      'affordable', 'value', 'budget', 'economical', 'discount',
      'deal', 'cheap', 'free', 'save', 'low-cost'
    ];

    // Count premium words
    premiumWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = bodyText.match(regex);
      if (matches) {
        score += matches.length * 3; // +3 per occurrence
      }
    });

    // Count accessible words
    accessibleWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = bodyText.match(regex);
      if (matches) {
        score -= matches.length * 4; // -4 per occurrence (stronger signal)
      }
    });

    // 2. Typography sophistication analysis
    if (this.brandStyles && this.brandStyles.typography) {
      const h1Style = this.brandStyles.typography.h1;

      if (h1Style) {
        // Serif fonts indicate premium
        if (h1Style.fontFamily && /serif/i.test(h1Style.fontFamily) && !/sans-serif/i.test(h1Style.fontFamily)) {
          score += 8;
        }

        // Large letter-spacing indicates premium design
        if (h1Style.letterSpacing) {
          const spacing = parseFloat(h1Style.letterSpacing);
          if (spacing > 2) {
            score += 5;
          }
        }

        // Lighter font weights can indicate sophistication
        const weight = parseInt(h1Style.fontWeight);
        if (weight <= 300) {
          score += 3;
        } else if (weight >= 700) {
          score -= 2; // Very bold can be less premium
        }
      }
    }

    // 3. Color sophistication
    if (this.brandStyles && this.brandStyles.colors) {
      const primaryColor = this.brandStyles.colors.primary;

      if (primaryColor) {
        const colorLower = primaryColor.toLowerCase();

        // Gold, navy, muted tones = premium
        if (/gold|#c9a961|#d4af37/.test(colorLower) || // Gold variants
            /navy|#001f3f|#000080/.test(colorLower) || // Navy variants
            /black|#000/.test(colorLower)) { // Black (sophisticated)
          score += 6;
        }

        // Very bright saturated colors = accessible/friendly
        // Check for RGB values with high saturation
        if (/#ff|#00ff|rgb\(255/.test(colorLower)) {
          score -= 3;
        }
      }
    }

    // 4. Pricing section analysis (if exists)
    const pricingSection = Array.from(document.querySelectorAll('section, div')).find(section => {
      const text = section.textContent.toLowerCase();
      return text.includes('pricing') || text.includes('rates') || text.includes('packages');
    });

    if (pricingSection) {
      const pricingText = pricingSection.textContent;

      // Look for price numbers
      const priceMatches = pricingText.match(/\$[\d,]+/g);
      if (priceMatches) {
        const prices = priceMatches.map(p => parseInt(p.replace(/[$,]/g, '')));
        const maxPrice = Math.max(...prices);

        if (maxPrice >= 500) {
          score += 10; // High prices = premium
        } else if (maxPrice <= 100) {
          score -= 8; // Low prices = accessible
        }
      }

      // "Investment" language in pricing = premium
      if (/investment/i.test(pricingText)) {
        score += 5;
      }
    }

    // 5. Normalize score and categorize
    score = Math.max(0, Math.min(100, score)); // Clamp to 0-100

    if (score >= 65) {
      return 'premium';
    } else if (score >= 35) {
      return 'mid';
    } else {
      return 'accessible';
    }
  },

  // Detect formality level based on language patterns
  detectFormality() {
    const sampleText = this.collectAllText();
    const fullText = sampleText.toLowerCase();

    let formalityScore = 50; // Start neutral

    // 1. Pronoun analysis
    const youMatches = fullText.match(/\byou\b|\byour\b|\byours\b/g) || [];
    const weMatches = fullText.match(/\bwe\b|\bour\b|\bus\b|\bours\b/g) || [];

    // Direct address (you/your) = more casual/conversational
    if (youMatches.length > weMatches.length * 1.5) {
      formalityScore -= 15;
    }

    // Heavy "we" usage without "you" = more formal
    if (weMatches.length > youMatches.length * 1.5) {
      formalityScore += 10;
    }

    // 2. Contractions analysis
    const contractionPattern = /\b\w+'\w+\b/g;
    const contractions = fullText.match(contractionPattern) || [];

    // Contractions = casual
    if (contractions.length > 5) {
      formalityScore -= 10;
    } else if (contractions.length === 0 && sampleText.length > 300) {
      // No contractions in substantial text = formal
      formalityScore += 10;
    }

    // 3. Exclamation points
    const exclamations = (sampleText.match(/!/g) || []).length;
    if (exclamations > 3) {
      formalityScore -= 10; // Excitement = casual
    }

    // 4. Sentence length analysis
    const sentences = sampleText.split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences.length > 0) {
      const avgLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;

      if (avgLength > 100) {
        formalityScore += 10; // Long sentences = formal
      } else if (avgLength < 50) {
        formalityScore -= 5; // Short sentences = casual
      }
    }

    // 5. Formal punctuation (semicolons, em dashes)
    const semicolons = (sampleText.match(/;/g) || []).length;
    const emDashes = (sampleText.match(/—/g) || []).length;
    if (semicolons + emDashes > 2) {
      formalityScore += 8; // Sophisticated punctuation = formal
    }

    // 6. Casual punctuation (ellipses)
    const ellipses = (sampleText.match(/\.{2,}/g) || []).length;
    if (ellipses > 2) {
      formalityScore -= 8; // Ellipses = casual
    }

    // 7. Industry-specific formal terms
    const formalTerms = [
      'pursuant', 'heretofore', 'herein', 'whereby', 'henceforth',
      'notwithstanding', 'aforementioned', 'endeavor', 'commence',
      'facilitate', 'utilize', 'demonstrate', 'implement'
    ];

    let formalTermCount = 0;
    formalTerms.forEach(term => {
      if (fullText.includes(term)) {
        formalTermCount++;
      }
    });

    if (formalTermCount > 3) {
      formalityScore += 12; // Formal vocabulary = formal
    }

    // 8. Typography signals
    if (this.brandStyles && this.brandStyles.typography) {
      const h1Style = this.brandStyles.typography.h1;

      if (h1Style) {
        // All-caps headings can indicate formality
        if (h1Style.textTransform === 'uppercase') {
          formalityScore += 5;
        }

        // Serif fonts = more formal
        if (h1Style.fontFamily && /serif/i.test(h1Style.fontFamily) && !/sans-serif/i.test(h1Style.fontFamily)) {
          formalityScore += 5;
        }
      }
    }

    // 9. Normalize and categorize
    formalityScore = Math.max(0, Math.min(100, formalityScore));

    if (formalityScore >= 65) {
      return 'formal';
    } else if (formalityScore >= 40) {
      return 'professional';
    } else {
      return 'casual';
    }
  },

  // Detect value proposition emphasis
  detectValuePropsEmphasis() {
    const allText = this.collectAllText().toLowerCase();
    const sections = this.findAllElements(this.SELECTORS.sections);

    const emphasis = {
      quality: 0.5,    // Default neutral
      expertise: 0.5,
      personal: 0.5
    };

    // 1. QUALITY/CRAFT indicators
    const qualityWords = [
      'quality', 'premium', 'finest', 'excellence', 'exceptional',
      'craftsmanship', 'meticulous', 'perfection', 'detail',
      'artisan', 'handmade', 'crafted', 'masterful', 'exquisite'
    ];
    const qualityScore = this.scoreKeywordPresence(allText, qualityWords);
    emphasis.quality = Math.min(1.0, 0.3 + qualityScore * 0.7);

    // Check for portfolio section (indicates quality focus)
    const hasPortfolio = sections.some(section => {
      const text = section.textContent.toLowerCase();
      return text.includes('portfolio') || text.includes('gallery') || text.includes('work');
    });

    if (hasPortfolio) {
      emphasis.quality += 0.1;
    }

    // 2. EXPERTISE indicators
    const expertiseWords = [
      'expert', 'expertise', 'experienced', 'professional', 'certified',
      'award', 'established', 'proven', 'specialist', 'master',
      'years of experience', 'trusted', 'authority', 'leader'
    ];
    const expertiseScore = this.scoreKeywordPresence(allText, expertiseWords);
    emphasis.expertise = Math.min(1.0, 0.3 + expertiseScore * 0.7);

    // Check for credentials or team section
    const hasCredentials = sections.some(section => {
      const text = section.textContent.toLowerCase();
      return text.includes('award') || text.includes('certified') ||
             text.includes('credentials') || text.includes('about us') ||
             text.includes('team') || text.includes('experience');
    });

    if (hasCredentials) {
      emphasis.expertise += 0.15;
    }

    // 3. PERSONAL CONNECTION indicators
    const personalWords = [
      'personal', 'personalized', 'tailored', 'custom', 'bespoke',
      'individual', 'unique', 'relationship', 'partnership',
      'understand', 'listen', 'care', 'dedicated', 'attention'
    ];
    const personalScore = this.scoreKeywordPresence(allText, personalWords);
    emphasis.personal = Math.min(1.0, 0.3 + personalScore * 0.7);

    // Heavy "you" language indicates personal focus
    const youCount = (allText.match(/\byou\b|\byour\b/g) || []).length;
    if (youCount > 20) {
      emphasis.personal += 0.1;
    }

    // Check for testimonials/reviews section
    const hasTestimonials = sections.some(section => {
      const text = section.textContent.toLowerCase();
      return text.includes('testimonial') || text.includes('review') ||
             text.includes('what clients say') || text.includes('success stories');
    });

    if (hasTestimonials) {
      emphasis.personal += 0.05;
    }

    // 4. Normalize to ensure values stay in 0-1 range
    Object.keys(emphasis).forEach(key => {
      emphasis[key] = Math.max(0, Math.min(1.0, emphasis[key]));
    });

    return emphasis;
  },

  // Score keyword presence (0-1)
  scoreKeywordPresence(text, keywords) {
    let totalMatches = 0;

    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword.replace(/\s+/g, '\\s+')}\\b`, 'gi');
      const matches = text.match(regex);
      totalMatches += matches ? matches.length : 0;
    });

    // Normalize: 0 matches = 0, 10+ matches = 1.0
    return Math.min(1.0, totalMatches / 10);
  },

  // Detect brand voice by combining formality and tone characteristics
  detectBrandVoice() {
    const formality = this.detectFormality();
    const adjectives = this.extractBrandAdjectives();

    // Base formality descriptor
    const formalityDescriptor = {
      'formal': 'distinguished',
      'professional': 'professional',
      'casual': 'friendly'
    }[formality] || 'professional';

    // If no adjectives found, return simple voice
    if (!adjectives || adjectives.length === 0) {
      return `${formalityDescriptor} and informative`;
    }

    // Categorize adjectives by tone
    const toneCategories = {
      sophisticated: ['premium', 'exceptional', 'finest', 'exquisite', 'elegant', 'refined', 'distinguished', 'elite'],
      approachable: ['welcoming', 'friendly', 'warm', 'comfortable', 'inviting', 'approachable', 'genuine', 'authentic', 'intimate', 'caring'],
      innovative: ['innovative', 'modern', 'contemporary', 'fresh', 'new', 'cutting-edge', 'advanced', 'progressive', 'creative'],
      authoritative: ['expert', 'experienced', 'professional', 'trusted', 'established', 'proven', 'certified', 'award-winning', 'reliable'],
      bold: ['bold', 'striking', 'powerful', 'dynamic', 'confident', 'distinctive', 'extraordinary', 'vibrant'],
      crafted: ['quality', 'crafted', 'artisan', 'handmade', 'masterful', 'meticulous'],
      personalized: ['personal', 'personalized', 'tailored', 'custom', 'bespoke', 'attentive', 'dedicated', 'thoughtful']
    };

    // Find which tones are present
    const tones = [];
    Object.keys(toneCategories).forEach(tone => {
      const hasMatch = adjectives.some(adj =>
        toneCategories[tone].includes(adj.toLowerCase())
      );
      if (hasMatch) {
        tones.push(tone);
      }
    });

    // Build voice description
    if (tones.length === 0) {
      return `${formalityDescriptor} and ${adjectives[0]}`;
    }

    if (tones.length === 1) {
      return `${formalityDescriptor} and ${tones[0]}`;
    }

    // Multiple tones - pick the top 2 most relevant
    // Priority: sophisticated > approachable > innovative > authoritative
    const tonePriority = ['sophisticated', 'approachable', 'innovative', 'authoritative', 'bold', 'crafted', 'personalized'];
    const sortedTones = tones.sort((a, b) => {
      return tonePriority.indexOf(a) - tonePriority.indexOf(b);
    });

    return `${sortedTones[0]} and ${sortedTones[1]}`;
  },

  // Extract brand styles from existing site
  extractBrandStyles() {
    const styles = {
      typography: {},
      colors: {},
      spacing: {},
      borderRadius: {}
    };

    // Extract typography
    const h1 = document.querySelector('h1');
    const h2 = document.querySelector('h2');
    const p = document.querySelector('p');

    if (h1) {
      const computed = getComputedStyle(h1);
      styles.typography.h1 = {
        fontFamily: computed.fontFamily,
        fontWeight: computed.fontWeight,
        fontSize: computed.fontSize,
        lineHeight: computed.lineHeight,
        letterSpacing: computed.letterSpacing,
        textTransform: computed.textTransform
      };
    }

    if (h2) {
      const computed = getComputedStyle(h2);
      styles.typography.h2 = {
        fontFamily: computed.fontFamily,
        fontWeight: computed.fontWeight,
        fontSize: computed.fontSize,
        lineHeight: computed.lineHeight
      };
    }

    if (p) {
      const computed = getComputedStyle(p);
      styles.typography.body = {
        fontFamily: computed.fontFamily,
        fontSize: computed.fontSize,
        lineHeight: computed.lineHeight,
        color: computed.color
      };
    }

    // Extract colors
    const primaryButton = document.querySelector('.sqs-block-button-element, .btn, button, a[class*="button"]');
    const link = document.querySelector('a');

    if (primaryButton) {
      const computed = getComputedStyle(primaryButton);
      styles.colors.primary = computed.backgroundColor;
      styles.colors.primaryText = computed.color;
      styles.borderRadius.button = computed.borderRadius;
    }

    if (link) {
      styles.colors.accent = getComputedStyle(link).color;
    }

    // Extract background colors
    const body = document.body;
    const firstSection = document.querySelector('section');

    styles.colors.background = getComputedStyle(body).backgroundColor;
    if (firstSection) {
      styles.colors.sectionBackground = getComputedStyle(firstSection).backgroundColor;
    }

    this.brandStyles = styles;
    return styles;
  },

  // Apply brand styles to For You elements
  applyBrandStyles(element, elementType = 'general') {
    if (!this.brandStyles) return;

    switch (elementType) {
      case 'heading':
        if (this.brandStyles.typography.h2) {
          element.style.fontFamily = this.brandStyles.typography.h2.fontFamily;
          element.style.fontWeight = this.brandStyles.typography.h2.fontWeight;
        }
        break;

      case 'body':
        if (this.brandStyles.typography.body) {
          element.style.fontFamily = this.brandStyles.typography.body.fontFamily;
          element.style.fontSize = this.brandStyles.typography.body.fontSize;
          element.style.lineHeight = this.brandStyles.typography.body.lineHeight;
        }
        break;

      case 'button':
        if (this.brandStyles.colors.primary) {
          element.style.backgroundColor = this.brandStyles.colors.primary;
          element.style.color = this.brandStyles.colors.primaryText || '#ffffff';
        }
        if (this.brandStyles.borderRadius.button) {
          element.style.borderRadius = this.brandStyles.borderRadius.button;
        }
        break;
    }
  },

  // Detect section type
  detectSectionType(section) {
    const text = section.innerText.toLowerCase();
    const headings = Array.from(section.querySelectorAll('h1, h2, h3'))
      .map(h => h.textContent.toLowerCase())
      .join(' ');
    const images = section.querySelectorAll('img').length;
    const hasGallery = section.querySelector('.gallery, .portfolio, .sqs-gallery') !== null;

    // Hero detection
    if (section === this.findElement(this.SELECTORS.hero)) {
      return this.SECTION_TYPES.HERO;
    }

    // Process/How We Work
    if (text.includes('process') || text.includes('how we work') || text.includes('our approach') ||
      headings.includes('process') || headings.includes('how it works')) {
      return this.SECTION_TYPES.PROCESS;
    }

    // Team/Artists/Staff
    if (text.includes('team') || text.includes('meet') || text.includes('artists') ||
      text.includes('our people') || headings.includes('team') || headings.includes('meet')) {
      return this.SECTION_TYPES.TEAM;
    }

    // Portfolio/Gallery/Work
    if (hasGallery || images > 5 || text.includes('portfolio') || text.includes('our work') ||
      headings.includes('portfolio') || headings.includes('gallery')) {
      return this.SECTION_TYPES.PORTFOLIO;
    }

    // Credentials/Awards/About
    if (text.includes('award') || text.includes('featured') || text.includes('years of experience') ||
      text.includes('certified') || headings.includes('about')) {
      return this.SECTION_TYPES.CREDENTIALS;
    }

    // Reviews/Testimonials
    if (text.includes('review') || text.includes('testimonial') || text.includes('what clients say') ||
      headings.includes('reviews') || headings.includes('testimonials')) {
      return this.SECTION_TYPES.SOCIAL_PROOF;
    }

    // Pricing
    if (text.includes('pricing') || text.includes('rates') || text.includes('packages') ||
      headings.includes('pricing') || headings.includes('investment')) {
      return this.SECTION_TYPES.PRICING;
    }

    // FAQ
    if (text.includes('faq') || text.includes('frequently asked') || text.includes('questions') ||
      headings.includes('faq')) {
      return this.SECTION_TYPES.FAQ;
    }

    // CTA (Call-to-Action)
    // Characteristics: Few buttons (1-3), CTA keywords, short text
    const buttons = section.querySelectorAll('button, a[class*="button"], a[class*="btn"], .sqs-block-button a');
    const buttonCount = buttons.length;

    if (buttonCount > 0 && buttonCount <= 3 && section.textContent.length < 300) {
      const ctaKeywords = ['book', 'contact', 'get started', 'schedule', 'inquire',
                          'reserve', 'let\'s talk', 'reach out', 'call us', 'email us',
                          'get in touch', 'start now', 'learn more', 'sign up'];

      const hasCtaKeyword = ctaKeywords.some(keyword => text.includes(keyword));

      // Check button text specifically
      const buttonTexts = Array.from(buttons).map(btn => btn.textContent.toLowerCase()).join(' ');
      const hasCtaInButton = ctaKeywords.some(keyword => buttonTexts.includes(keyword));

      if (hasCtaKeyword || hasCtaInButton) {
        return this.SECTION_TYPES.CTA;
      }
    }

    return this.SECTION_TYPES.GENERAL;
  },

  // Calculate section relevance based on preferences (multi-dimensional scoring)
  calculateSectionRelevance(sectionType, preferences) {
    // Base priority maps by decision style
    const priorityMaps = {
      'quick-intuitive': {
        [this.SECTION_TYPES.HERO]: 100,
        [this.SECTION_TYPES.PORTFOLIO]: 90,
        [this.SECTION_TYPES.CTA]: 85,
        [this.SECTION_TYPES.PRICING]: 70,
        [this.SECTION_TYPES.TEAM]: 60,
        [this.SECTION_TYPES.PROCESS]: 40,
        [this.SECTION_TYPES.SOCIAL_PROOF]: 40,
        [this.SECTION_TYPES.FAQ]: 30,
        [this.SECTION_TYPES.CREDENTIALS]: 30,
        [this.SECTION_TYPES.GENERAL]: 20
      },
      'researched-planned': {
        [this.SECTION_TYPES.HERO]: 100,
        [this.SECTION_TYPES.PROCESS]: 90,
        [this.SECTION_TYPES.FAQ]: 80,
        [this.SECTION_TYPES.SOCIAL_PROOF]: 75,
        [this.SECTION_TYPES.PRICING]: 70,
        [this.SECTION_TYPES.PORTFOLIO]: 65,
        [this.SECTION_TYPES.TEAM]: 60,
        [this.SECTION_TYPES.CREDENTIALS]: 50,
        [this.SECTION_TYPES.CTA]: 45,
        [this.SECTION_TYPES.GENERAL]: 20
      },
      'guided-experts': {
        [this.SECTION_TYPES.HERO]: 100,
        [this.SECTION_TYPES.CREDENTIALS]: 90,
        [this.SECTION_TYPES.TEAM]: 85,
        [this.SECTION_TYPES.PORTFOLIO]: 80,
        [this.SECTION_TYPES.SOCIAL_PROOF]: 70,
        [this.SECTION_TYPES.PROCESS]: 50,
        [this.SECTION_TYPES.PRICING]: 40,
        [this.SECTION_TYPES.CTA]: 35,
        [this.SECTION_TYPES.FAQ]: 30,
        [this.SECTION_TYPES.GENERAL]: 20
      }
    };

    // Get base score from decision style
    const decisionStyle = preferences.decisionStyle || 'researched-planned';
    const priorityMap = priorityMaps[decisionStyle] || priorityMaps['researched-planned'];
    let score = priorityMap[sectionType] || 20;

    // Adjust based on visual style preference
    const visualStyle = preferences.visualStyle;
    if (visualStyle === 'bold-dramatic') {
      // Bold dramatic: Emphasize visual impact and standout sections
      if (sectionType === this.SECTION_TYPES.PORTFOLIO) score += 12;
      if (sectionType === this.SECTION_TYPES.HERO) score += 8;
      if (sectionType === this.SECTION_TYPES.CTA) score += 5;
      // De-emphasize text-heavy sections
      if (sectionType === this.SECTION_TYPES.FAQ) score -= 10;
      if (sectionType === this.SECTION_TYPES.PROCESS) score -= 5;

    } else if (visualStyle === 'warm-welcoming') {
      // Warm welcoming: Emphasize human connection
      if (sectionType === this.SECTION_TYPES.TEAM) score += 15;
      if (sectionType === this.SECTION_TYPES.SOCIAL_PROOF) score += 12;
      if (sectionType === this.SECTION_TYPES.CTA) score += 5;
      // Less emphasis on formal credentials
      if (sectionType === this.SECTION_TYPES.CREDENTIALS) score -= 8;

    } else if (visualStyle === 'clean-minimal') {
      // Clean minimal: Emphasize clarity and information
      if (sectionType === this.SECTION_TYPES.PROCESS) score += 10;
      if (sectionType === this.SECTION_TYPES.FAQ) score += 8;
      if (sectionType === this.SECTION_TYPES.PRICING) score += 5;
      // De-emphasize busy gallery sections
      if (sectionType === this.SECTION_TYPES.PORTFOLIO) score -= 8;
    }

    // Adjust based on priority preference
    const priority = preferences.priority;
    if (priority === 'quality-craft') {
      // Quality & craft: Show the work and expertise
      if (sectionType === this.SECTION_TYPES.PORTFOLIO) score += 15;
      if (sectionType === this.SECTION_TYPES.CREDENTIALS) score += 12;
      if (sectionType === this.SECTION_TYPES.PROCESS) score += 8;
      // Less emphasis on price
      if (sectionType === this.SECTION_TYPES.PRICING) score -= 10;

    } else if (priority === 'personal-connection') {
      // Personal connection: Emphasize people and relationships
      if (sectionType === this.SECTION_TYPES.TEAM) score += 18;
      if (sectionType === this.SECTION_TYPES.SOCIAL_PROOF) score += 15;
      if (sectionType === this.SECTION_TYPES.CTA) score += 8;
      // Less emphasis on formal process
      if (sectionType === this.SECTION_TYPES.PROCESS) score -= 5;
      if (sectionType === this.SECTION_TYPES.FAQ) score -= 5;

    } else if (priority === 'something-new') {
      // Something new: Emphasize innovation and fresh work
      if (sectionType === this.SECTION_TYPES.PORTFOLIO) score += 12;
      if (sectionType === this.SECTION_TYPES.PROCESS) score += 10;
      if (sectionType === this.SECTION_TYPES.CTA) score += 8;
      // Less emphasis on established credentials
      if (sectionType === this.SECTION_TYPES.CREDENTIALS) score -= 8;
      if (sectionType === this.SECTION_TYPES.SOCIAL_PROOF) score -= 5;
    }

    // Ensure score stays in reasonable range (0-120)
    return Math.max(0, Math.min(120, score));
  },

  // Reorder page sections
  async reorderPageSections(preferences) {
    const sections = Array.from(this.findAllElements(this.SELECTORS.sections))
      .filter(s => !s.classList.contains('for-you-intro-section') &&
                   !s.classList.contains('for-you-final-cta') &&
                   s.offsetHeight > 50); // Skip tiny sections

    if (sections.length < 2) {
      console.log('For You: Not enough sections to reorder');
      return;
    }

    // Score each section
    const scoredSections = sections.map((section, originalIndex) => {
      const type = this.detectSectionType(section);
      const relevance = this.calculateSectionRelevance(type, preferences);

      return {
        element: section,
        type: type,
        relevance: relevance,
        originalIndex: originalIndex
      };
    });

    // Sort by relevance
    scoredSections.sort((a, b) => b.relevance - a.relevance);

    // Apply CSS order property
    const parentContainer = sections[0].parentElement;
    if (parentContainer) {
      parentContainer.style.display = 'flex';
      parentContainer.style.flexDirection = 'column';
    }

    scoredSections.forEach((item, newIndex) => {
      item.element.style.order = newIndex;

      // Binary visibility decision: either relevant or hidden
      // Relevant (≥40): Section is important for this visitor's narrative journey
      // Hidden (<40): Section doesn't fit this visitor's preferences
      if (item.relevance >= 70) {
        item.element.classList.add('for-you-relevant-section');
      } else if (item.relevance < 40) {
        // This section will be collapsed and hidden completely
        item.element.classList.add('for-you-low-relevance-section');
      }
    });

    // Animate and collapse low-relevance sections
    await this.wait(400);
    await this.collapseAndHideLowRelevanceSections();

    return scoredSections;
  },

  // Collapse and hide low-relevance sections
  async collapseAndHideLowRelevanceSections() {
    const lowRelevanceSections = document.querySelectorAll('.for-you-low-relevance-section');

    for (const section of lowRelevanceSections) {
      // Store original state
      section.dataset.forYouOriginalDisplay = getComputedStyle(section).display;
      section.dataset.forYouOriginalHeight = section.offsetHeight + 'px';
      section.dataset.forYouOriginalPadding = JSON.stringify({
        top: getComputedStyle(section).paddingTop,
        bottom: getComputedStyle(section).paddingBottom
      });
      section.dataset.forYouOriginalMargin = JSON.stringify({
        top: getComputedStyle(section).marginTop,
        bottom: getComputedStyle(section).marginBottom
      });

      // Apply smooth collapse
      section.style.transition = `
        max-height 400ms cubic-bezier(0.4, 0, 0.2, 1),
        opacity 300ms cubic-bezier(0.4, 0, 0.2, 1),
        padding 400ms cubic-bezier(0.4, 0, 0.2, 1),
        margin 400ms cubic-bezier(0.4, 0, 0.2, 1),
        transform 300ms cubic-bezier(0.4, 0, 0.2, 1)
      `;
      section.style.overflow = 'hidden';
      section.style.maxHeight = section.offsetHeight + 'px';

      // Force reflow
      section.offsetHeight;

      // Collapse
      section.style.maxHeight = '0';
      section.style.opacity = '0';
      section.style.paddingTop = '0';
      section.style.paddingBottom = '0';
      section.style.marginTop = '0';
      section.style.marginBottom = '0';
      section.style.transform = 'scale(0.98)';

      section.classList.add('for-you-hidden');
    }

    await this.wait(400);

    // Fully hide
    lowRelevanceSections.forEach(section => {
      section.style.display = 'none';
    });
  },

  // Restore all sections
  restoreAllSections() {
    const hiddenSections = document.querySelectorAll('.for-you-hidden');

    hiddenSections.forEach((section, index) => {
      const originalPadding = section.dataset.forYouOriginalPadding ?
        JSON.parse(section.dataset.forYouOriginalPadding) : {};
      const originalMargin = section.dataset.forYouOriginalMargin ?
        JSON.parse(section.dataset.forYouOriginalMargin) : {};

      section.style.display = section.dataset.forYouOriginalDisplay || '';

      setTimeout(() => {
        section.style.maxHeight = section.dataset.forYouOriginalHeight || '2000px';
        section.style.opacity = '1';
        section.style.paddingTop = originalPadding.top || '';
        section.style.paddingBottom = originalPadding.bottom || '';
        section.style.marginTop = originalMargin.top || '';
        section.style.marginBottom = originalMargin.bottom || '';
        section.style.transform = 'scale(1)';

        setTimeout(() => {
          section.style.maxHeight = '';
          section.style.transition = '';
          section.style.overflow = '';
          section.style.transform = '';
          section.style.order = '';
          section.classList.remove('for-you-hidden');
          section.classList.remove('for-you-low-relevance-section');
          section.classList.remove('for-you-relevant-section');

          delete section.dataset.forYouOriginalDisplay;
          delete section.dataset.forYouOriginalHeight;
          delete section.dataset.forYouOriginalPadding;
          delete section.dataset.forYouOriginalMargin;
        }, 400);
      }, index * 50);
    });

    // Also restore parent container
    const sections = this.findAllElements(this.SELECTORS.sections);
    if (sections.length > 0) {
      const parent = sections[0].parentElement;
      if (parent) {
        setTimeout(() => {
          parent.style.display = '';
          parent.style.flexDirection = '';
        }, hiddenSections.length * 50 + 400);
      }
    }
  },

  // Detect repeated items in a section using generic pattern matching
  detectRepeatedItems(section) {
    // Get all direct children of the section
    let children = Array.from(section.children).filter(child => {
      // Filter out injected For You elements and very small elements
      return !child.classList.contains('for-you-intro-section') &&
             !child.classList.contains('for-you-final-cta') &&
             child.offsetHeight > 20;
    });

    console.log(`For You: Section has ${children.length} direct children`);

    // If not enough direct children, try looking one level deeper
    if (children.length < 7) {
      console.log(`For You: Not enough direct children (${children.length} < 7), checking nested structure`);

      // Look for list containers (ul, ol) - common for repeated items like team members
      const lists = section.querySelectorAll('ul, ol');
      console.log(`For You: Found ${lists.length} list elements in section`);

      if (lists.length > 0) {
        // Use the list with the most items
        const largestList = Array.from(lists).reduce((max, list) =>
          list.children.length > (max?.children.length || 0) ? list : max
        , null);

        if (largestList && largestList.children.length >= 7) {
          children = Array.from(largestList.children).filter(child => {
            return !child.classList.contains('for-you-intro-section') &&
                   !child.classList.contains('for-you-final-cta') &&
                   child.offsetHeight > 20;
          });

          console.log(`For You: Found list with ${children.length} items (tag: ${largestList.tagName.toLowerCase()})`);
        }
      }

      // If no lists found, look for other containers with many children
      if (children.length < 7) {
        const containers = Array.from(section.children).filter(child => child.children.length >= 7);
        console.log(`For You: Found ${containers.length} containers with 7+ children`);

        if (containers.length > 0) {
          // Use the container with the most children
          const largestContainer = containers.reduce((max, container) =>
            container.children.length > max.children.length ? container : max
          );

          children = Array.from(largestContainer.children).filter(child => {
            return !child.classList.contains('for-you-intro-section') &&
                   !child.classList.contains('for-you-final-cta') &&
                   child.offsetHeight > 20;
          });

          console.log(`For You: Found nested container with ${children.length} children`);
        }
      }
    }

    if (children.length < 7) {
      // Need at least 7 items to consider filtering
      console.log(`For You: Not enough children (${children.length} < 7), skipping`);
      return [];
    }

    // Create structural signatures for each child
    const signatures = children.map(child => {
      const childElements = child.querySelectorAll('*');

      return {
        element: child,
        signature: {
          tagName: child.tagName.toLowerCase(),
          childCount: child.children.length,
          hasImage: child.querySelector('img') !== null,
          hasHeading: child.querySelector('h1, h2, h3, h4, h5, h6') !== null,
          hasLink: child.querySelector('a') !== null,
          hasButton: child.querySelector('button, .button, .btn') !== null,
          textLength: Math.floor(child.textContent.trim().length / 50) * 50, // Bucketed
          classList: Array.from(child.classList).sort().join(' ')
        }
      };
    });

    // Group by similar signatures
    const groups = {};
    signatures.forEach(({element, signature}) => {
      const key = JSON.stringify(signature);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(element);
    });

    console.log(`For You: Found ${Object.keys(groups).length} unique structural patterns`);

    // Find the largest group
    let largestGroup = [];
    let largestGroupSignature = null;
    Object.entries(groups).forEach(([key, group]) => {
      if (group.length > largestGroup.length) {
        largestGroup = group;
        largestGroupSignature = JSON.parse(key);
      }
    });

    console.log(`For You: Largest group has ${largestGroup.length} items`);
    if (largestGroupSignature) {
      console.log(`For You: Pattern:`, largestGroupSignature);
    }

    // Return the largest group if it has 7+ items
    if (largestGroup.length >= 7) {
      return largestGroup;
    } else {
      console.log(`For You: Largest group too small (${largestGroup.length} < 7), no filtering needed`);
      return [];
    }
  },

  // Calculate relevance score for a repeated item
  calculateItemRelevance(item, index, sectionType, preferences) {
    let score = 50; // Base score

    // Factor 1: Image presence (high signal for visual content)
    const hasImage = item.querySelector('img') !== null;
    if (hasImage) {
      score += 20;

      // Bonus for larger images
      const img = item.querySelector('img');
      if (img && img.offsetWidth > 200) {
        score += 5;
      }
    }

    // Factor 2: Text quality (substantial content)
    const textContent = item.textContent.trim();
    const textLength = textContent.length;

    if (textLength > 100) score += 15;
    if (textLength > 200) score += 10;
    if (textLength > 400) score += 5;

    // Factor 3: Position bias (first items often most important/featured)
    if (index < 3) {
      score += 15; // Top 3 items
    } else if (index < 6) {
      score += 5;  // Top 6 items
    }

    // Factor 4: Featured indicators
    if (item.classList.contains('featured') || item.classList.contains('highlight')) {
      score += 25;
    }

    // Factor 5: Interactive elements
    const hasLink = item.querySelector('a') !== null;
    const hasButton = item.querySelector('button, .button, .btn') !== null;

    if (hasLink) score += 10;
    if (hasButton) score += 15;

    // Factor 6: Preference alignment
    if (preferences) {
      if (preferences.priority === 'quality-craft') {
        // Favor items with longer descriptions and portfolio indicators
        if (textLength > 150) score += 15;
        if (textContent.toLowerCase().includes('portfolio') ||
            textContent.toLowerCase().includes('work')) {
          score += 10;
        }
      } else if (preferences.priority === 'personal-connection') {
        // Favor items with bio/story content
        if (textContent.toLowerCase().includes('bio') ||
            textContent.toLowerCase().includes('story') ||
            textContent.toLowerCase().includes('about')) {
          score += 20;
        }
        // Favor personal photos (headshots tend to be square-ish)
        if (hasImage) {
          const img = item.querySelector('img');
          if (img && Math.abs(img.offsetWidth - img.offsetHeight) < 50) {
            score += 10; // Square-ish image (likely headshot)
          }
        }
      } else if (preferences.priority === 'something-new') {
        // Favor items with dates, "new" indicators
        if (textContent.toLowerCase().includes('new') ||
            textContent.toLowerCase().includes('recent') ||
            textContent.toLowerCase().includes('2024') ||
            textContent.toLowerCase().includes('2025')) {
          score += 15;
        }
      }

      // Visual style adjustments
      if (preferences.visualStyle === 'bold-dramatic' && hasImage) {
        score += 10; // Favor visual items
      } else if (preferences.visualStyle === 'clean-minimal' && textLength < 150) {
        score += 5; // Favor concise items
      }

      // Decision style adjustments
      if (preferences.decisionStyle === 'quick-intuitive' && (hasButton || hasLink)) {
        score += 10; // Favor actionable items
      }
    }

    return score;
  },

  // Hide a repeated item with animation
  async hideRepeatedItem(item) {
    // Store original state
    item.dataset.forYouOriginalDisplay = getComputedStyle(item).display;
    item.dataset.forYouOriginalHeight = item.offsetHeight + 'px';
    item.dataset.forYouOriginalMargin = JSON.stringify({
      top: getComputedStyle(item).marginTop,
      bottom: getComputedStyle(item).marginBottom,
      left: getComputedStyle(item).marginLeft,
      right: getComputedStyle(item).marginRight
    });
    item.dataset.forYouHiddenItem = 'true';

    // Apply smooth collapse animation
    item.style.transition = `
      max-height 400ms cubic-bezier(0.4, 0, 0.2, 1),
      opacity 300ms cubic-bezier(0.4, 0, 0.2, 1),
      margin 400ms cubic-bezier(0.4, 0, 0.2, 1),
      transform 300ms cubic-bezier(0.4, 0, 0.2, 1)
    `;
    item.style.overflow = 'hidden';
    item.style.maxHeight = item.offsetHeight + 'px';

    // Force reflow
    item.offsetHeight;

    // Animate collapse
    item.style.maxHeight = '0';
    item.style.opacity = '0';
    item.style.marginTop = '0';
    item.style.marginBottom = '0';
    item.style.marginLeft = '0';
    item.style.marginRight = '0';
    item.style.transform = 'scale(0.95)';

    // Wait for animation
    await this.wait(400);

    // Fully hide
    item.style.display = 'none';
  },

  // Filter repeated content in a section (keep top 3 of 6+)
  async filterRepeatedContent(section, sectionType, preferences) {
    // Detect repeated items using generic pattern matching
    const items = this.detectRepeatedItems(section);

    // Early return if not enough items to filter
    if (items.length <= 6) {
      return;
    }

    console.log(`For You: Found ${items.length} repeated items in ${sectionType} section`);

    // Score all items
    const scoredItems = items.map((item, index) => ({
      element: item,
      score: this.calculateItemRelevance(item, index, sectionType, preferences),
      originalIndex: index
    }));

    // Sort by score (descending)
    scoredItems.sort((a, b) => b.score - a.score);

    // Keep top 3, hide rest
    const itemsToKeep = scoredItems.slice(0, 3);
    const itemsToHide = scoredItems.slice(3);

    console.log(`For You: Keeping top 3 items (scores: ${itemsToKeep.map(i => i.score).join(', ')})`);
    console.log(`For You: Hiding ${itemsToHide.length} items`);

    // Hide items with staggered timing for smooth animation
    for (let i = 0; i < itemsToHide.length; i++) {
      setTimeout(() => {
        this.hideRepeatedItem(itemsToHide[i].element);
      }, i * 30); // Stagger by 30ms
    }
  },

  // Calculate length constraints for an element
  calculateLengthConstraints(element, originalText) {
    const constraints = {
      originalLength: originalText.length,
      minLength: null,
      maxLength: null,
      maxTolerance: null,
      minTolerance: null
    };

    // Different tolerance for different element types
    const elementType = this.getElementType(element);

    switch(elementType) {
      case 'headline':
        // Headlines: accept much shorter (50% min), strict on max (+20%)
        constraints.minTolerance = 0.50;
        constraints.maxTolerance = 0.20;
        break;

      case 'cta':
        // CTAs: accept shorter (40% min), very strict on max (+10%)
        // Reduced from 15% to account for button padding
        constraints.minTolerance = 0.40;
        constraints.maxTolerance = 0.10;
        break;

      case 'subheading':
        // Subheadings: accept shorter (45% min), moderate max (+25%)
        constraints.minTolerance = 0.45;
        constraints.maxTolerance = 0.25;
        break;

      case 'paragraph':
        // Paragraphs: very flexible on min (30% min), flexible max (+40%)
        constraints.minTolerance = 0.30;
        constraints.maxTolerance = 0.40;
        break;

      default:
        constraints.minTolerance = 0.40;
        constraints.maxTolerance = 0.25;
    }

    // Min can go down significantly, max is strict
    constraints.minLength = Math.floor(
      originalText.length * constraints.minTolerance
    );
    constraints.maxLength = Math.ceil(
      originalText.length * (1 + constraints.maxTolerance)
    );

    // CRITICAL: Account for padding in buttons/CTAs
    if (elementType === 'cta') {
      const computed = getComputedStyle(element);
      const paddingLeft = parseFloat(computed.paddingLeft) || 0;
      const paddingRight = parseFloat(computed.paddingRight) || 0;
      const totalPadding = paddingLeft + paddingRight;

      // If button has significant padding (> 20px total), reduce max length further
      if (totalPadding > 20) {
        // Reduce tolerance by 5% to be extra safe with padded buttons
        constraints.maxLength = Math.floor(originalText.length * 1.05);
      }
    }

    // Visual container check - make max even stricter
    const visualConstraints = this.checkVisualConstraints(element);
    if (visualConstraints.hasFixedWidth) {
      // Very strict max for fixed-width containers
      constraints.maxLength = Math.floor(originalText.length * 1.10);
    }

    return constraints;
  },

  // Check if element has layout constraints
  checkVisualConstraints(element) {
    const computed = getComputedStyle(element);
    const parent = element.parentElement;
    const parentComputed = parent ? getComputedStyle(parent) : null;

    return {
      hasFixedWidth: computed.width !== 'auto' && !computed.width.includes('%'),
      hasOverflow: computed.overflow === 'hidden',
      isTruncated: computed.textOverflow === 'ellipsis',
      isFlexItem: parentComputed?.display === 'flex',
      hasMaxWidth: computed.maxWidth !== 'none'
    };
  },

  // Get element type for classification
  getElementType(element) {
    const tagName = element.tagName.toLowerCase();

    if (tagName === 'h1') return 'headline';
    if (tagName === 'h2') return 'subheading';
    if (tagName === 'h3' || tagName === 'h4') return 'subheading';
    if (tagName === 'button' || element.classList.contains('btn')) return 'cta';
    if (tagName === 'a' && this.isPrimaryCTA(element)) return 'cta';
    if (tagName === 'p') return 'paragraph';

    return 'text';
  },

  // Check if modification broke layout
  hasLayoutIssue(element) {
    const computed = getComputedStyle(element);

    // Check for horizontal overflow
    if (element.scrollWidth > element.clientWidth + 5) {
      return true; // Text is overflowing horizontally
    }

    // Check for vertical overflow
    if (element.scrollHeight > element.clientHeight + 5) {
      return true; // Text is overflowing vertically
    }

    // Check if text was truncated
    const range = document.createRange();
    range.selectNodeContents(element);
    const textWidth = range.getBoundingClientRect().width;
    const containerWidth = element.getBoundingClientRect().width;

    if (textWidth > containerWidth + 5) {
      return true; // Text doesn't fit
    }

    // CRITICAL: Check for text-overflow: ellipsis or hidden overflow
    if (computed.textOverflow === 'ellipsis' || computed.overflow === 'hidden') {
      // If overflow is hidden, check if text is actually being clipped
      const padding = parseFloat(computed.paddingLeft || 0) + parseFloat(computed.paddingRight || 0);
      const availableWidth = containerWidth - padding;

      if (textWidth > availableWidth + 2) {
        return true; // Text is being clipped
      }
    }

    return false;
  },

  // Load personalization mapping from JSON
  async loadPersonalizationMapping(preferences) {
    try {
      const url = chrome.runtime.getURL('data/personalization-map.json');
      const response = await fetch(url);
      const data = await response.json();

      // Build key from preferences
      const key = `${preferences.decisionStyle}-${preferences.visualStyle}-${preferences.priority}`;
      console.log('For You: Loading mapping for key:', key);

      // Return matching mapping or default
      return data.mappings[key] || data.mappings['researched-minimal-personal'];
    } catch (error) {
      console.error('For You: Error loading personalization mapping', error);
      // Return default mapping
      return {
        hero: {
          headlinePattern: 'Your Personalized Experience',
          subheadlinePattern: 'Curated just for you',
          bodyPattern: 'Discover what matters most'
        },
        cta: 'Learn More',
        recommendationCard: {
          title: 'Personalized for you',
          description: 'Content tailored to your preferences'
        }
      };
    }
  },

  // Detect offering type based on site type
  detectOffering(siteType) {
    const offerings = {
      service: 'Service',
      ecommerce: 'Collection',
      portfolio: 'Work',
      restaurant: 'Menu',
      professional: 'Solutions'
    };
    return offerings[siteType] || 'Experience';
  },

  // Animate text change smoothly
  async animateTextChange(element, newText) {
    if (!element) return;

    // Fade out
    element.style.transition = 'opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)';
    element.style.opacity = '0';

    await this.wait(150);

    // Change text - preserve inner HTML structure if it exists
    // Check if element has only text nodes or simple structure
    const hasComplexStructure = element.children.length > 0 ||
                                  element.innerHTML.includes('<br>') ||
                                  element.innerHTML.includes('<span>');

    if (hasComplexStructure) {
      // Preserve structure by finding and replacing text nodes only
      this.replaceTextPreservingStructure(element, newText);
    } else {
      // Simple case: just replace textContent
      element.textContent = newText;
    }

    // Fade in
    element.style.opacity = '1';

    await this.wait(150);

    // Clean up
    element.style.transition = '';
  },

  // Replace text while preserving HTML structure (br tags, spans, etc)
  replaceTextPreservingStructure(element, newText) {
    // Find all text nodes
    const textNodes = [];
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let node;
    while (node = walker.nextNode()) {
      // Skip empty or whitespace-only nodes
      if (node.textContent.trim().length > 0) {
        textNodes.push(node);
      }
    }

    if (textNodes.length === 0) {
      // No text nodes found, fallback to textContent
      element.textContent = newText;
      return;
    }

    // Replace first significant text node with new text, clear others
    textNodes[0].textContent = newText;
    for (let i = 1; i < textNodes.length; i++) {
      textNodes[i].textContent = '';
    }
  },

  // Personalize hero section
  async personalizeHero(heroMapping, siteType) {
    const hero = this.findElement(this.SELECTORS.hero);
    if (!hero) {
      console.log('For You: Hero not found');
      return;
    }

    console.log('For You: Personalizing hero', heroMapping);

    // Find and update h1
    const h1 = hero.querySelector('h1');
    if (h1 && heroMapping.headlinePattern) {
      const offering = this.detectOffering(siteType);
      const newText = heroMapping.headlinePattern
        .replace(/{offering}/gi, offering)
        .replace(/{service}/gi, offering);
      await this.animateTextChange(h1, newText);
    }

    // Find and update h2 or first p if subheadline exists
    if (heroMapping.subheadlinePattern) {
      const h2 = hero.querySelector('h2');
      const firstP = hero.querySelector('p');
      const target = h2 || firstP;

      if (target) {
        await this.animateTextChange(target, heroMapping.subheadlinePattern);
      }
    }

    console.log('For You: Hero personalized');
  },

  // Inject recommendation card
  async injectRecommendationCard(cardData, siteType) {
    const hero = this.findElement(this.SELECTORS.hero);
    if (!hero) {
      console.log('For You: Hero not found for recommendation card');
      return;
    }

    console.log('For You: Injecting recommendation card', cardData);

    // Create card element
    const card = document.createElement('div');
    card.className = 'for-you-recommendation-card';
    card.dataset.forYouElement = 'true';

    // Create badge
    const badge = document.createElement('div');
    badge.className = 'for-you-badge';
    badge.textContent = 'For You';

    // Create title
    const title = document.createElement('h3');
    title.textContent = cardData.title;
    title.style.marginTop = '12px';
    title.style.marginBottom = '8px';
    this.applyBrandStyles(title, 'heading');

    // Create description
    const description = document.createElement('p');
    description.textContent = cardData.description;
    description.style.margin = '0';
    this.applyBrandStyles(description, 'body');

    // Assemble card
    card.appendChild(badge);
    card.appendChild(title);
    card.appendChild(description);

    // Insert after hero
    hero.after(card);

    console.log('For You: Recommendation card injected');
  },

  // Check if button is a primary CTA
  isPrimaryCTA(button) {
    const text = button.textContent.toLowerCase();
    const href = button.getAttribute('href') || '';

    // Primary CTA indicators
    const primaryIndicators = [
      'book', 'contact', 'get started', 'learn more',
      'shop', 'buy', 'schedule', 'reserve', 'inquire',
      'register', 'enroll', 'sign up', 'join'
    ];

    // Exclude social media and navigation links (but NOT action buttons in nav)
    const excludeIndicators = ['instagram', 'facebook', 'twitter', 'linkedin', 'youtube', 'social'];

    const isPrimary = primaryIndicators.some(indicator =>
      text.includes(indicator) || href.includes(indicator)
    );

    const isExcluded = excludeIndicators.some(indicator =>
      text.includes(indicator) || href.includes(indicator)
    );

    // CHANGED: Now INCLUDE CTAs in header/nav, only exclude footer
    // This allows nav CTAs like "Book Now" to be personalized
    const inFooter = button.closest('footer') !== null;

    return isPrimary && !isExcluded && !inFooter;
  },

  // Update CTA buttons throughout page
  updateCTAs(ctaText, siteType) {
    console.log('For You: Updating CTAs to:', ctaText);

    const buttons = this.findAllElements(this.SELECTORS.buttons);
    let updatedCount = 0;

    buttons.forEach(button => {
      if (this.isPrimaryCTA(button)) {
        // Store original text
        if (!button.dataset.forYouOriginalText) {
          button.dataset.forYouOriginalText = button.textContent;
        }

        // Update text
        this.animateTextChange(button, ctaText);
        button.dataset.forYouElement = 'true';
        updatedCount++;
      }
    });

    console.log(`For You: Updated ${updatedCount} CTA buttons`);
  },

  // Inject final CTA section at bottom
  async injectFinalCTA(preferences, mapping) {
    console.log('For You: Injecting final CTA');

    // Find last section
    const sections = this.findAllElements(this.SELECTORS.sections);
    if (sections.length === 0) {
      console.log('For You: No sections found for final CTA');
      return;
    }

    const lastSection = sections[sections.length - 1];

    // Create final CTA section
    const finalCTA = document.createElement('section');
    finalCTA.className = 'for-you-final-cta';
    finalCTA.dataset.forYouElement = 'true';
    finalCTA.style.order = '999'; // Ensure it appears last

    // Create heading
    const heading = document.createElement('h2');
    const offering = this.detectOffering(this.siteType);
    heading.textContent = mapping.hero.headlinePattern
      .replace(/{offering}/gi, offering)
      .replace(/{service}/gi, offering);
    this.applyBrandStyles(heading, 'heading');

    // Create button
    const button = document.createElement('button');
    button.textContent = mapping.cta;
    button.className = 'for-you-final-cta-button';
    this.applyBrandStyles(button, 'button');

    // Assemble section
    finalCTA.appendChild(heading);
    finalCTA.appendChild(button);

    // Insert after last section
    lastSection.after(finalCTA);

    console.log('For You: Final CTA injected');
  },

  // Inject personalized intro section
  async injectPersonalizedIntro(preferences, mapping) {
    const hero = this.findElement(this.SELECTORS.hero);
    if (!hero) return;

    console.log('For You: Injecting intro section');

    const intro = document.createElement('div');
    intro.className = 'for-you-intro-section';
    intro.dataset.forYouElement = 'true';
    intro.style.cssText = `
      padding: 60px 20px;
      text-align: center;
      background: linear-gradient(135deg, rgba(52, 199, 89, 0.05) 0%, rgba(52, 199, 89, 0.02) 100%);
      order: -1;
    `;

    const badge = document.createElement('div');
    badge.className = 'for-you-badge';
    badge.textContent = 'For You';

    const heading = document.createElement('h2');
    // Use mapping instead of hardcoded logic
    const offering = this.detectOffering(this.siteType);
    heading.textContent = mapping.hero.headlinePattern
      .replace(/{offering}/gi, offering)
      .replace(/{service}/gi, offering);
    this.applyBrandStyles(heading, 'heading');
    heading.style.marginTop = '16px';

    intro.appendChild(badge);
    intro.appendChild(heading);

    hero.parentElement.insertBefore(intro, hero);
  },

  // Generate deterministic ID for element based on content
  generateElementId(element) {
    if (!element.dataset.forYouId) {
      // Create deterministic ID from text content and position
      const text = element.textContent.trim().substring(0, 20);
      const tagName = element.tagName.toLowerCase();

      // Simple hash function for consistency
      let hash = 0;
      for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }

      element.dataset.forYouId = 'fy-' + tagName + '-' + Math.abs(hash).toString(36);
    }
    return element.dataset.forYouId;
  },

  // Audit page content and classify elements
  async auditPageContent() {
    const inventory = {
      headings: [],
      paragraphs: [],
      lists: [],
      buttons: [],
      navigation: []  // Add navigation items
    };

    // Collect navigation items first (outside of sections)
    const navSelectors = 'nav a, header a, .header a, .navigation a, .nav a, [role="navigation"] a, .menu a';
    document.querySelectorAll(navSelectors).forEach(el => {
      const text = el.textContent.trim();

      // Skip empty, icons-only, or very long nav items
      if (text.length < 2 || text.length > 30) return;

      // Skip if it's just an icon or SVG
      if (el.querySelector('svg') && text.length < 3) return;

      inventory.navigation.push({
        element: el,
        originalText: text,
        classification: {
          type: 'navigation',
          level: 'primary',
          context: 'nav-menu',
          modifiabilityScore: this.calculateModifiabilityScore(el)
        }
      });
    });

    // Scan all sections
    const sections = this.findAllElements(this.SELECTORS.sections);

    // Process sections with yielding to keep browser responsive
    let processedCount = 0;
    for (const section of sections) {
      const sectionType = this.detectSectionType(section);

      // Classify headings
      section.querySelectorAll('h1, h2, h3, h4').forEach(el => {
        const text = el.textContent.trim();

        // Skip empty, very short, or placeholder headings
        if (text.length < 3) return;
        if (/empty\s+heading/i.test(text)) return; // Skip "Empty heading" placeholders
        if (text.toLowerCase().includes('lorem ipsum')) return; // Skip placeholder text

        const tagName = el.tagName.toLowerCase();
        const level = (tagName === 'h1') ? 'primary' : 'secondary';

        inventory.headings.push({
          element: el,
          originalText: text,
          classification: {
            type: 'heading',
            level: level,
            sectionType: sectionType,
            modifiabilityScore: this.calculateModifiabilityScore(el)
          }
        });
      });

      // Classify paragraphs
      section.querySelectorAll('p').forEach((el, index) => {
        const text = el.textContent.trim();

        // Skip empty or very short paragraphs
        if (text.length < 10) return;

        const isIntro = index === 0; // First paragraph is intro

        inventory.paragraphs.push({
          element: el,
          originalText: text,
          classification: {
            type: 'paragraph',
            level: 'supporting',
            sectionType: sectionType,
            context: isIntro ? 'intro' : 'body',
            modifiabilityScore: this.calculateModifiabilityScore(el)
          }
        });
      });

      // Classify buttons
      section.querySelectorAll('button, a').forEach(el => {
        if (el.textContent.trim().length > 0 && el.textContent.trim().length < 50) {
          inventory.buttons.push({
            element: el,
            originalText: el.textContent.trim(),
            classification: {
              type: 'button',
              level: this.isPrimaryCTA(el) ? 'primary' : 'secondary',
              sectionType: sectionType,
              modifiabilityScore: this.calculateModifiabilityScore(el)
            }
          });
        }
      });

      // Yield to event loop every 5 sections to keep page responsive
      processedCount++;
      if (processedCount % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    console.log('For You: Page audit complete', {
      headings: inventory.headings.length,
      paragraphs: inventory.paragraphs.length,
      buttons: inventory.buttons.length,
      navigation: inventory.navigation.length
    });

    return inventory;
  },

  // Calculate modifiability score for an element
  calculateModifiabilityScore(element) {
    let score = 100;

    const text = element.textContent.trim();

    // Reduce score for various factors
    if (text.length < 5) score -= 40; // Very short text
    if (text.length > 200) score -= 20; // Very long text
    if (/[A-Z]{2,}/.test(text)) score -= 15; // Has acronyms/caps
    if (/\d/.test(text)) score -= 15; // Has numbers
    if (/©|®|™/.test(text)) score -= 30; // Has legal symbols
    if (element.closest('footer, nav')) score -= 40; // In footer/nav

    // Check for proper nouns (capitalized words mid-sentence)
    const words = text.split(' ');
    const properNouns = words.filter((w, i) => i > 0 && /^[A-Z]/.test(w)).length;
    score -= properNouns * 10;

    return Math.max(0, Math.min(100, score)) / 100; // Normalize to 0-1
  },

  // Prepare elements for API with length constraints
  prepareElementsForAPI(inventory) {
    const elements = [];

    // Navigation items (high priority for personalization)
    if (inventory.navigation) {
      inventory.navigation.forEach(nav => {
        const constraints = this.calculateLengthConstraints(nav.element, nav.originalText);
        const visualConstraints = this.checkVisualConstraints(nav.element);

        elements.push({
          id: this.generateElementId(nav.element),
          type: 'navigation',
          context: 'nav-menu',
          original: nav.originalText,
          modifiability: nav.classification.modifiabilityScore,
          constraints: constraints,
          visualConstraints: visualConstraints
        });
      });
    }

    // Primary headings
    inventory.headings
      .filter(h => h.classification.level === 'primary')
      .forEach(h => {
        const constraints = this.calculateLengthConstraints(h.element, h.originalText);
        const visualConstraints = this.checkVisualConstraints(h.element);

        elements.push({
          id: this.generateElementId(h.element),
          type: 'headline',
          context: h.classification.sectionType,
          original: h.originalText,
          modifiability: h.classification.modifiabilityScore,
          constraints: constraints,
          visualConstraints: visualConstraints
        });
      });

    // CTAs
    inventory.buttons
      .filter(b => this.isPrimaryCTA(b.element))
      .forEach(b => {
        const constraints = this.calculateLengthConstraints(b.element, b.originalText);
        const visualConstraints = this.checkVisualConstraints(b.element);

        elements.push({
          id: this.generateElementId(b.element),
          type: 'cta',
          context: b.classification.sectionType,
          original: b.originalText,
          modifiability: b.classification.modifiabilityScore,
          constraints: constraints,
          visualConstraints: visualConstraints
        });
      });

    // Secondary headings (limit to top 5)
    inventory.headings
      .filter(h => h.classification.level === 'secondary')
      .slice(0, 5)
      .forEach(h => {
        const constraints = this.calculateLengthConstraints(h.element, h.originalText);
        const visualConstraints = this.checkVisualConstraints(h.element);

        elements.push({
          id: this.generateElementId(h.element),
          type: 'subheading',
          context: h.classification.sectionType,
          original: h.originalText,
          modifiability: h.classification.modifiabilityScore,
          constraints: constraints,
          visualConstraints: visualConstraints
        });
      });

    // Key paragraphs (limit to top 3)
    inventory.paragraphs
      .filter(p => p.classification.context === 'intro')
      .slice(0, 3)
      .forEach(p => {
        const constraints = this.calculateLengthConstraints(p.element, p.originalText);
        const visualConstraints = this.checkVisualConstraints(p.element);

        elements.push({
          id: this.generateElementId(p.element),
          type: 'paragraph',
          context: p.classification.sectionType,
          original: p.originalText,
          modifiability: p.classification.modifiabilityScore,
          constraints: constraints,
          visualConstraints: visualConstraints
        });
      });

    return elements;
  },

  // Call personalization API
  async callPersonalizationAPI(businessProfile, preferences, elements) {
    // TODO: Replace with your actual API endpoint
    const API_ENDPOINT = 'http://localhost:3000/api/personalize';

    try {
      console.log('For You: Calling API with', elements.length, 'elements');

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          businessProfile,
          preferences,
          elements
        }),
        // 60 second timeout (AI processing can take time, especially for many elements)
        signal: AbortSignal.timeout(60000)
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error('API returned error');
      }

      console.log(`For You: API personalization complete (${data.processingTime}ms, cached: ${data.cached})`);

      return data.modifications;

    } catch (error) {
      console.error('For You: API call failed', error);
      // Fall back to simple modifications
      return this.fallbackPersonalization(elements, preferences);
    }
  },

  // Fallback when API unavailable
  fallbackPersonalization(elements, preferences) {
    console.log('For You: Using fallback personalization');

    // Simple rule-based personalization based on preferences
    return elements.map(el => {
      let modified = el.original;
      let confidence = 0.75; // Good enough for fallback

      // Skip if text is too short or has special characters
      if (el.original.length < 10 || /[©®™\d]/.test(el.original)) {
        return {
          id: el.id,
          original: el.original,
          modified: el.original,
          length: el.original.length,
          withinLimits: true,
          confidence: 0.5,
          reasoning: 'Fallback - kept original (special content)'
        };
      }

      // Simple text enhancements based on preferences
      // These are subtle and stay within length limits
      if (preferences.decisionStyle === 'quick-intuitive') {
        // Make it more action-oriented
        modified = modified.replace(/Discover /i, 'Get ');
        modified = modified.replace(/Explore /i, 'Start ');
      } else if (preferences.decisionStyle === 'guided-experts') {
        // Add trust signals
        modified = modified.replace(/services/i, 'expert services');
        modified = modified.replace(/work/i, 'proven work');
      }

      // Keep length in check
      if (modified.length > el.constraints.maxLength) {
        modified = el.original; // Revert if too long
      }

      return {
        id: el.id,
        original: el.original,
        modified: modified,
        length: modified.length,
        withinLimits: true,
        confidence: confidence,
        reasoning: 'Fallback - simple rule-based personalization'
      };
    });
  },

  // Apply API modifications with validation
  async applyAPIModifications(modifications) {
    for (const mod of modifications) {
      // Find element by ID
      const element = document.querySelector(`[data-for-you-id="${mod.id}"]`);
      if (!element) {
        console.warn(`For You: Element not found: ${mod.id}`);
        continue;
      }

      // Only apply if confidence is high enough
      if (mod.confidence < 0.7) {
        console.log(`For You: Skipping low-confidence modification for ${mod.id} (${mod.confidence})`);
        continue;
      }

      // Get original constraints
      const originalText = element.textContent;
      const constraints = this.calculateLengthConstraints(element, originalText);
      const elementType = this.getElementType(element);

      // Verify modification fits
      if (mod.modified.length > constraints.maxLength) {
        console.warn(`For You: Modification too long (${mod.modified.length} > ${constraints.maxLength}) for ${elementType}, skipping "${mod.modified}"`);
        continue;
      }

      if (mod.modified.length < constraints.minLength) {
        // Accept even if below min, as long as it's not extremely short (>5 chars)
        if (mod.modified.length >= 5) {
          console.log(`For You: Modification shorter than min but acceptable (${mod.modified.length} vs ${constraints.minLength})`);
        } else {
          console.warn(`For You: Modification too short (${mod.modified.length} < 5 chars), skipping`);
          continue;
        }
      }

      // Log constraint details for CTAs (buttons) to help debug clipping
      if (elementType === 'cta') {
        console.log(`For You: CTA constraint check - Original: "${originalText}" (${originalText.length} chars), Modified: "${mod.modified}" (${mod.modified.length} chars), Max: ${constraints.maxLength}`);
      }

      // Store original
      element.dataset.forYouOriginalText = originalText;
      element.dataset.forYouModified = 'true';

      // Apply with animation
      await this.animateTextChange(element, mod.modified);

      // Verify visual layout after change
      await this.wait(100); // Let layout settle

      if (this.hasLayoutIssue(element)) {
        console.warn('For You: Layout issue detected, reverting...');
        // Revert if layout breaks - preserve structure
        const hasComplexStructure = element.children.length > 0 ||
                                      element.innerHTML.includes('<br>') ||
                                      element.innerHTML.includes('<span>');

        if (hasComplexStructure) {
          this.replaceTextPreservingStructure(element, originalText);
        } else {
          element.textContent = originalText;
        }

        delete element.dataset.forYouModified;
        delete element.dataset.forYouOriginalText;
      } else {
        console.log(`For You: Successfully applied modification to ${mod.id}`);
      }
    }
  },

  // Execute full transformation (AI-powered)
  async executeTransformation(preferences) {
    console.log('For You: Starting AI-powered transformation', preferences);

    try {
      // 0. Build business profile (enhanced if content inventory available)
      let businessProfile = this.buildBusinessProfile();

      // Check if we have cached content inventory for enhanced profiling
      const siteKey = ForYouStorage.getSiteKey();
      const contentInventory = await ForYouStorage.getContentInventory(siteKey);

      if (contentInventory) {
        console.log('For You: Using enhanced business profile with multi-page inventory');
        businessProfile = await this.buildEnhancedBusinessProfile(contentInventory);
      }

      console.log('For You: Business profile', businessProfile);

      // 1. Audit page content
      const inventory = await this.auditPageContent();

      // 2. Prepare elements for API with length constraints
      const elements = this.prepareElementsForAPI(inventory);
      console.log('For You: Prepared', elements.length, 'elements for API');

      // Add transforming state
      document.body.classList.add('for-you-transforming');
      await this.wait(200);
      document.body.classList.remove('for-you-transforming');

      // 3. Call API for personalization
      const modifications = await this.callPersonalizationAPI(
        businessProfile,
        preferences,
        elements
      );

      // 4. Apply modifications with animation and validation
      await this.applyAPIModifications(modifications);

      // 5. Reorder and collapse sections (starts at 700ms)
      setTimeout(async () => {
        await this.reorderPageSections(preferences);

        // 6. Filter repeated content within sections (after reordering completes)
        await this.wait(500); // Wait for reordering animations to settle

        const sections = this.findAllElements(this.SELECTORS.sections);
        console.log(`For You: Checking ${sections.length} sections for repeated content`);

        for (const section of sections) {
          // Skip hidden sections
          if (section.classList.contains('for-you-hidden')) {
            continue;
          }

          const sectionType = this.detectSectionType(section);
          await this.filterRepeatedContent(section, sectionType, preferences);
        }

        console.log('For You: Content filtering complete');

        // 7. Replace default footer with custom branded footer
        await this.replaceFooterWithCustom(businessProfile, preferences);
      }, 700);

      console.log('For You: AI transformation complete');

    } catch (error) {
      console.error('For You: Transformation failed', error);

      // Fallback to simple approach on error
      console.log('For You: Using fallback transformation');
      const mapping = await this.loadPersonalizationMapping(preferences);
      await this.injectPersonalizedIntro(preferences, mapping);
      setTimeout(() => this.reorderPageSections(preferences), 700);
    }
  },

  // Build business profile from page content
  buildBusinessProfile() {
    // Return cached profile if available to avoid expensive recomputation
    if (this.cachedBusinessProfile) {
      console.log('[For You] Using cached business profile');
      return this.cachedBusinessProfile;
    }

    console.log('[For You] Building business profile...');
    const profile = {
      vertical: this.siteType || this.detectSiteType(),
      priceTier: this.detectPriceTier(),
      formality: this.detectFormality(),
      brandAdjectives: this.extractBrandAdjectives(),
      brandVoice: this.detectBrandVoice(),
      valueProps: {
        emphasis: this.detectValuePropsEmphasis()
      },
      sampleText: this.getSampleText()
    };

    // Cache for future calls
    this.cachedBusinessProfile = profile;
    console.log('[For You] Business profile cached');

    return profile;
  },

  // Get sample text from page for brand voice analysis
  getSampleText() {
    const texts = [];

    // Hero text (most important)
    const hero = this.findElement(this.SELECTORS.hero);
    if (hero) {
      texts.push(hero.textContent.trim());
    }

    // First 3 headings
    const headings = this.findAllElements(this.SELECTORS.headings);
    headings.slice(0, 3).forEach(h => {
      const text = h.textContent.trim();
      if (text.length > 3 && !/empty\s+heading/i.test(text)) {
        texts.push(text);
      }
    });

    // First 2 paragraphs
    const paragraphs = this.findAllElements(this.SELECTORS.body);
    paragraphs.slice(0, 2).forEach(p => {
      const text = p.textContent.trim();
      if (text.length > 20) { // Skip very short paragraphs
        texts.push(text);
      }
    });

    // Join and limit to 500 chars for better LLM context
    const combined = texts.join(' ').substring(0, 500);
    return combined || '';
  },

  // Build enhanced business profile from multi-page content inventory
  async buildEnhancedBusinessProfile(contentInventory) {
    // Start with standard single-page profile
    const baseProfile = this.buildBusinessProfile();

    // If no inventory provided, return base profile
    if (!contentInventory || !contentInventory.pages || contentInventory.pages.length === 0) {
      return baseProfile;
    }

    // Yield to prevent blocking
    await this.yieldToEventLoop();

    // Enhance with multi-page insights
    const enhanced = {
      ...baseProfile,

      // Site structure information
      siteStructure: {
        totalPages: contentInventory.pageCount,
        pageTypes: this.classifyPageTypes(contentInventory),
        totalWordCount: contentInventory.totalWordCount,
        crawledAt: new Date(contentInventory.crawledAt).toISOString()
      }
    };

    // Yield before each expensive operation
    await this.yieldToEventLoop();
    enhanced.teamInfo = await this.extractTeamInfo(contentInventory);

    await this.yieldToEventLoop();
    enhanced.catalog = await this.extractCatalog(contentInventory);

    await this.yieldToEventLoop();
    enhanced.aboutNarrative = await this.extractAboutContent(contentInventory);

    await this.yieldToEventLoop();
    enhanced.contentThemes = await this.analyzeContentThemes(contentInventory);

    await this.yieldToEventLoop();
    enhanced.valuePropsDetailed = await this.analyzeDetailedValueProps(contentInventory);

    await this.yieldToEventLoop();
    enhanced.sampleTextMultiPage = this.getMultiPageSampleText(contentInventory);

    console.log('[ForYouPersonalization] Enhanced business profile built:', enhanced);
    return enhanced;
  },

  // Classify what types of pages exist in the inventory
  classifyPageTypes(inventory) {
    const types = {};
    if (inventory.byType) {
      Object.keys(inventory.byType).forEach(type => {
        types[type] = inventory.byType[type].length;
      });
    }
    return types;
  },

  // Extract team information from team and about pages
  async extractTeamInfo(inventory) {
    const teamPages = [
      ...(inventory.byType.team || []),
      ...(inventory.byType.about || [])
    ];

    if (teamPages.length === 0) return null;

    const teamInfo = {
      hasTeamPage: inventory.byType.team && inventory.byType.team.length > 0,
      teamHeadings: [],
      teamDescriptions: []
    };

    for (const page of teamPages) {
      // Collect team-related headings
      for (const h of page.headings) {
        if (h.level === 'h2' || h.level === 'h3') {
          teamInfo.teamHeadings.push(h.text);
        }
      }

      // Collect first few paragraphs as descriptions
      teamInfo.teamDescriptions.push(...page.paragraphs.slice(0, 3));

      // Yield after each page to prevent blocking
      await this.yieldToEventLoop();
    }

    // Limit to reasonable size
    teamInfo.teamHeadings = teamInfo.teamHeadings.slice(0, 5);
    teamInfo.teamDescriptions = teamInfo.teamDescriptions.slice(0, 5);

    return teamInfo;
  },

  // Extract services or products catalog
  async extractCatalog(inventory) {
    const catalogPages = [
      ...(inventory.byType.services || []),
      ...(inventory.byType.products || []),
      ...(inventory.byType.portfolio || [])
    ];

    if (catalogPages.length === 0) return null;

    const catalog = {
      type: inventory.byType.products ? 'products' : 'services',
      items: [],
      descriptions: []
    };

    for (const page of catalogPages) {
      // Extract service/product names from H2/H3 headings
      for (const h of page.headings) {
        if (h.level === 'h2' || h.level === 'h3') {
          catalog.items.push(h.text);
        }
      }

      // Extract descriptions
      catalog.descriptions.push(...page.paragraphs.slice(0, 3));

      // Yield after each page to prevent blocking
      await this.yieldToEventLoop();
    }

    // Limit to reasonable size
    catalog.items = [...new Set(catalog.items)].slice(0, 10); // Dedupe and limit
    catalog.descriptions = catalog.descriptions.slice(0, 8);

    return catalog;
  },

  // Extract about page narrative content
  async extractAboutContent(inventory) {
    const aboutPages = inventory.byType.about || [];

    if (aboutPages.length === 0) return null;

    const aboutContent = {
      mainHeading: '',
      paragraphs: [],
      keyPhrases: []
    };

    for (const page of aboutPages) {
      // Get main heading (usually H1)
      const h1 = page.headings.find(h => h.level === 'h1');
      if (h1 && !aboutContent.mainHeading) {
        aboutContent.mainHeading = h1.text;
      }

      // Get first several paragraphs
      aboutContent.paragraphs.push(...page.paragraphs.slice(0, 4));

      // Yield after each page
      await this.yieldToEventLoop();
    }

    // Limit paragraphs
    aboutContent.paragraphs = aboutContent.paragraphs.slice(0, 6);

    // Extract key phrases (words that appear frequently)
    aboutContent.keyPhrases = await this.extractKeyPhrases(aboutContent.paragraphs.join(' '));

    return aboutContent;
  },

  // Analyze recurring themes across all content
  async analyzeContentThemes(inventory) {
    const allText = inventory.allParagraphs.join(' ').toLowerCase();

    // Yield before heavy processing
    await this.yieldToEventLoop();

    const themes = {
      expertise: this.countThemeWords(allText, ['expert', 'experienced', 'professional', 'skilled', 'certified', 'qualified']),
      quality: this.countThemeWords(allText, ['quality', 'premium', 'excellence', 'best', 'superior', 'exceptional']),
      personal: this.countThemeWords(allText, ['you', 'your', 'we', 'our', 'together', 'personalized', 'custom']),
      innovation: this.countThemeWords(allText, ['innovative', 'modern', 'cutting-edge', 'advanced', 'technology', 'new']),
      trust: this.countThemeWords(allText, ['trust', 'reliable', 'proven', 'established', 'guarantee', 'secure'])
    };

    // Yield after processing
    await this.yieldToEventLoop();

    // Calculate dominant themes (top 3)
    const sorted = Object.entries(themes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([theme]) => theme);

    return {
      counts: themes,
      dominant: sorted
    };
  },

  // Count occurrences of theme-related words
  countThemeWords(text, keywords) {
    let count = 0;
    keywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      const matches = text.match(regex);
      if (matches) count += matches.length;
    });
    return count;
  },

  // Analyze detailed value propositions from multi-page content
  async analyzeDetailedValueProps(inventory) {
    const allText = inventory.allParagraphs.join(' ');
    const lowerText = allText.toLowerCase();

    // Yield before heavy processing
    await this.yieldToEventLoop();

    // Run the same analysis as single-page, but with more content
    const emphasis = {
      quality: 0,
      expertise: 0,
      personal: 0,
      speed: 0,
      price: 0
    };

    // Quality indicators
    const qualityWords = ['quality', 'premium', 'excellence', 'best', 'superior', 'exceptional', 'outstanding', 'finest'];
    for (const word of qualityWords) {
      emphasis.quality += (lowerText.match(new RegExp(word, 'g')) || []).length;
    }

    await this.yieldToEventLoop();

    // Expertise indicators
    const expertiseWords = ['expert', 'professional', 'experienced', 'certified', 'specialist', 'master', 'skilled'];
    for (const word of expertiseWords) {
      emphasis.expertise += (lowerText.match(new RegExp(word, 'g')) || []).length;
    }

    await this.yieldToEventLoop();

    // Personal touch indicators
    const personalWords = ['you', 'your', 'personalized', 'custom', 'tailored', 'individual', 'unique'];
    for (const word of personalWords) {
      emphasis.personal += (lowerText.match(new RegExp(word, 'g')) || []).length;
    }

    await this.yieldToEventLoop();

    // Speed/efficiency indicators
    const speedWords = ['fast', 'quick', 'rapid', 'efficient', 'immediate', 'instant'];
    for (const word of speedWords) {
      emphasis.speed += (lowerText.match(new RegExp(word, 'g')) || []).length;
    }

    await this.yieldToEventLoop();

    // Price/value indicators
    const priceWords = ['affordable', 'value', 'price', 'cost', 'budget', 'competitive'];
    for (const word of priceWords) {
      emphasis.price += (lowerText.match(new RegExp(word, 'g')) || []).length;
    }

    await this.yieldToEventLoop();

    // Normalize scores (0-100 scale)
    const max = Math.max(...Object.values(emphasis));
    if (max > 0) {
      Object.keys(emphasis).forEach(key => {
        emphasis[key] = Math.round((emphasis[key] / max) * 100);
      });
    }

    return emphasis;
  },

  // Extract key phrases from text
  async extractKeyPhrases(text) {
    const words = text.toLowerCase().split(/\s+/);
    const frequency = {};

    // Count word frequency (exclude common words)
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'can', 'this', 'that', 'these', 'those']);

    // Process in batches to prevent blocking
    let processedCount = 0;
    for (const word of words) {
      const cleaned = word.replace(/[^a-z]/g, '');
      if (cleaned.length > 3 && !commonWords.has(cleaned)) {
        frequency[cleaned] = (frequency[cleaned] || 0) + 1;
      }

      // Yield every 100 words to prevent blocking
      processedCount++;
      if (processedCount % 100 === 0) {
        await this.yieldToEventLoop();
      }
    }

    // Yield before final sorting
    await this.yieldToEventLoop();

    // Get top 5 most frequent words
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  },

  // Get sample text from multiple pages
  getMultiPageSampleText(inventory) {
    const texts = [];

    // Homepage hero/intro (highest priority)
    const homepage = inventory.pages.find(p => p.type === 'homepage');
    if (homepage && homepage.paragraphs.length > 0) {
      texts.push(homepage.paragraphs[0]);
    }

    // About page opening
    const aboutPage = (inventory.byType.about || [])[0];
    if (aboutPage && aboutPage.paragraphs.length > 0) {
      texts.push(aboutPage.paragraphs[0]);
    }

    // Services/products description
    const catalogPage = (inventory.byType.services || inventory.byType.products || [])[0];
    if (catalogPage && catalogPage.paragraphs.length > 0) {
      texts.push(catalogPage.paragraphs[0]);
    }

    // Limit to 800 chars total
    const combined = texts.join(' ').substring(0, 800);
    return combined || inventory.allParagraphs.slice(0, 3).join(' ').substring(0, 800);
  },

  // Remove all personalization
  async removePersonalization() {
    console.log('For You: Removing all personalization');

    // Restore ALL modified text elements (headlines, paragraphs, CTAs, etc.)
    const modifiedElements = document.querySelectorAll('[data-for-you-modified="true"]');
    console.log(`For You: Restoring ${modifiedElements.length} modified elements`);

    modifiedElements.forEach((element, index) => {
      const originalText = element.dataset.forYouOriginalText;
      if (originalText) {
        // Stagger restoration for smooth visual effect
        setTimeout(() => {
          // Animate restoration
          element.style.transition = 'opacity 0.2s ease';
          element.style.opacity = '0.5';

          setTimeout(() => {
            element.textContent = originalText;
            element.style.opacity = '';
            element.style.transition = '';
            delete element.dataset.forYouOriginalText;
            delete element.dataset.forYouModified;
            delete element.dataset.forYouId;
          }, 200);
        }, index * 30); // Stagger by 30ms
      }
    });

    // Remove all injected elements (including custom footer)
    const injectedElements = document.querySelectorAll('[data-for-you-element="true"]');
    injectedElements.forEach(element => element.remove());

    // Restore original footer
    const hiddenFooters = document.querySelectorAll('footer.for-you-hidden, .footer.for-you-hidden, #footer.for-you-hidden, [role="contentinfo"].for-you-hidden, .site-footer.for-you-hidden');
    hiddenFooters.forEach(footer => {
      footer.classList.remove('for-you-hidden');
      footer.style.display = '';
    });

    // Restore filtered/hidden items
    const hiddenItems = document.querySelectorAll('[data-for-you-hidden-item="true"]');
    console.log(`For You: Restoring ${hiddenItems.length} hidden items`);

    hiddenItems.forEach((item, index) => {
      setTimeout(() => {
        const originalMargin = item.dataset.forYouOriginalMargin ?
          JSON.parse(item.dataset.forYouOriginalMargin) : {};

        // Restore display first
        item.style.display = item.dataset.forYouOriginalDisplay || '';

        // Animate restoration
        setTimeout(() => {
          item.style.maxHeight = item.dataset.forYouOriginalHeight || 'none';
          item.style.opacity = '1';
          item.style.marginTop = originalMargin.top || '';
          item.style.marginBottom = originalMargin.bottom || '';
          item.style.marginLeft = originalMargin.left || '';
          item.style.marginRight = originalMargin.right || '';
          item.style.transform = '';

          // Cleanup after animation
          setTimeout(() => {
            item.style.transition = '';
            item.style.overflow = '';
            item.style.maxHeight = '';
            delete item.dataset.forYouOriginalDisplay;
            delete item.dataset.forYouOriginalHeight;
            delete item.dataset.forYouOriginalMargin;
            delete item.dataset.forYouHiddenItem;
          }, 400);
        }, 50);
      }, index * 30); // Stagger restoration
    });

    // Restore sections
    await this.wait(modifiedElements.length * 30 + 200); // Wait for text restoration
    this.restoreAllSections();

    console.log('For You: Personalization removed');
  },

  // Replace default footer with custom branded footer
  async replaceFooterWithCustom(businessProfile, preferences) {
    console.log('For You: Creating custom branded footer');

    // Hide existing footer
    const footerSelectors = ['footer', '.footer', '#footer', '[role="contentinfo"]', '.site-footer'];
    for (const selector of footerSelectors) {
      const footer = document.querySelector(selector);
      if (footer) {
        footer.classList.add('for-you-hidden');
        footer.style.display = 'none';
        console.log('For You: Hid default footer');
        break;
      }
    }

    // Get brand styles
    const brandStyles = this.brandStyles || this.extractBrandStyles();

    // Determine business main goal from profile
    const businessGoal = this.determineBusinessGoal(businessProfile);

    // Generate personalized content
    const footerContent = this.generateFooterContent(businessProfile, preferences, businessGoal);

    // Create custom footer section with generous whitespace
    const customFooter = document.createElement('section');
    customFooter.className = 'for-you-custom-footer';
    customFooter.dataset.forYouElement = 'true';
    customFooter.style.cssText = `
      padding: 120px 20px 140px 20px;
      text-align: center;
      background: ${brandStyles.colors.background || '#f8f8f8'};
      border-top: 1px solid ${brandStyles.colors.border || '#e0e0e0'};
      min-height: 400px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    `;

    // Create headline with more breathing room
    const headline = document.createElement('h2');
    headline.textContent = footerContent.headline;
    headline.style.cssText = `
      font-family: ${brandStyles.typography.h1?.fontFamily || 'inherit'};
      font-size: ${brandStyles.typography.h2?.fontSize || '2.5rem'};
      font-weight: ${brandStyles.typography.h2?.fontWeight || '600'};
      color: ${brandStyles.colors.text || '#000'};
      margin: 0 0 40px 0;
      line-height: 1.3;
      max-width: 700px;
    `;

    // Create CTA button
    const ctaButton = document.createElement('a');
    ctaButton.textContent = footerContent.cta;
    ctaButton.href = footerContent.ctaUrl;
    ctaButton.style.cssText = `
      display: inline-block;
      padding: ${brandStyles.spacing?.buttonPadding || '16px 32px'};
      background: ${brandStyles.colors.button || '#000'};
      color: ${brandStyles.colors.buttonText || '#fff'};
      font-family: ${brandStyles.typography.button?.fontFamily || 'inherit'};
      font-size: ${brandStyles.typography.button?.fontSize || '1rem'};
      font-weight: ${brandStyles.typography.button?.fontWeight || '500'};
      text-decoration: none;
      border-radius: ${brandStyles.borderRadius?.button || '4px'};
      transition: transform 0.2s, opacity 0.2s;
      cursor: pointer;
    `;

    // Add hover effect
    ctaButton.addEventListener('mouseenter', () => {
      ctaButton.style.transform = 'translateY(-2px)';
      ctaButton.style.opacity = '0.9';
    });
    ctaButton.addEventListener('mouseleave', () => {
      ctaButton.style.transform = 'translateY(0)';
      ctaButton.style.opacity = '1';
    });

    // Assemble footer
    customFooter.appendChild(headline);
    customFooter.appendChild(ctaButton);

    // Insert at end of body
    document.body.appendChild(customFooter);

    console.log('For You: Custom footer created', footerContent);
  },

  // Determine business's main goal and find actual destination URL
  determineBusinessGoal(businessProfile) {
    const vertical = businessProfile.vertical.toLowerCase();
    const hasTeam = businessProfile.teamInfo?.hasTeamPage;
    const hasCatalog = businessProfile.catalog?.items.length > 0;

    // Find relevant URLs from navigation or buttons
    const navLinks = Array.from(document.querySelectorAll('nav a, header a, .header a'));
    const allLinks = Array.from(document.querySelectorAll('a'));

    // Sports/Training sites want program registrations (CHECK FIRST - most specific)
    if (vertical.includes('sports') || vertical.includes('training') || vertical.includes('athletic') || vertical.includes('fitness')) {
      const programUrl = this.findBestUrl(allLinks, ['camps', 'clinics', 'training', 'programs', 'schedule', 'register', 'enroll', 'sign-up', 'classes']);
      return { type: 'sports_registration', url: programUrl };
    }

    // Education sites want course/class enrollments
    if (vertical.includes('education') || vertical.includes('learning') || vertical.includes('school')) {
      const courseUrl = this.findBestUrl(allLinks, ['courses', 'classes', 'lessons', 'enroll', 'register', 'programs', 'curriculum']);
      return { type: 'education_enrollment', url: courseUrl };
    }

    // Events sites want registrations/tickets
    if (vertical.includes('events') || vertical.includes('conference') || vertical.includes('festival')) {
      const eventUrl = this.findBestUrl(allLinks, ['events', 'schedule', 'register', 'tickets', 'attend', 'join']);
      return { type: 'event_registration', url: eventUrl };
    }

    // Service businesses typically want consultations/bookings
    if (vertical.includes('service') || vertical.includes('professional') || hasTeam) {
      const bookingUrl = this.findBestUrl(allLinks, ['book', 'appointment', 'schedule', 'consult', 'contact']);
      return { type: 'booking', url: bookingUrl };
    }

    // E-commerce wants purchases
    if (vertical.includes('ecommerce') || vertical.includes('shop') || businessProfile.catalog?.type === 'products') {
      const shopUrl = this.findBestUrl(navLinks, ['shop', 'store', 'products', 'browse', 'collection']);
      return { type: 'purchase', url: shopUrl };
    }

    // Portfolios/agencies want project inquiries
    if (vertical.includes('portfolio') || vertical.includes('agency') || vertical.includes('creative')) {
      const inquiryUrl = this.findBestUrl(allLinks, ['contact', 'quote', 'inquiry', 'project', 'start']);
      return { type: 'inquiry', url: inquiryUrl };
    }

    // Restaurants want reservations
    if (vertical.includes('restaurant') || vertical.includes('food')) {
      const reservationUrl = this.findBestUrl(allLinks, ['reservation', 'reserve', 'book', 'table', 'order']);
      return { type: 'reservation', url: reservationUrl };
    }

    // Default: contact
    const contactUrl = this.findBestUrl(navLinks, ['contact', 'get-in-touch', 'reach-out']);
    return { type: 'contact', url: contactUrl };
  },

  // Find best matching URL from links with relevance scoring
  findBestUrl(links, keywords) {
    const scoredMatches = [];

    links.forEach(link => {
      const href = (link.getAttribute('href') || '').toLowerCase();
      const text = link.textContent.toLowerCase();
      let score = 0;

      // Skip invalid links
      if (!href || href === '#' || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }

      // Score based on keyword matches
      keywords.forEach((keyword, index) => {
        const keywordScore = keywords.length - index; // Earlier keywords are more important

        // Exact match in URL path (highest priority)
        if (href.includes(`/${keyword}`) || href.includes(`${keyword}/`) || href.endsWith(`/${keyword}`)) {
          score += keywordScore * 10;
        }
        // Keyword in URL (medium priority)
        else if (href.includes(keyword)) {
          score += keywordScore * 5;
        }
        // Exact match in link text (good priority)
        if (text === keyword || text === `${keyword}s`) {
          score += keywordScore * 7;
        }
        // Keyword in link text (lower priority)
        else if (text.includes(keyword)) {
          score += keywordScore * 3;
        }
      });

      // Bonus for links in main navigation (more prominent)
      if (link.closest('nav, header, .header, .navigation')) {
        score += 2;
      }

      // Bonus for clean URL structures
      if (href.match(/^\/[a-z-]+$/)) {
        score += 1;
      }

      // Penalty for query strings or complex URLs
      if (href.includes('?') || href.includes('&')) {
        score -= 2;
      }

      if (score > 0) {
        scoredMatches.push({ link, href, score });
      }
    });

    // Sort by score (descending) and return best match
    if (scoredMatches.length > 0) {
      scoredMatches.sort((a, b) => b.score - a.score);
      console.log(`For You: URL finding - Best match: ${scoredMatches[0].href} (score: ${scoredMatches[0].score})`);
      return scoredMatches[0].href;
    }

    // Fallback: try to find contact page or return anchor
    const contactLink = links.find(l => {
      const href = (l.getAttribute('href') || '').toLowerCase();
      return href.includes('contact') || href.includes('get-in-touch');
    });

    if (contactLink) {
      return contactLink.getAttribute('href');
    }

    // Last resort: create anchor to first keyword
    console.log(`For You: URL finding - No match found, using fallback: #${keywords[0]}`);
    return `#${keywords[0]}`;
  },

  // Generate footer content based on preferences with soft-sell CTAs
  generateFooterContent(businessProfile, preferences, goal) {
    const isWarm = preferences.visualStyle === 'warm-welcoming';
    const isBold = preferences.visualStyle === 'bold-dramatic';
    const isQuality = preferences.priority === 'quality-craft';
    const isPersonal = preferences.priority === 'personal-connection';

    let headline, cta;
    const ctaUrl = goal.url;

    switch (goal.type) {
      case 'sports_registration':
        // Soft-sell: View programs/training options before registering
        headline = isWarm ? 'Find the perfect program for your goals' :
                   isBold ? 'Take your game to the next level' :
                   isQuality ? 'Excellence in training and development' :
                   isPersonal ? 'Discover programs designed for you' :
                   'See what we offer';
        cta = isWarm ? 'See Training Options' :
              isBold ? 'Explore Programs' :
              isQuality ? 'View Our Training' :
              'Browse Programs';
        break;

      case 'education_enrollment':
        // Soft-sell: Browse courses/classes before enrolling
        headline = isWarm ? 'Your learning journey starts here' :
                   isBold ? 'Master new skills with expert guidance' :
                   isQuality ? 'Education that makes a difference' :
                   isPersonal ? 'Find the right path for you' :
                   'Discover our courses';
        cta = isWarm ? 'Browse Classes' :
              isBold ? 'View Programs' :
              isQuality ? 'See Course Options' :
              'Explore Learning';
        break;

      case 'event_registration':
        // Soft-sell: View events before registering
        headline = isWarm ? 'Join us for something memorable' :
                   isBold ? 'Experience events that inspire' :
                   isQuality ? 'Thoughtfully curated experiences' :
                   isPersonal ? 'Find your next great experience' :
                   'See what\'s coming up';
        cta = isWarm ? 'View Events' :
              isBold ? 'See Schedule' :
              isQuality ? 'Browse Events' :
              'Explore Upcoming';
        break;

      case 'booking':
        // Soft-sell: Explore possibilities before committing
        headline = isWarm ? 'Curious what we could create together?' :
                   isBold ? 'Imagine your vision brought to life' :
                   isPersonal ? 'Let\'s explore your ideas' :
                   'See what\'s possible for you';
        cta = isWarm ? 'Explore Appointments' :
              isBold ? 'View Our Work' :
              isQuality ? 'See Our Process' :
              'Learn More';
        break;

      case 'purchase':
        // Soft-sell: Browse before buying
        headline = isWarm ? 'Something special is waiting for you' :
                   isBold ? 'Discover pieces that inspire' :
                   isQuality ? 'Explore exceptional craftsmanship' :
                   'Find what speaks to you';
        cta = isWarm ? 'Browse Collection' :
              isBold ? 'View Products' :
              isQuality ? 'Explore Quality' :
              'See What\'s New';
        break;

      case 'inquiry':
        // Soft-sell: Look at work before committing to project
        headline = isWarm ? 'Imagine what we could build together' :
                   isBold ? 'Your next project deserves excellence' :
                   isPersonal ? 'Every project tells a story' :
                   'See what we create for clients like you';
        cta = isWarm ? 'View Our Work' :
              isBold ? 'Explore Projects' :
              isQuality ? 'See Our Craft' :
              'Browse Portfolio';
        break;

      case 'reservation':
        // Soft-sell: See menu/experience before booking
        headline = isWarm ? 'Come experience something special' :
                   isBold ? 'An extraordinary meal awaits' :
                   isQuality ? 'Discover culinary excellence' :
                   'See what makes us different';
        cta = isWarm ? 'View Menu' :
              isBold ? 'Explore Experience' :
              isQuality ? 'See Our Offerings' :
              'Browse Menu';
        break;

      default: // contact
        // Soft-sell: Learn more before reaching out
        headline = isWarm ? 'Questions? We\'re here to help' :
                   isBold ? 'Take the first step today' :
                   isPersonal ? 'Let\'s start a conversation' :
                   'Wondering if we\'re the right fit?';
        cta = isWarm ? 'Learn More' :
              isBold ? 'See How We Help' :
              isQuality ? 'Explore Our Approach' :
              'Get in Touch';
    }

    return { headline, cta, ctaUrl };
  },

  // Utility: wait
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

// Make available globally
window.ForYouPersonalization = ForYouPersonalization;
