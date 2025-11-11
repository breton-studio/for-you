# Testing Guide for For You Extension

## Pre-Installation Checklist

- [ ] Chrome browser version 88+ installed
- [ ] Developer mode can be enabled
- [ ] Access to ateliereva.com (site is live)

## Installation Testing

### Test 1: Extension Loads Successfully
1. Navigate to `chrome://extensions/`
2. Enable Developer mode
3. Click "Load unpacked"
4. Select the `for-you` directory
5. **Expected**: Extension appears with green icon and no errors

**✅ Pass Criteria**: Extension card shows "For You - Personalization Demo" with no error messages

### Test 2: Icon Appears in Toolbar
1. Look for extension icon in Chrome toolbar
2. Click the puzzle piece and find the extension
3. Pin it to toolbar
4. **Expected**: Icon is visible and clickable

**✅ Pass Criteria**: Extension icon is accessible

## Functionality Testing

### Test 3: Module Injection
1. Navigate to https://www.ateliereva.com/
2. Wait for page to fully load (2-3 seconds)
3. Look at bottom of viewport
4. **Expected**: "For You" module appears at bottom center

**✅ Pass Criteria**: Module is visible with:
- ✨ icon on left
- "For You" title
- "Get Atelier Eva Tailored For You" subtitle
- Toggle switch on right (in OFF position)

### Test 4: Quiz Flow - Complete Path
1. Click the toggle switch
2. **Expected**: Quiz modal appears with overlay
3. Progress indicator shows "1 of 4"
4. Click first option in Question 1
5. **Expected**:
   - Option highlights in green
   - Auto-advances to Question 2 after 400ms
   - Progress bar updates to 50%
6. Complete all 4 questions
7. **Expected**: "Done" screen appears with:
   - ✨ celebration emoji
   - "You're all set!" message
   - CTA button
8. Wait 2 seconds OR click button
9. **Expected**: Modal fades out smoothly

**✅ Pass Criteria**:
- All 4 questions display correctly
- Progress indicator updates
- Options are clickable and provide feedback
- Done screen appears
- Modal dismisses cleanly

### Test 5: Personalization Transformation
Immediately after quiz completion:

1. **Page flash** (500ms)
   - [ ] Subtle white flash occurs

2. **Hero headline changes** (within 1 second)
   - [ ] Headline text updates
   - [ ] Subheadline text updates
   - [ ] Changes are smooth with fade transition

3. **Recommendation card appears** (around 0.5s)
   - [ ] Card slides in below hero
   - [ ] "✨ For You" badge visible
   - [ ] Artist recommendation shows
   - [ ] Two CTA buttons present

4. **Artist grid reorders** (around 0.8s)
   - [ ] Some artists move to top
   - [ ] "✨ Recommended For You" badges appear
   - [ ] Non-recommended artists fade to 50% opacity
   - [ ] Transitions are smooth

5. **CTA buttons update** (around 1s)
   - [ ] Button text changes
   - [ ] Buttons pulse briefly

6. **Toggle updates** (end)
   - [ ] Toggle switch is now in ON position

**✅ Pass Criteria**: At least 4 of the 6 transformation elements are visible

### Test 6: Scroll Behavior
1. After personalization is active
2. Scroll down the page past 100px
3. **Expected**: Module fades out and slides down
4. Scroll back up
5. **Expected**: Module fades in and slides back

**✅ Pass Criteria**: Module smoothly hides/shows based on scroll direction

### Test 7: Toggle Off
1. Scroll to top to ensure module is visible
2. Click toggle to turn OFF
3. **Expected**: Confirmation dialog appears
4. Click "OK"
5. **Expected**: Page reloads
6. **Expected**: Page returns to original state (no personalization)
7. **Expected**: Toggle is in OFF position

**✅ Pass Criteria**: Personalization can be toggled off and page returns to original state

### Test 8: Preference Persistence
1. Complete quiz with specific answers
2. Toggle ON (personalization active)
3. Note the personalized headline
4. Refresh the page (Cmd+R / Ctrl+R)
5. **Expected**:
   - Module appears
   - Toggle is still ON
   - Personalization auto-applies
   - Same headline appears
6. Navigate away and back to ateliereva.com
7. **Expected**: Personalization still active

