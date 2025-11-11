// Core personalization logic for For You extension

const ForYouPersonalization = {
  personalizationMap: {
    "collaborative+refined+personal-meaning": {
      "hero": {
        "headline": "Let's Design Your Personal Story Together",
        "subheadline": "Collaborative artistry rooted in personal meaning",
        "bodyCopy": "Working together to translate your vision into refined tattoos that honor your personal journey and celebrate what matters most to you."
      },
      "cta": "Start Your Design Session",
      "recommendedArtists": ["Wendy", "River", "Mishka", "Ceren", "Asami"],
      "recommendationCard": {
        "title": "Based on your collaborative approach and love for meaningful, refined work",
        "description": "We recommend Wendy—her collaborative process brings personal visions to life through delicate, meaningful artistry.",
        "primaryCta": "See Wendy's Portfolio",
        "secondaryCta": "Book Session"
      },
      "colorPalette": {
        "primary": "#2d4a3e",
        "accent": "#7a9d8f",
        "background": "#f4f1e8"
      }
    },
    "trust-expert+bold+quality": {
      "hero": {
        "headline": "Master Craftsmen of Bold Tattoo Art",
        "subheadline": "Award-winning artists delivering exceptional quality",
        "bodyCopy": "Led by internationally acclaimed artist Eva Karabudak, our master tattooers bring decades of experience to bold, high-quality work executed with museum-quality precision."
      },
      "cta": "Consult with Our Masters",
      "recommendedArtists": ["Eva", "Berkay", "Shani", "Meyk", "Dexter"],
      "recommendationCard": {
        "title": "Based on your appreciation for bold work and expert craftsmanship",
        "description": "We recommend Eva—founder and internationally acclaimed fine art tattooer with award-winning bold artistic vision.",
        "primaryCta": "View Eva's Portfolio",
        "secondaryCta": "Book with Eva"
      },
      "colorPalette": {
        "primary": "#1c1c1c",
        "accent": "#c41e3a",
        "tertiary": "#f5d042"
      }
    },
    "spontaneous+bold+statement": {
      "hero": {
        "headline": "Bold Tattoos That Make a Statement",
        "subheadline": "Eye-catching work for those who dare",
        "bodyCopy": "For those who decide with confidence—striking tattoos that command attention and tell your story loudly."
      },
      "cta": "Book Your Bold Statement",
      "recommendedArtists": ["Eva", "Dexter", "Meyk", "Berkay", "Shani"],
      "recommendationCard": {
        "title": "Based on your love for bold, statement-making work",
        "description": "We recommend Eva—her bold style creates unforgettable pieces that make powerful statements.",
        "primaryCta": "See Bold Portfolio",
        "secondaryCta": "Book Now"
      },
      "colorPalette": {
        "primary": "#1c1c1c",
        "accent": "#c41e3a",
        "tertiary": "#f5d042"
      }
    },
    "planned+refined+quality": {
      "hero": {
        "headline": "Exquisite Artistry Worth the Wait",
        "subheadline": "Museum-quality tattoos crafted with precision",
        "bodyCopy": "For those who appreciate meticulous research and planning—refined work that showcases exceptional craftsmanship through expert execution."
      },
      "cta": "Schedule Your Consultation",
      "recommendedArtists": ["Wendy", "Ceren", "Eva", "Mishka", "Daniel"],
      "recommendationCard": {
        "title": "Based on your appreciation for refined work and quality craftsmanship",
        "description": "We recommend Wendy—her precise work combines extensive research with exceptional execution.",
        "primaryCta": "View Portfolio",
        "secondaryCta": "Book Consultation"
      },
      "colorPalette": {
        "primary": "#2d4a3e",
        "accent": "#7a9d8f",
        "background": "#f4f1e8"
      }
    },
    "collaborative+warm+personal-meaning": {
      "hero": {
        "headline": "Create Something Meaningful Together",
        "subheadline": "Warm, collaborative artistry that reflects your story",
        "bodyCopy": "We specialize in working closely with you in a welcoming environment to create tattoos that carry deep personal meaning."
      },
      "cta": "Start Your Journey",
      "recommendedArtists": ["Wendy", "Lena", "River", "Ceren", "Dani"],
      "recommendationCard": {
        "title": "Based on your collaborative style and desire for meaningful, welcoming work",
        "description": "We recommend Wendy—her warm, collaborative approach makes the creative process comfortable and personal.",
        "primaryCta": "Meet Wendy",
        "secondaryCta": "Book Session"
      },
      "colorPalette": {
        "primary": "#8b6f47",
        "accent": "#d4a574",
        "background": "#fdf8f3"
      }
    },
    "trust-expert+unique+new": {
      "hero": {
        "headline": "Discover Experimental Artistry",
        "subheadline": "Expert artists pushing creative boundaries",
        "bodyCopy": "Let our visionary artists guide you into unexplored creative territory with avant-garde work that breaks conventions."
      },
      "cta": "Explore Experimental Work",
      "recommendedArtists": ["River", "Dexter", "Meyk", "Rémy", "Shani"],
      "recommendationCard": {
        "title": "Based on your trust in expert guidance and love for unique experimental work",
        "description": "We recommend River—their abstract, experimental style pushes boundaries while maintaining exceptional artistry.",
        "primaryCta": "See Experimental Work",
        "secondaryCta": "Book Consultation"
      },
      "colorPalette": {
        "primary": "#2a2a2a",
        "accent": "#8b5cf6",
        "background": "#fafafa"
      }
    }
  },

  // DOM Selectors for Atelier Eva site (will need adjustment based on actual site inspection)
  SELECTORS: {
    hero: {
      headline: 'h1, .hero-title, [class*="hero"] h1, .sqs-block-html h1',
      subheadline: 'h2, .hero-subtitle, [class*="hero"] h2, .sqs-block-html h2',
      body: '.hero-description, [class*="hero"] p, .sqs-block-html p',
      section: 'section:first-of-type, [class*="hero"], .index-section:first-child'
    },
    cta: {
      buttons: 'a[href*="book"], .btn, .button, .sqs-block-button-element'
    },
    artists: {
      section: '[class*="team"], [class*="artist"], .index-section',
      grid: '[class*="grid"], [class*="summary"], .sqs-gallery',
      cards: '[class*="summary-item"], [class*="team-member"], [class*="artist-card"], .sqs-gallery-design-grid-slide',
      name: '[class*="title"], h3, h4, .summary-title',
      specialties: '[class*="excerpt"], [class*="description"], .summary-excerpt'
    }
  },

  // Load personalization map (now embedded directly)
  async loadPersonalizationMap() {
    // Data is already embedded above, just return it
    return this.personalizationMap;
  },

  // Main personalization orchestrator
  async applyPersonalization(preferences) {
    console.log('Applying personalization with preferences:', preferences);

    // Personalization map is already loaded (embedded in code)
    if (!this.personalizationMap) {
      console.error('No personalization map available');
      return;
    }

    // Build combination key (3 questions)
    const combinationKey = `${preferences.vibe}+${preferences.drawsIn}+${preferences.important}`;
    console.log('Looking for mapping:', combinationKey);

    let mapping = this.personalizationMap[combinationKey];

    // Fallback to similar mappings if exact match not found
    if (!mapping) {
      console.warn('Exact mapping not found, using fallback');
      // Try to find a partial match or use first available
      mapping = Object.values(this.personalizationMap)[0];
    }

    if (!mapping) {
      console.error('No mapping available');
      return;
    }

    console.log('Using mapping:', mapping);

    // Execute transformation sequence
    await this.executeTransformationSequence(mapping);
  },

  // Choreographed transformation sequence
  async executeTransformationSequence(mapping) {
    // 1. Subtle page flash to signal change (500ms)
    document.body.classList.add('for-you-transforming');
    await this.wait(500);
    document.body.classList.remove('for-you-transforming');

    // 2. Hero text updates (staggered, 600ms total) - starts immediately
    this.personalizeHero(mapping.hero);

    // 3. Recommendation card slides in (400ms, starts at 300ms)
    setTimeout(() => this.injectRecommendationCard(mapping.recommendationCard), 300);

    // 4. Artist grid reorders (500ms, starts at 500ms)
    setTimeout(() => this.filterAndReorderArtists(mapping.recommendedArtists), 500);

    // 5. CTA buttons update (200ms, starts at 800ms)
    setTimeout(() => this.updateCTAs(mapping.cta), 800);

    // 6. Color palette shifts (800ms, starts at 1000ms)
    setTimeout(() => this.applyColorPalette(mapping.colorPalette), 1000);

    // 7. Final badges and highlights (starts at 1500ms)
    setTimeout(() => {
      this.addForYouBadges();
      this.highlightPersonalizedElements();
    }, 1500);
  },

  // Personalize hero section
  async personalizeHero(heroData) {
    const headline = document.querySelector(this.SELECTORS.hero.headline);
    const subheadline = document.querySelector(this.SELECTORS.hero.subheadline);
    const heroSection = document.querySelector(this.SELECTORS.hero.section);

    // Store original styles before changing - preserve ALL important properties
    let headlineStyles = {};
    let subheadlineStyles = {};

    if (headline) {
      const computed = window.getComputedStyle(headline);
      headlineStyles = {
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight,
        lineHeight: computed.lineHeight,
        fontFamily: computed.fontFamily,
        letterSpacing: computed.letterSpacing,
        textAlign: computed.textAlign,
        // DON'T preserve width - let it expand to fit content
        maxWidth: computed.maxWidth,
        margin: computed.margin,
        marginLeft: computed.marginLeft,
        marginRight: computed.marginRight,
        padding: computed.padding,
        color: computed.color,
        // Ensure it stays centered
        position: computed.position,
        left: computed.left,
        right: computed.right,
        transform: computed.transform
      };
      console.log('Captured headline styles:', headlineStyles);
    }

    if (subheadline) {
      const computed = window.getComputedStyle(subheadline);
      subheadlineStyles = {
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight,
        lineHeight: computed.lineHeight,
        fontFamily: computed.fontFamily,
        letterSpacing: computed.letterSpacing,
        textAlign: computed.textAlign,
        // DON'T preserve width - let it expand to fit content
        maxWidth: computed.maxWidth,
        margin: computed.margin,
        marginLeft: computed.marginLeft,
        marginRight: computed.marginRight,
        padding: computed.padding,
        color: computed.color,
        // Ensure it stays centered
        position: computed.position,
        left: computed.left,
        right: computed.right,
        transform: computed.transform
      };
      console.log('Captured subheadline styles:', subheadlineStyles);
    }

    // Fade out
    if (headline) {
      headline.style.transition = 'opacity 300ms ease-out';
      headline.style.opacity = '0';
    }
    if (subheadline) {
      subheadline.style.transition = 'opacity 300ms ease-out';
      subheadline.style.opacity = '0';
    }

    await this.wait(300);

    // Update content and restore styles with !important
    if (headline) {
      headline.textContent = heroData.headline;
      headline.classList.add('for-you-personalized');
      // Explicitly remove width constraint to prevent clipping
      headline.style.removeProperty('width');
      // Restore original styling with !important for maximum specificity
      Object.keys(headlineStyles).forEach(prop => {
        const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
        headline.style.setProperty(cssProp, headlineStyles[prop], 'important');
      });
    }
    if (subheadline) {
      subheadline.textContent = heroData.subheadline;
      subheadline.classList.add('for-you-personalized');
      // Explicitly remove width constraint to prevent clipping
      subheadline.style.removeProperty('width');
      // Restore original styling with !important for maximum specificity
      Object.keys(subheadlineStyles).forEach(prop => {
        const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
        subheadline.style.setProperty(cssProp, subheadlineStyles[prop], 'important');
      });
    }

    // Inject additional body copy
    if (heroSection && heroData.bodyCopy) {
      const additionalCopy = document.createElement('p');
      additionalCopy.className = 'for-you-body-copy';
      additionalCopy.textContent = heroData.bodyCopy;
      additionalCopy.style.opacity = '0';
      additionalCopy.style.transition = 'opacity 400ms ease-out';

      // Try to find the best place to insert
      const existingBody = heroSection.querySelector(this.SELECTORS.hero.body);
      if (existingBody) {
        existingBody.parentNode.insertBefore(additionalCopy, existingBody.nextSibling);
      } else {
        heroSection.appendChild(additionalCopy);
      }

      await this.wait(50);
      additionalCopy.style.opacity = '1';
    }

    // Fade in
    await this.wait(100);
    if (headline) headline.style.setProperty('opacity', '1', 'important');
    if (subheadline) subheadline.style.setProperty('opacity', '1', 'important');
  },

  // Update CTAs
  async updateCTAs(ctaText) {
    const buttons = document.querySelectorAll(this.SELECTORS.cta.buttons);

    buttons.forEach((btn, index) => {
      btn.style.transition = 'opacity 200ms ease-out';
      btn.style.opacity = '0';

      setTimeout(() => {
        // Update text content or aria-label
        if (btn.textContent.trim()) {
          btn.textContent = ctaText;
        }
        btn.setAttribute('aria-label', ctaText);
        btn.classList.add('for-you-personalized');

        btn.style.opacity = '1';

        // Add pulse animation to draw attention
        btn.classList.add('for-you-pulse');
        setTimeout(() => btn.classList.remove('for-you-pulse'), 600);
      }, 200 + index * 50);
    });
  },

  // Inject recommendation card
  async injectRecommendationCard(cardData) {
    // Check if card already exists
    if (document.querySelector('.for-you-recommendation-card')) {
      return;
    }

    const heroSection = document.querySelector(this.SELECTORS.hero.section);
    if (!heroSection) {
      console.warn('Hero section not found for recommendation card');
      return;
    }

    const card = document.createElement('div');
    card.className = 'for-you-recommendation-card';
    card.innerHTML = `
      <div class="for-you-badge-top">✨ For You</div>
      <h3>${cardData.title}</h3>
      <p>${cardData.description}</p>
      <div class="card-actions">
        <button class="btn-primary">${cardData.primaryCta}</button>
        <button class="btn-secondary">${cardData.secondaryCta}</button>
      </div>
    `;

    // Insert after hero section
    heroSection.insertAdjacentElement('afterend', card);

    // Trigger animation
    await this.wait(50);
    card.classList.add('visible');
  },

  // Filter and reorder artists
  async filterAndReorderArtists(recommendedArtists) {
    // Find artist cards
    const artistsSection = document.querySelector(this.SELECTORS.artists.section);
    if (!artistsSection) {
      console.warn('Artists section not found');
      return;
    }

    const artistCards = artistsSection.querySelectorAll(this.SELECTORS.artists.cards);
    if (artistCards.length === 0) {
      console.warn('No artist cards found');
      return;
    }

    console.log('Found artist cards:', artistCards.length);

    artistCards.forEach((card, index) => {
      // Find artist name
      const nameEl = card.querySelector(this.SELECTORS.artists.name);
      const artistName = nameEl ? nameEl.textContent.trim() : '';

      console.log('Processing artist:', artistName);

      // Add staggered animation delay
      card.style.transition = `all 400ms ease-out ${index * 30}ms`;

      // Check if recommended
      const isRecommended = recommendedArtists.some(name =>
        artistName.toLowerCase().includes(name.toLowerCase())
      );

      if (isRecommended) {
        console.log('Artist is recommended:', artistName);

        // Recommended artist - highlight and move to top
        card.classList.add('for-you-recommended');
        card.style.order = '-1';
        card.style.opacity = '1';
        card.style.transform = 'scale(1)';

        // Add badge
        if (!card.querySelector('.for-you-badge-artist')) {
          const badge = document.createElement('div');
          badge.className = 'for-you-badge-artist';
          badge.innerHTML = '✨ Recommended For You';
          card.style.position = 'relative';
          card.appendChild(badge);

          setTimeout(() => {
            badge.classList.add('visible');
          }, 500 + index * 30);
        }
      } else {
        // Non-recommended - fade and move to bottom
        card.style.opacity = '0.5';
        card.style.order = '999';
        card.style.transform = 'scale(0.98)';
      }
    });

    // If grid parent has display:grid, ensure order property works
    const grid = artistsSection.querySelector(this.SELECTORS.artists.grid);
    if (grid) {
      grid.style.display = 'grid';
    }
  },

  // Apply color palette
  applyColorPalette(palette) {
    const root = document.documentElement;

    if (palette.primary) {
      root.style.setProperty('--for-you-primary', palette.primary);
    }
    if (palette.accent) {
      root.style.setProperty('--for-you-accent', palette.accent);
    }
    if (palette.background) {
      root.style.setProperty('--for-you-bg-tint', palette.background);
    }
    if (palette.tertiary) {
      root.style.setProperty('--for-you-tertiary', palette.tertiary);
    }

    // Apply to recommendation card
    const card = document.querySelector('.for-you-recommendation-card');
    if (card && palette.accent) {
      card.style.borderLeftColor = palette.accent;
    }

    console.log('Color palette applied:', palette);
  },

  // Add "For You" badges to personalized elements
  addForYouBadges() {
    const personalizedElements = document.querySelectorAll('.for-you-personalized');

    personalizedElements.forEach((el, index) => {
      if (el.querySelector('.for-you-indicator')) return; // Already has badge

      const indicator = document.createElement('span');
      indicator.className = 'for-you-indicator';
      indicator.textContent = '✨';
      indicator.style.cssText = `
        margin-left: 8px;
        opacity: 0;
        transition: opacity 300ms ease-out;
        display: inline-block;
      `;

      el.appendChild(indicator);

      setTimeout(() => {
        indicator.style.opacity = '1';
      }, index * 100);
    });
  },

  // Highlight personalized elements
  highlightPersonalizedElements() {
    const personalizedElements = document.querySelectorAll('.for-you-personalized, .for-you-recommended');

    personalizedElements.forEach((el, index) => {
      setTimeout(() => {
        el.classList.add('for-you-highlight');
        setTimeout(() => {
          el.classList.remove('for-you-highlight');
        }, 800);
      }, index * 150);
    });
  },

  // Utility: Wait function
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // Remove personalization
  async removePersonalization() {
    // Remove injected elements
    const card = document.querySelector('.for-you-recommendation-card');
    if (card) card.remove();

    const badges = document.querySelectorAll('.for-you-badge-artist, .for-you-indicator');
    badges.forEach(badge => badge.remove());

    const bodyCopy = document.querySelectorAll('.for-you-body-copy');
    bodyCopy.forEach(copy => copy.remove());

    // Reset artist cards
    const artistCards = document.querySelectorAll('.for-you-recommended');
    artistCards.forEach(card => {
      card.classList.remove('for-you-recommended');
      card.style.order = '';
      card.style.opacity = '';
      card.style.transform = '';
    });

    // Reset personalized classes
    const personalized = document.querySelectorAll('.for-you-personalized');
    personalized.forEach(el => {
      el.classList.remove('for-you-personalized');
    });

    // Clear storage
    await window.ForYouStorage.clearPreferences();
    await window.ForYouStorage.setActive(false);

    // Reload page to restore original content
    setTimeout(() => {
      location.reload();
    }, 300);
  }
};

// Make available globally
window.ForYouPersonalization = ForYouPersonalization;
