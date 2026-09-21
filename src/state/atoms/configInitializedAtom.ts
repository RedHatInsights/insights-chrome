import { atom } from 'jotai';

/**
 * Page-scoped guard for the one-time session config init in `useSessionConfig`.
 * Lives on the singleton `chromeStore` (the JotaiProvider sits above the ErrorBoundary),
 * so it survives an App remount — unlike a component-scoped `useRef`, which would reset
 * and let the shell re-fetch `/user` and re-POST `update-ui-preview`.
 */
export const configInitializedAtom = atom(false);

/**
 * Page-scoped "config has loaded" signal for `useSessionConfig`.
 * Lives on the singleton `chromeStore` (like `configInitializedAtom`) so a shell that has
 * already loaded re-renders immediately after an ErrorBoundary "Try again" remount, without
 * re-running the one-time init. If this were component-scoped `useState`, a remount would reset
 * it to `false` while `configInitializedAtom` stayed `true`, leaving the shell stuck on the
 * loading placeholder forever (the init effect early-returns and never re-sets it).
 * Recovery from a degraded/gateway failure is reload-based by design — see the guard comment
 * in `useSessionConfig`.
 */
export const configLoadedAtom = atom(false);
