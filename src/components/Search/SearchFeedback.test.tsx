import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SearchFeedback from './SearchFeedback';
import { SearchItem } from './SearchTypes';
import { useSegment } from '../../analytics/useSegment';

jest.mock('../../analytics/useSegment');

describe('SearchFeedback', () => {
  let results: SearchItem[];
  let query: string;

  beforeEach(() => {
    results = [
      {
        title: 'foo',
        bundleTitle: 'foobundle',
        description: 'Foo service',
        pathname: '/foo/bar',
      },
    ];
    query = 'foo';
    (useSegment as jest.Mock).mockImplementation(() => ({
      ready: false,
      analytics: undefined,
    }));
  });

  it('should render correctly', () => {
    render(<SearchFeedback query={query} results={results} />);
    expect(useSegment).toHaveBeenCalled();
    expect(screen.getAllByRole('menuitem').length).toBe(2);
  });

  it('should handle analytics not ready on click', async () => {
    render(<SearchFeedback query={query} results={results} />);
    const thumbsUpButton = screen.getAllByRole('menuitem')[0];
    await waitFor(() => {
      fireEvent.click(thumbsUpButton);
    });
    expect(useSegment).toHaveBeenCalled();
  });

  it('should handle analytics object undefined on click', async () => {
    (useSegment as jest.Mock).mockImplementation(() => ({
      ready: true,
      analytics: undefined,
    }));
    render(<SearchFeedback query={query} results={results} />);
    const thumbsUpButton = screen.getAllByRole('menuitem')[0];
    await waitFor(() => {
      fireEvent.click(thumbsUpButton);
    });
    expect(useSegment).toHaveBeenCalled();
  });

  it('should call trackFeedback() on click when analytics ready - positive feedback', async () => {
    const track = jest.fn();
    (useSegment as jest.Mock).mockImplementation(() => ({
      ready: true,
      analytics: {
        track,
      },
    }));
    render(<SearchFeedback query={query} results={results} />);
    const thumbsUpButton = screen.getAllByRole('menuitem')[0];
    await waitFor(() => {
      fireEvent.click(thumbsUpButton);
    });
    expect(useSegment).toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith('chrome.search-query-feedback-positive', { query, results });
  });

  it('should call trackFeedback() on click when analytics ready - negative feedback', async () => {
    const track = jest.fn();
    (useSegment as jest.Mock).mockImplementation(() => ({
      ready: true,
      analytics: {
        track,
      },
    }));
    render(<SearchFeedback query={query} results={results} />);
    const thumbsDownButton = screen.getAllByRole('menuitem')[1];
    await waitFor(() => {
      fireEvent.click(thumbsDownButton);
    });
    expect(useSegment).toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith('chrome.search-query-feedback-negative', { query, results });
  });

  it('should throttle trackFeedback() calls for many consecutive clicks', async () => {
    const track = jest.fn();
    (useSegment as jest.Mock).mockImplementation(() => ({
      ready: true,
      analytics: {
        track,
      },
    }));
    render(<SearchFeedback query={query} results={results} />);
    const thumbsUpButton = screen.getAllByRole('menuitem')[0];
    await Promise.all([
      waitFor(() => {
        fireEvent.click(thumbsUpButton);
      }),
      waitFor(() => {
        fireEvent.click(thumbsUpButton);
      }),
    ]);
    expect(useSegment).toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith('chrome.search-query-feedback-positive', { query, results });
    expect(track.mock.calls.length).toEqual(1);
  });
});
