# For You - Personalization Demo Extension

A Chrome extension prototype demonstrating the "For You" cross-site personalization feature for Squarespace sites, specifically targeting [Atelier Eva](https://www.ateliereva.com/).

## 🎯 Project Goal

Demonstrate how user preferences can transform generic web experiences into personalized ones that drive conversion. Built for Hackweek to create a compelling demo that gets execs saying "when can we ship this?"

## ✨ Features

- **Smart Quiz**: 4-question visual quiz that captures user preferences
- **Dynamic Personalization**: Transforms page content based on preferences
  - Personalized headlines and copy
  - Recommended artist matching
  - Custom color palettes
  - Targeted CTAs
- **Smooth Animations**: Choreographed 2.5-second transformation sequence
- **Persistent State**: Preferences saved across sessions
- **Scroll-Aware UI**: Module elegantly hides/shows based on scroll

## 📦 Installation

### Step 1: Load the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `for-you` directory
5. The extension should now appear in your extensions list

### Step 2: Pin the Extension (Optional)

1. Click the puzzle piece icon in Chrome toolbar
2. Find "For You - Personalization Demo"
3. Click the pin icon to keep it visible

## 🚀 Usage

### First Time Experience

1. Navigate to [https://www.ateliereva.com/](https://www.ateliereva.com/)
2. Wait for page to load
3. A "For You" module will appear at the bottom of the page
4. Click the toggle switch to activate
5. Answer the 4 quiz questions:
   - What's your vibe?
   - What draws you in?
   - What's most important to you?
   - What's your aesthetic style?
6. Watch the page transform!

### Returning Experience

- Your preferences are saved
- Toggle on/off to show/hide personalization
- The module hides when scrolling down, reappears when scrolling up

## 🎨 Personalization Scenarios

The extension includes 5 pre-configured personalization scenarios:

### 1. The Nature-Inspired Collaborator
**Preferences**: Collaborative + Refined + Personal Meaning + Botanical
- Botanical-focused headlines
- Artist recommendation: Wendy
- Sage green color palette

### 2. The Expert-Seeking Quality Enthusiast
**Preferences**: Trust-the-expert + Bold + Quality + Traditional
- Master craftsmen positioning
- Artist recommendation: Eva
- Bold black and red palette

### 3. The Geometric Storyteller
**Preferences**: Collaborative + Refined + Personal Meaning + Geometric
- Geometric design focus
- Artist recommendation: Mishka
- Teal accent palette

### 4. Bold Statement Maker
**Preferences**: Spontaneous + Bold + Statement + Traditional
- Bold, attention-grabbing copy
- Artist recommendation: Eva
- Traditional bold colors

### 5. Planned Botanical Researcher
**Preferences**: Planned + Refined + Quality + Botanical
- Quality-focused botanical messaging
- Artist recommendation: Wendy
- Natural green palette

## 🏗️ Architecture

```
for-you/
├── manifest.json          # Extension configuration
├── background.js          # Service worker
├── content.js            # Main injection logic
├── scripts/
│   ├── quiz.js           # Quiz flow and UI
│   ├── personalization.js # Content transformation
│   └── storage.js        # Chrome storage wrapper
├── styles/
│   ├── module.css        # For You module styles
│   ├── quiz.css          # Quiz modal styles
│   └── animations.css    # Transition animations
├── assets/
│   ├── icon-16.png       # Extension icons
│   ├── icon-48.png
│   └── icon-128.png
└── data/
    └── personalization-map.json # Preference mappings
```

## 🎬 Demo Script

### Setup (5 seconds)
"Here's Atelier Eva—a beautiful Squarespace site for a luxury tattoo studio in Brooklyn."

### Activation (60 seconds)
1. Click extension icon or toggle
2. Answer 4 questions deliberately
3. Show done screen

### Transformation (45 seconds)
Point out changes as they happen:
- Headline personalization
- Recommendation card injection
- Artist filtering and badges
- CTA updates
- Color palette shift

### Vision (30 seconds)
"Imagine this profile following users across every Squarespace site they visit. Answer once, get personalized everywhere."

## 🐛 Debugging

### Extension Not Loading
- Check Developer mode is enabled
- Look for errors in `chrome://extensions/`
- Check browser console for errors

### Module Not Appearing
- Verify you're on ateliereva.com
- Check console for initialization messages
- Try refreshing the page

### Personalization Not Working
- Open Chrome DevTools console
- Look for "Applying personalization" message
- Check if personalization-map.json loaded correctly
- Verify DOM selectors match the actual site structure

### View Logs
```javascript
// In Chrome DevTools console:
chrome.storage.local.get(null, console.log) // View all stored data
```

## 🔧 Customization

### Adding New Personalization Scenarios

1. Edit `data/personalization-map.json`
2. Add new key with format: `preference1+preference2+preference3+preference4`
3. Define hero content, CTAs, recommended artists, and color palette

### Adjusting DOM Selectors

If the target site structure changes:

1. Edit `scripts/personalization.js`
2. Update the `SELECTORS` object
3. Use Chrome DevTools to inspect actual site structure

### Modifying Quiz Questions

1. Edit `scripts/quiz.js`
2. Update the `questions` array
3. Adjust personalization-map.json keys to match new option values

## 📊 Success Metrics

### Must Achieve
- ✅ Extension installs without errors
- ✅ Module injects on ateliereva.com
- ✅ Quiz completes without bugs
- ✅ 5+ visible personalization changes
- ✅ Smooth 60fps animations
- ✅ 2-3 minute demo flow

### Bonus Points
- ✅ Preferences persist across reloads
- ✅ 7+ personalization changes visible
- ⚠️ Before/after comparison (not implemented)
- ⚠️ Mobile/tablet support (basic responsive CSS included)

## 🚫 Known Limitations

These are intentionally out of scope for the hackweek prototype:

- No cross-site profile syncing
- No backend infrastructure
- Only works on one Squarespace template
- No user accounts
- No analytics tracking
- No A/B testing
- No progressive profiling
- Minimal error handling
- No preference editing UI

## 🛠️ Development

### Local Testing

```bash
# Make changes to any files
# Reload extension in chrome://extensions/
# Click "Reload" button on the extension card
# Refresh ateliereva.com to see changes
```

### Quick Iteration

For CSS/HTML changes:
1. Edit the relevant style file
2. Reload extension
3. Hard refresh the site (Cmd+Shift+R)

For JS logic changes:
1. Edit the script file
2. Reload extension
3. Reload the site

## 📝 Technical Notes

### Performance
- Content script loads at `document_idle` to avoid blocking page load
- Animations use `requestAnimationFrame` for smooth 60fps
- Scroll handler uses throttling via RAF
- Minimal DOM queries cached where possible

### Browser Compatibility
- Built for Chrome using Manifest V3
- Should work in Edge and other Chromium browsers
- Not compatible with Firefox (uses different extension APIs)

### Data Storage
- Uses Chrome's `storage.local` API
- Preferences stored as JSON object
- No server-side storage or sync

## 🎯 Next Steps for Production

If this demo gets greenlit, here's what would need to be built:

1. **Cross-Site Profile System**
   - Central preference storage
   - Profile syncing across sites
   - Privacy controls

2. **Template Compatibility**
   - Support all Squarespace templates
   - Dynamic selector detection
   - Fallback handling

3. **Seller Tools**
   - Personalization dashboard
   - Custom scenario builder
   - A/B testing framework

4. **Progressive Profiling**
   - Multi-wave questioning
   - Implicit preference learning
   - Confidence scoring

5. **Analytics & Optimization**
   - Conversion tracking
   - Scenario performance metrics
   - Recommendation engine ML

## 📄 License

Internal Squarespace prototype - not for external distribution.

## 👥 Credits

Built for Hackweek 2024 by [Your Name]

---

**Questions?** Check the issues in the repo or reach out on Slack.

**Ready to demo?** Practice the script 5+ times before presenting! 🚀
