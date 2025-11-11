# For You
**Personalization that feels human**

> Simple. Warm. Perfect.

A Chrome extension that demonstrates how websites should welcome people. Not a personalization engine - hospitality.

---

## The Philosophy

The For You feature isn't technology. It's the difference between a store that knows you and one that doesn't. Three warm questions. Eight perfect experiences. Everything feels inevitable.

---

## Quick Start

### Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `for-you` directory
5. Done!

### Usage

1. Visit **any Squarespace site** (e.g., https://www.ateliereva.com/)
2. Wait 1 second for the "For You" module to slide in at the bottom
3. Click the toggle switch
4. Answer 3 quick questions
5. Watch the site transform

**Smart Detection**: The extension automatically detects Squarespace sites and only activates on them. Works on custom domains, not just *.squarespace.com!

---

## How It Works

### Three Questions
1. **"How do you like to shop?"** - Browse vs Search
2. **"What catches your eye?"** - Classic vs Fresh
3. **"What matters most today?"** - Value vs Quality

### Eight Personas
2 answers × 3 questions = 8 personalized experiences

### Two Brand Variables
- Primary font (extracted from H1)
- Accent color (extracted from buttons/links)

### One Perfect Timing
250ms for everything. Smooth, fast, human.

---

## What It Does

**For You Module**
- iOS 18 frosted glass aesthetic
- Appears after 1 second
- Hides on scroll down, returns on scroll up
- Toggle on/off with smooth animation

**Quiz Experience**
- Minimal overlay, maximum clarity
- Question counter (1 of 3, 2 of 3, 3 of 3)
- Auto-advances on selection
- Clean cards with hover states
- Warm, conversational language

**Page Transformation**
- Hero headline adapts to persona
- Sections reorder based on priority
- Irrelevant sections collapse
- CTAs update with brand color
- Personalized indicator appears
- Everything animates in 250ms

**Smart Adaptation**
- Detects service sites (tattoo, salon) vs commerce
- Adapts language accordingly ("Book" vs "Shop")
- Respects brand identity
- Works on ANY Squarespace site (custom domains included)

**Squarespace Detection**
- Automatically identifies Squarespace sites via:
  - Meta tags (generator, content)
  - Script URLs (static1.squarespace.com)
  - DOM attributes (data-controller, .sqs- classes)
  - Global objects (Static.SQUARESPACE_CONTEXT)
  - HTML content analysis
- Only activates on confirmed Squarespace sites
- Works on custom domains like ateliereva.com

---

## File Structure

```
for-you/
├── manifest.json       # Chrome extension config
├── content.js          # Complete logic (~500 lines)
├── style.css           # iOS aesthetic
├── assets/
│   └── icon-*.png      # Extension icons
└── README.md           # This file
```

That's it. Simple.

---

## The Eight Personas

| Persona | Hero Message | What Shows | What Hides |
|---------|-------------|------------|------------|
| **Browse + Classic + Value** | Timeless Finds at Great Prices | Deals, classics, popular | New arrivals, premium |
| **Browse + Classic + Quality** | Our Finest Classic Collection | Premium, heritage | Sales, trending |
| **Browse + Fresh + Value** | New Discoveries, Great Prices | New arrivals, trending, deals | Heritage, premium |
| **Browse + Fresh + Quality** | Exceptional New Arrivals | New arrivals, premium, exclusive | Sales, basics |
| **Search + Classic + Value** | Find Exactly What You Need | Search, categories, deals | Blog, about |
| **Search + Classic + Quality** | Premium Selection, Refined Search | Categories, premium, search | Deals, blog |
| **Search + Fresh + Value** | Latest Deals, Fast Access | Search, new arrivals, deals | About, heritage |
| **Search + Fresh + Quality** | New Premium, Direct Access | Search, new arrivals, premium | Deals, basics |

---

## Demo Script (2 Minutes)

**Setup**: Any Squarespace site. Extension installed.

**Act 1: The Invitation** (20s)
- Page loads → Module slides in
- "Notice how it feels native"
- Click toggle

**Act 2: The Conversation** (30s)
- Answer 3 questions deliberately
- "Three questions. Eight experiences."

**Act 3: The Transformation** (30s)
- Hero changes
- Sections visibly reorder
- Sale sections collapse
- CTAs update
- Indicator appears

**Act 4: The Persistence** (20s)
- Navigate to different site
- Module appears with toggle ON
- Site auto-transforms

**Act 5: The Pitch** (20s)
- "8 personas from 3 questions"
- "Respects the brand while serving the user"
- "This is how websites should work"

---

## Technical Details

### Brand Extraction
```javascript
// 1. Get font from H1
const font = getComputedStyle(h1).fontFamily;

// 2. Get color from button or link
const accent = getComputedStyle(button).backgroundColor;

// 3. Apply as CSS variables
--site-font: [extracted font]
--site-accent: [extracted color]
```

### Section Reordering
```javascript
// Flexbox ordering based on persona priorities
container.style.display = 'flex';
section.style.order = priorityScore;

// Hide irrelevant sections
section.style.maxHeight = '0';
section.style.opacity = '0';
```

### Persistence
```javascript
// localStorage remembers:
localStorage.getItem('for-you-persona')  // browse-classic-value
localStorage.getItem('for-you-enabled')  // true
```

---

## Why This Version Wins

### Simple
- 3 questions, not 10
- 2 brand variables, not 20
- 1 animation timing, not complex choreography
- ~500 lines total, not 2000

### Human
- Questions feel like conversation
- Module feels like iOS
- Transformations respect the brand
- Everything feels warm, not robotic

### Smart
- Auto-detects site type
- Adapts language accordingly
- Extracts brand automatically
- Persists across sessions

### The Magic Moment
When sections reorder while maintaining brand identity - that's when people understand this is the future.

---

## Browser Support

- Chrome (Manifest V3)
- Edge (Chromium-based)
- Brave (Chromium-based)

Not compatible with Firefox (different extension APIs).

---

## License

Internal prototype - not for external distribution.

---

## The Bottom Line

This isn't a feature. It's a philosophy.

**Simple enough that anyone can use it.**
**Smart enough to transform any site.**
**Human enough to feel like hospitality.**

*"For You. Two words that change everything."*

---

**Questions?** Check the code - it's designed to be read.
**Ready to demo?** Practice once, then ship it.
**Want to iterate?** Everything is in content.js.

Ship it. 🚀
