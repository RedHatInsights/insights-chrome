import React, { Suspense } from 'react';
import { act, render, screen } from '@testing-library/react';
import { isChunkLoadError, lazyWithRetry, retryImport } from './chunkLoadErrorUtils';

describe('isChunkLoadError', () => {
  describe('returns true for chunk loading errors', () => {
    it('detects webpack 5 chunk loading error', () => {
      const error = new Error('Loading chunk 123 failed.\n(error: https://cdn.example.com/chunk.123.js)');
      expect(isChunkLoadError(error)).toBe(true);
    });

    it('detects webpack 5 chunk error without URL detail', () => {
      const error = new Error('Loading chunk main failed.');
      expect(isChunkLoadError(error)).toBe(true);
    });

    it('detects CSS chunk loading error', () => {
      const error = new Error('Loading CSS chunk 456 failed.\n(https://cdn.example.com/chunk.456.css)');
      expect(isChunkLoadError(error)).toBe(true);
    });

    it('detects case-insensitive chunk error', () => {
      const error = new Error('LOADING CHUNK abc FAILED.');
      expect(isChunkLoadError(error)).toBe(true);
    });

    it('detects Vite/ESM dynamic import failure (Chrome)', () => {
      const error = new Error('Failed to fetch dynamically imported module: https://example.com/module.js');
      expect(isChunkLoadError(error)).toBe(true);
    });

    it('detects Firefox dynamic import failure', () => {
      const error = new Error('error loading dynamically imported module');
      expect(isChunkLoadError(error)).toBe(true);
    });

    it('detects Safari/WebKit dynamic import failure', () => {
      const error = new Error('Importing a module script failed.');
      expect(isChunkLoadError(error)).toBe(true);
    });

    it('detects error with name ChunkLoadError', () => {
      const error = new Error('some message');
      error.name = 'ChunkLoadError';
      expect(isChunkLoadError(error)).toBe(true);
    });

    it('detects error with cause.name ChunkLoadError', () => {
      const cause = new Error('underlying cause');
      cause.name = 'ChunkLoadError';
      const error = new Error('wrapper error', { cause });
      expect(isChunkLoadError(error)).toBe(true);
    });

    it('detects plain object with ChunkLoadError name', () => {
      const error = { name: 'ChunkLoadError', message: 'chunk failed' };
      expect(isChunkLoadError(error)).toBe(true);
    });

    it('detects plain object with cause.name ChunkLoadError', () => {
      const error = { message: 'wrapper', cause: { name: 'ChunkLoadError' } };
      expect(isChunkLoadError(error)).toBe(true);
    });

    it('detects string error message about chunk loading', () => {
      expect(isChunkLoadError('Loading chunk vendors failed.')).toBe(true);
    });
  });

  describe('returns false for non-chunk errors', () => {
    it('returns false for null', () => {
      expect(isChunkLoadError(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isChunkLoadError(undefined)).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isChunkLoadError('')).toBe(false);
    });

    it('returns false for generic Error', () => {
      expect(isChunkLoadError(new Error('Something went wrong'))).toBe(false);
    });

    it('returns false for TypeError', () => {
      expect(isChunkLoadError(new TypeError('Cannot read properties of undefined'))).toBe(false);
    });

    it('returns false for network error without chunk context', () => {
      expect(isChunkLoadError(new TypeError('Failed to fetch'))).toBe(false);
    });

    it('returns false for auth error', () => {
      expect(isChunkLoadError(new Error('Token expired'))).toBe(false);
    });

    it('returns false for render error', () => {
      expect(isChunkLoadError(new Error('Objects are not valid as a React child'))).toBe(false);
    });

    it('returns false for number', () => {
      expect(isChunkLoadError(42)).toBe(false);
    });

    it('returns false for object without message', () => {
      expect(isChunkLoadError({ code: 'ERR_NETWORK' })).toBe(false);
    });

    it('returns false for error with non-ChunkLoadError name', () => {
      const error = new Error('some error');
      error.name = 'NetworkError';
      expect(isChunkLoadError(error)).toBe(false);
    });

    it('returns false for error with cause but wrong name', () => {
      const cause = new Error('cause');
      cause.name = 'NetworkError';
      const error = new Error('wrapper', { cause });
      expect(isChunkLoadError(error)).toBe(false);
    });
  });
});

