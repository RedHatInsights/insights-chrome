import React from 'react';

/**
 * Extracts a message string from an unknown error value.
 */
function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return '';
}

/**
 * Detects whether an error is a chunk/module loading failure.
 *
 * Standard webpack 5 dynamic imports throw plain Error objects with messages
 * like "Loading chunk X failed." — they do NOT set error.cause.name or
 * error.name to 'ChunkLoadError'. This function uses message pattern matching
 * to catch all known chunk loading error formats.
 *
 * Patterns matched:
 * - Webpack 5: "Loading chunk 123 failed."
 * - Webpack CSS (mini-css-extract-plugin): "Loading CSS chunk 456 failed."
 * - Chrome/Vite: "Failed to fetch dynamically imported module: ..."
 * - Firefox: "error loading dynamically imported module"
 * - Safari/WebKit: "Importing a module script failed"
 * - ChunkLoadError name on error or error.cause (future-proofing)
 */
export function isChunkLoadError(error: unknown): boolean {
  if (!error) return false;

  const message = getErrorMessage(error);

  // Standard webpack 5 chunk load errors
  // e.g. "Loading chunk 123 failed.\n(error: https://cdn.example.com/chunk.123.js)"
  if (/loading chunk .+ failed/i.test(message)) return true;

  // CSS chunk loading errors (webpack mini-css-extract-plugin)
  if (/loading css chunk .+ failed/i.test(message)) return true;

  // ESM dynamic import failures (browser-specific messages)
  // Chrome/Vite: "Failed to fetch dynamically imported module: ..."
  if (/failed to fetch dynamically imported module/i.test(message)) return true;
  // Firefox: "error loading dynamically imported module"
  if (/error loading dynamically imported module/i.test(message)) return true;
  // Safari/WebKit: "Importing a module script failed"
  if (/importing a module script failed/i.test(message)) return true;

  // Check error.name or error.cause.name (some bundlers/wrappers set this)
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    if (err.name === 'ChunkLoadError') return true;
    if (typeof err.cause === 'object' && err.cause !== null && (err.cause as Record<string, unknown>).name === 'ChunkLoadError') {
      return true;
    }
  }

  return false;
}

/**
 * Retries a dynamic import function on chunk load failure.
 * Only retries when the error is identified as a chunk load error.
 * Non-chunk errors propagate immediately without retry.
 *
 * @internal Exported for testing only.
 */
export function retryImport<T>(importFn: () => Promise<T>, retries: number, delay: number): Promise<T> {
  return importFn().catch((error: unknown) => {
    if (retries > 0 && isChunkLoadError(error)) {
      return new Promise<T>((resolve) => setTimeout(() => resolve(retryImport(importFn, retries - 1, delay)), delay));
    }
    throw error;
  });
}

/**
 * Internal mutable config for testability.
 *
 * Webpack 5 ESM module namespaces are read-only (exports are getter-backed bindings),
 * so cy.stub() on a direct export like `reloadPage` silently fails in CI.
 * By routing through a plain mutable object, tests can reliably replace the function:
 *
 *   cy.stub(chunkLoadErrorUtils._testHooks, 'reload')
 *
 * @internal Exported ONLY for test stubbing.
 */
export const _testHooks = {
  reload: (): void => {
    location.reload();
  },
};

/**
 * Wrapper around location.reload() for testability.
 * Calls _testHooks.reload() so tests can stub the actual reload.
 */
export function reloadPage(): void {
  _testHooks.reload();
}

/**
 * Drop-in replacement for React.lazy() that retries the dynamic import
 * on transient chunk loading failures before giving up.
 *
 * Usage:
 *   const MyComponent = lazyWithRetry(() => import('./MyComponent'));
 *
 * @param importFn - Dynamic import factory function
 * @param retries - Number of retry attempts (default: 2)
 * @param delay - Delay in ms between retries (default: 1000)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches React.lazy's own signature
export function lazyWithRetry<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  retries = 2,
  delay = 1000
): React.LazyExoticComponent<T> {
  return React.lazy(() => retryImport(importFn, retries, delay));
}
