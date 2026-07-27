/**
 * Timeout constants for Playwright test setup and authentication
 */

/**
 * Default timeout for authentication operations in CI environments.
 * CI environments may have slower network/SSO response times than local development.
 *
 * Used for:
 * - SSO redirects and login flows
 * - Form submissions during authentication
 * - Waiting for authenticated state
 */
export const AUTH_TIMEOUT = 90000; // 90 seconds

/**
 * Timeout for initial page navigation during global setup.
 * Should be sufficient for application bootstrap and initial render.
 */
export const NAVIGATION_TIMEOUT = 60000; // 60 seconds

/**
 * Timeout for search operations.
 * Search uses local Orama index query which loads asynchronously on page load.
 * This timeout accounts for async index loading + query execution time in CI.
 */
export const SEARCH_TIMEOUT = 10000; // 10 seconds

/**
 * Timeout for UI element visibility checks.
 * CI environments may have slower rendering and hydration times.
 * Used for waiting for elements to appear after navigation or user interactions.
 */
export const UI_VISIBILITY_TIMEOUT = 10000; // 10 seconds
