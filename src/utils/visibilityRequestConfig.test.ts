import { VISIBILITY_REQUEST_TIMEOUT_MS, getVisibilityRequestTimeout } from './visibilityRequestConfig';

it.each([undefined, 0, -1, NaN, Infinity, -Infinity, '0', null])('keeps a finite deadline for timeout=%s', (timeout) => {
  expect(getVisibilityRequestTimeout(timeout as number | undefined)).toBe(VISIBILITY_REQUEST_TIMEOUT_MS);
});

it.each([
  [100, 100],
  [0.1, 1],
  [100.1, 101],
  [5_000, 5_000],
  [60_000, 5_000],
])('bounds a caller deadline of %s ms to %s ms', (timeout, expected) => {
  expect(getVisibilityRequestTimeout(timeout)).toBe(expected);
});
