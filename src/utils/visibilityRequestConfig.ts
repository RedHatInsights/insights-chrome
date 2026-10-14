// Per HTTP request; pagination can make more than one sequential request.
export const VISIBILITY_REQUEST_TIMEOUT_MS = 5_000;

/** Allow a shorter custom deadline, but never let visibility requests wait forever. */
export const getVisibilityRequestTimeout = (timeout?: number): number =>
  typeof timeout === 'number' && Number.isFinite(timeout) && timeout > 0
    ? Math.min(Math.ceil(timeout), VISIBILITY_REQUEST_TIMEOUT_MS)
    : VISIBILITY_REQUEST_TIMEOUT_MS;
