# Bolt's Journal

## 2024-05-22 - Stabilizing Context Actions for Memoization
**Learning:** Simply wrapping context `value` in `useMemo` is insufficient if the properties of that value (like `actions`) are recreated on every render.
**Action:** When optimizing Context, ensure that the `actions` object and its constituent functions are also stable (e.g., defined inside `useMemo` or `useCallback`). This allows downstream components using `React.memo` to effectively skip re-renders.
