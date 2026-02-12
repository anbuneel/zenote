## 2024-05-23 - [Root Component Handler Instability]
**Learning:** `App.tsx` acts as a monolithic controller, passing numerous event handlers to children like `ChapteredLibrary`. Even though data props (like `notes`) were memoized, the handlers (e.g., `handleNoteClick`) were recreated on every render, causing expensive list re-renders.
**Action:** When optimizing heavy list components in this architecture, always check if the *handlers* passed from `App.tsx` are stable, not just the data. Use `useCallback` for handlers and `React.memo` for the list component.
