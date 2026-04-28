/**
 * Test constants for Playwright E2E tests
 *
 * Avoid hardcoded timeout values in tests - use these symbolic constants instead.
 */

/**
 * Timeout for waiting for page content to render in CI environments.
 * CI environments may have slower rendering times than local development.
 */
export const PAGE_RENDER_TIMEOUT = 15000; // 15 seconds
