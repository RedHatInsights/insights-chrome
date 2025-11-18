/* eslint-disable @typescript-eslint/no-unused-expressions */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SearchFeedback, { SEARCH_FEEDBACK_NEGATIVE, SEARCH_FEEDBACK_POSITIVE } from './SearchFeedback';
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
    const track = jest.fn(() => Promise.resolve());
    const onFeedbackSubmitted = jest.fn();
    (useSegment as jest.Mock).mockImplementation(() => ({
      ready: true,
      analytics: {
        track,
      },
    }));
    render(<SearchFeedback query={query} results={results} onFeedbackSubmitted={onFeedbackSubmitted} />);
    const thumbsUpButton = screen.getAllByRole('menuitem')[0];
    await waitFor(() => {
      fireEvent.click(thumbsUpButton);
    });
    expect(useSegment).toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith(SEARCH_FEEDBACK_POSITIVE, { query, results });
    waitFor(() => {
      !!screen.getAllByText('Thank you for your feedback!')[0];
    });
    expect(onFeedbackSubmitted).toHaveBeenCalledWith(SEARCH_FEEDBACK_POSITIVE);
  });

  it('should call trackFeedback() on click when analytics ready - negative feedback', async () => {
    const track = jest.fn(() => Promise.resolve());
    const onFeedbackSubmitted = jest.fn();
    (useSegment as jest.Mock).mockImplementation(() => ({
      ready: true,
      analytics: {
        track,
      },
    }));
    render(<SearchFeedback query={query} results={results} onFeedbackSubmitted={onFeedbackSubmitted} />);
    const thumbsDownButton = screen.getAllByRole('menuitem')[1];
    await waitFor(() => {
      fireEvent.click(thumbsDownButton);
    });
    expect(useSegment).toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith(SEARCH_FEEDBACK_NEGATIVE, { query, results });
    waitFor(() => {
      !!screen.getAllByText('Thank you for your feedback!')[0];
    });
    expect(onFeedbackSubmitted).toHaveBeenCalledWith(SEARCH_FEEDBACK_NEGATIVE);
  });

  it('should throttle trackFeedback() calls for many consecutive clicks', async () => {
    const track = jest.fn(() => Promise.resolve());
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
    expect(track).toHaveBeenCalledWith(SEARCH_FEEDBACK_POSITIVE, { query, results });
    expect(track.mock.calls.length).toEqual(1);
  });

  it('should disable buttons and display message if feedback already submitted for query', async () => {
    const track = jest.fn(() => Promise.resolve());
    (useSegment as jest.Mock).mockImplementation(() => ({
      ready: true,
      analytics: {
        track,
      },
    }));
    render(<SearchFeedback query={query} results={results} feedbackType={SEARCH_FEEDBACK_POSITIVE} />);
    const thumbsUpButton = screen.getAllByRole('menuitem')[0];
    expect(thumbsUpButton).toBeDisabled();
    await Promise.all([
      waitFor(() => {
        fireEvent.click(thumbsUpButton);
      }),
    ]);
    expect(track).not.toHaveBeenCalled();
    expect(screen.getAllByText('Thank you for your feedback!')[0]).toBeDefined();
  });

  it('should display error message if submitting feedback fails', async () => {
    const track = jest.fn(() => Promise.reject());
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
    ]);
    expect(track).toHaveBeenCalledWith(SEARCH_FEEDBACK_POSITIVE, { query, results });
    waitFor(() => {
      !!screen.getAllByText('Something went wrong. Please try again.')[0];
    });
  });
});