describe('retryImport', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('resolves on first successful import', async () => {
    const mockResult = { default: () => null };
    const importFn = jest.fn().mockResolvedValue(mockResult);

    const result = await retryImport(importFn, 2, 1000);

    expect(result).toBe(mockResult);
    expect(importFn).toHaveBeenCalledTimes(1);
  });

  it('retries on chunk load error and succeeds on second attempt', async () => {
    const mockResult = { default: () => null };
    const chunkError = new Error('Loading chunk 123 failed.');
    const importFn = jest.fn().mockRejectedValueOnce(chunkError).mockResolvedValueOnce(mockResult);

    const resultPromise = retryImport(importFn, 2, 100);

    // First call fails immediately, wait for retry timer
    await jest.advanceTimersByTimeAsync(100);

    const result = await resultPromise;
    expect(result).toBe(mockResult);
    expect(importFn).toHaveBeenCalledTimes(2);
  });

  it('retries on CSS chunk error', async () => {
    const mockResult = { default: () => null };
    const cssChunkError = new Error('Loading CSS chunk 456 failed.');
    const importFn = jest.fn().mockRejectedValueOnce(cssChunkError).mockResolvedValueOnce(mockResult);

    const resultPromise = retryImport(importFn, 2, 100);
    await jest.advanceTimersByTimeAsync(100);

    const result = await resultPromise;
    expect(result).toBe(mockResult);
    expect(importFn).toHaveBeenCalledTimes(2);
  });

  it('does not retry on non-chunk errors', async () => {
    const genericError = new Error('Module not found');
    const importFn = jest.fn().mockRejectedValue(genericError);

    await expect(retryImport(importFn, 2, 100)).rejects.toThrow('Module not found');
    expect(importFn).toHaveBeenCalledTimes(1);
  });

  it('gives up after all retries exhausted', async () => {
    jest.useRealTimers();
    const chunkError = new Error('Loading chunk 123 failed.');
    const importFn = jest.fn().mockRejectedValue(chunkError);

    await expect(retryImport(importFn, 2, 10)).rejects.toThrow('Loading chunk 123 failed.');
    expect(importFn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });

  it('retries correct number of times with 0 retries', async () => {
    const chunkError = new Error('Loading chunk 123 failed.');
    const importFn = jest.fn().mockRejectedValue(chunkError);

    await expect(retryImport(importFn, 0, 100)).rejects.toThrow('Loading chunk 123 failed.');
    expect(importFn).toHaveBeenCalledTimes(1); // no retries
  });
});

describe('lazyWithRetry', () => {
  it('creates a React.lazy component', () => {
    const importFn = jest.fn().mockResolvedValue({ default: () => null });
    const LazyComponent = lazyWithRetry(importFn);

    // React.lazy returns an object with $$typeof Symbol
    expect(LazyComponent).toBeDefined();
    expect(typeof LazyComponent).toBe('object');
    expect(LazyComponent.$$typeof).toBeDefined();
  });

  it('uses default retry count of 2', () => {
    const importFn = jest.fn().mockResolvedValue({ default: () => null });
    // Just verify it creates without error with defaults
    const LazyComponent = lazyWithRetry(importFn);
    expect(LazyComponent).toBeDefined();
  });

  it('accepts custom retry and delay parameters', () => {
    const importFn = jest.fn().mockResolvedValue({ default: () => null });
    const LazyComponent = lazyWithRetry(importFn, 5, 2000);
    expect(LazyComponent).toBeDefined();
  });

  it('renders component after transient chunk failure via Suspense', async () => {
    jest.useRealTimers();
    const TestComponent = () => React.createElement('div', null, 'loaded-ok');
    const chunkError = new Error('Loading chunk xyz failed.');
    const importFn = jest.fn().mockRejectedValueOnce(chunkError).mockResolvedValueOnce({ default: TestComponent });

    const LazyComponent = lazyWithRetry(importFn, 2, 50);

    await act(async () => {
      render(React.createElement(Suspense, { fallback: React.createElement('div', null, 'loading...') }, React.createElement(LazyComponent, null)));
    });

    expect(await screen.findByText('loaded-ok')).toBeInTheDocument();
    expect(importFn).toHaveBeenCalledTimes(2);
  });
});
