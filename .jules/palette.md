## 2024-05-24 - Accessibility Gaps in Icon-Only Buttons
**Learning:** Icon-only buttons (like Undo/Redo using unicode characters) are often implemented without accessible names, making them invisible or confusing to screen reader users. The "Magic" button using a sparkle emoji is particularly ambiguous.
**Action:** Always verify that buttons without text content have `aria-label` and `title` attributes. For generic actions like "Magic", use descriptive labels like "Auto-enhance image".

## 2024-05-24 - Missing Standard Scripts
**Learning:** The repository lacks standard `test` and `lint` scripts in `package.json`. This makes it difficult to enforce code quality and automated verification.
**Action:** Be extra vigilant with manual code review and verification. In the future, suggest adding these scripts if the scope allows.
