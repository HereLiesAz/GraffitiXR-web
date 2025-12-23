## 2024-05-23 - Prevent Reverse Tabnabbing
**Vulnerability:** Usage of `window.open(url, '_blank')` without `noopener,noreferrer` features.
**Learning:** Even though modern browsers often imply `noopener` for `_blank`, explicitly defining it is a critical defense-in-depth practice to prevent the new window from accessing `window.opener` and potentially redirecting the original page (phishing).
**Prevention:** Always use `window.open(url, '_blank', 'noopener,noreferrer')` or `<a href="..." target="_blank" rel="noopener noreferrer">`.
