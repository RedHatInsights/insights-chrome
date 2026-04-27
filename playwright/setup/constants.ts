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