**✅ Pass Criteria**: Preferences persist across page reloads and navigation

### Test 9: Extension Icon Click
1. Toggle personalization OFF (if on)
2. Click the extension icon in toolbar
3. **Expected**: Quiz modal opens
4. Complete quiz
5. **Expected**: Personalization applies

**✅ Pass Criteria**: Extension icon triggers quiz when personalization is off

## Scenario Testing

Test each personalization scenario to ensure variety:

### Scenario A: Nature-Inspired Collaborator
**Quiz Answers**:
- Vibe: Collaborative
- Draws In: Refined & minimal
- Important: Personal meaning
- Style: Botanical & Natural

**Expected Results**:
- Headline: "Let's Design Your Nature-Inspired Story"
- Recommended Artist: Wendy
- Colors: Sage greens (#7a9d8f)

### Scenario B: Expert-Seeking Quality
**Quiz Answers**:
- Vibe: Trust-the-expert
- Draws In: Bold & eye-catching
- Important: Quality & craftsmanship
- Style: Traditional & Bold

**Expected Results**:
- Headline: "Master Craftsmen of Traditional Tattoo Art"
- Recommended Artist: Eva
- Colors: Bold red accent (#c41e3a)

### Scenario C: Geometric Storyteller
**Quiz Answers**:
- Vibe: Collaborative
- Draws In: Refined & minimal
- Important: Personal meaning
- Style: Minimalist & Geometric

**Expected Results**:
- Headline: "Let's Design Your Geometric Story"
- Recommended Artist: Mishka
- Colors: Teal accent (#14b8a6)

**✅ Pass Criteria**: Each scenario produces visibly different personalization

## Performance Testing

### Test 10: Animation Performance
1. Open Chrome DevTools
2. Go to Performance tab
3. Start recording
4. Complete quiz and watch transformation
5. Stop recording
6. **Expected**:
   - Frame rate stays near 60fps
   - No long tasks blocking main thread
   - Smooth animations throughout

**✅ Pass Criteria**: No visible jank or stuttering during transitions

### Test 11: Page Load Impact
1. Open DevTools Network tab
2. Navigate to ateliereva.com
3. Note page load time
4. **Expected**:
   - Content scripts load after page content
   - Module appears after main content
   - No blocking of page rendering

**✅ Pass Criteria**: Extension doesn't noticeably slow page load

## Error Handling Testing

### Test 12: Quiz Interruption
1. Start quiz
2. Click X button to close modal
3. **Expected**: Modal closes, personalization not applied
4. Click toggle again
5. **Expected**: Quiz restarts from beginning

**✅ Pass Criteria**: Quiz can be safely cancelled and restarted

### Test 13: Site Navigation
1. Apply personalization on home page
2. Click internal link to navigate to another page (e.g., "Our Work")
3. **Expected**: Module may or may not appear (other pages not supported)
4. Go back to home page
5. **Expected**: Personalization still active

**✅ Pass Criteria**: Extension doesn't break site navigation

## Browser Console Testing

### Test 14: Check for Errors
1. Open Chrome DevTools Console
2. Navigate to ateliereva.com
3. Interact with extension (quiz, toggle, etc.)
4. **Expected**: Minimal console output
5. Look for any error messages (red text)

**✅ Pass Criteria**:
- No JavaScript errors
- Only informational logs present
- No network failures

### Test 15: Storage Inspection
1. Open DevTools
2. Go to Application tab
3. Expand "Storage" → "Local Storage"
4. Find extension's storage
5. Or run in console: `chrome.storage.local.get(null, console.log)`
6. **Expected**: See stored preferences after quiz completion

**✅ Pass Criteria**: Preferences are correctly stored in Chrome storage

## Responsive Testing

### Test 16: Mobile Viewport
1. Open DevTools
2. Toggle device toolbar (Cmd+Shift+M)
3. Select iPhone or Android device
4. Reload page
5. **Expected**:
   - Module adjusts to screen width
   - Quiz modal is responsive
   - Text remains readable
   - Buttons are tappable

**✅ Pass Criteria**: Basic responsive behavior works (though mobile is not primary target)

## Edge Case Testing

### Test 17: Rapid Toggling
1. Toggle ON
2. Immediately toggle OFF
3. Immediately toggle ON again
4. **Expected**: Extension handles rapid state changes gracefully

**✅ Pass Criteria**: No errors, state remains consistent

### Test 18: Multiple Tabs
1. Open ateliereva.com in Tab 1
2. Complete quiz and personalize
3. Open ateliereva.com in new Tab 2
4. **Expected**: Tab 2 auto-applies personalization
5. Toggle OFF in Tab 2
6. Switch to Tab 1
7. **Expected**: Tab 1 personalization may still show until reload

**✅ Pass Criteria**: Each tab can be independently controlled

### Test 19: Site Already Loaded
1. Navigate to ateliereva.com FIRST
2. THEN load the extension
3. Refresh the page
4. **Expected**: Module appears normally

**✅ Pass Criteria**: Extension works when loaded after visiting site

## Regression Testing Checklist

After making any code changes, verify:

- [ ] Extension still loads without errors
- [ ] Module injects on page
- [ ] Quiz opens and can be completed
- [ ] At least 3 personalization changes are visible
- [ ] Toggle works both directions
- [ ] Preferences persist across reload
- [ ] No console errors

## Demo Dry Run

### Full Demo Test (2-3 minutes)

**Preparation**:
1. Reset extension (toggle off, clear storage if needed)
2. Close all Chrome windows
3. Open new Chrome window with ateliereva.com
4. Have DevTools ready (but hidden from demo)

**Execution**:
1. Start timer
2. Show original site (10 seconds)
3. Activate For You (5 seconds)
4. Complete quiz deliberately (45 seconds)
5. Point out transformation changes (60 seconds)
6. Scroll page to show module behavior (20 seconds)
7. Deliver vision statement (30 seconds)
8. Stop timer

**✅ Pass Criteria**:
- Total time under 3 minutes
- All major features demonstrated
- No errors or glitches
- Smooth, confident delivery

## Critical Issues Checklist

If any of these fail, do not demo:

- [ ] Extension fails to load
- [ ] Module doesn't appear
- [ ] Quiz doesn't complete
- [ ] No visible personalization after quiz
- [ ] Console shows JavaScript errors
- [ ] Page breaks or becomes unusable
- [ ] Toggle switch doesn't work

## Known Issues to Work Around

Document any known issues here for demo purposes:

1. **Issue**: [Example: Artist names might not match exactly]
   **Workaround**: [Example: Check actual site first and update personalization-map.json]

2. **Issue**: [Example: Color changes might be subtle]
   **Workaround**: [Example: Point them out explicitly during demo]

## Pre-Demo Final Check (Day Before)

- [ ] Run full test suite above
- [ ] Practice demo 5+ times
- [ ] Record backup demo video
- [ ] Prepare demo script notes
- [ ] Test on presentation machine/projector
- [ ] Have fallback plan (slides + video)
- [ ] Clear browser cache
- [ ] Close unnecessary tabs
- [ ] Disable other extensions that might interfere
- [ ] Check site is still accessible
- [ ] Battery fully charged (if laptop)

---

## Troubleshooting Guide

### Problem: Module doesn't appear
**Solutions**:
1. Check you're on ateliereva.com (not a different page)
2. Wait 2-3 seconds for page to fully load
3. Check console for errors
4. Reload extension in chrome://extensions/
5. Hard refresh page (Cmd+Shift+R)

### Problem: Quiz doesn't open
**Solutions**:
1. Check if toggle is already ON (quiz only opens when turning on)
2. Click extension icon in toolbar as alternative
3. Check console for errors
4. Reload extension

### Problem: No personalization visible
**Solutions**:
1. Check console for "Applying personalization" message
2. Verify personalization-map.json exists
3. Inspect hero section to confirm selectors are correct
4. Try different quiz answers
5. Check if site structure has changed

### Problem: Performance is slow
**Solutions**:
1. Close other tabs
2. Disable other extensions
3. Check CPU usage
4. Simplify animations (reduce transition times in CSS)

### Problem: Extension won't load
**Solutions**:
1. Check manifest.json is valid JSON
2. Look for syntax errors in console
3. Verify all files referenced in manifest exist
4. Try removing and re-adding extension

---

**Testing complete?** Document any issues found and decide if they're blockers for demo.
