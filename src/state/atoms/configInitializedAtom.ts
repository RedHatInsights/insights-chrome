import { atom } from 'jotai';

/**
 * Page-scoped guard for the one-time session config init in `useSessionConfig`.
 * Lives on the singleton `chromeStore` (the JotaiProvider sits above the ErrorBoundary),
 * so it survives an App remount — unlike a component-scoped `useRef`, which would reset
 * and let the shell re-fetch `/user` and re-POST `update-ui-preview`.
 */
export const configInitializedAtom = atom(false);
