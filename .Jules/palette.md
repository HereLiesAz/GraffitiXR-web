## 2024-05-23 - [MenuItem Keyboard Accessibility]
**Learning:**
Custom UI components like "div-as-button" are common in prototypes but often lack basic keyboard accessibility.
While `onClick` works for mouse, it leaves keyboard users (Tab, Enter/Space) completely blocked.
Converting these to native `<button>` elements is the most robust fix, but requires careful CSS resets (border, background, font) to maintain the original look.

**Action:**
When spotting `div` with `onClick`, immediately check:
1. Is it reachable via Tab? (tabIndex)
2. Can it be triggered with Enter/Space?
3. Does it have a semantic role?
If "No" to any, prefer refactoring to `<button>` over patching the `div` with ARIA.
