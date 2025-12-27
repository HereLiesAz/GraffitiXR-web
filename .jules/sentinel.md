## 2024-05-23 - Prevent Reverse Tabnabbing
**Vulnerability:** Usage of `window.open(url, '_blank')` without `noopener,noreferrer` features.
**Learning:** Even though modern browsers often imply `noopener` for `_blank`, explicitly defining it is a critical defense-in-depth practice to prevent the new window from accessing `window.opener` and potentially redirecting the original page (phishing).
**Prevention:** Always use `window.open(url, '_blank', 'noopener,noreferrer')` or `<a href="..." target="_blank" rel="noopener noreferrer">`.

## 2024-05-24 - Content Security Policy (CSP) Implementation
**Vulnerability:** Absence of Content Security Policy (CSP) headers allows execution of arbitrary scripts and resources if an injection vulnerability exists.
**Learning:** Client-side React applications, especially those handling file inputs and external libraries (like `@imgly`), must explicitly define allowed origins for scripts, styles, and workers to mitigate XSS risks effectively.
**Prevention:** Implement a strict CSP meta tag in `index.html` that whitelists only necessary domains (e.g., `static.img.ly` for WASM assets) and directives (e.g., `worker-src blob:`), blocking all other unauthorized resources.
