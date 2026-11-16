import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useSegment } from '../../analytics/useSegment';
import { consoleSearch } from '../../utils/consoleSearch';
import { isHydraSearchEnabled } from '../../utils/hydraSearch';
import SearchInput, { REMOTE_SEARCH_DEBOUNCE_MS } from './SearchInput';

jest.mock('../../analytics/useSegment');
jest.mock('../../utils/consoleSearch', () => ({ consoleSearch: jest.fn() }));
jest.mock('../../utils/hydraSearch', () => ({ isHydraSearchEnabled: jest.fn() }));
jest.mock('../../state/atoms/localSearchAtom', () => {
  const { atom } = jest.requireActual('jotai');
  // Synchronous stand-in for the async Orama atom so the component does not suspend.
  return { asyncLocalOrama: atom({}) };
});
jest.mock('../ChromeLink', () => ({
  __esModule: true,
  default: ({ href, children, isExternal, ...props }: React.PropsWithChildren<{ href: string; isExternal?: boolean }>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

type Deferred = { resolve: (titles: string[]) => void };

const result = (title: string) => ({ id: title, title, description: `${title} description`, bundleTitle: 'Bundle', pathname: `/${title}` });

describe('SearchInput', () => {
  let pending: Deferred[];
  const track = jest.fn();

  beforeEach(() => {
    pending = [];
    track.mockReset();
    (useSegment as jest.Mock).mockReturnValue({ ready: true, analytics: { track } });
    (isHydraSearchEnabled as jest.Mock).mockReturnValue(false);
    (consoleSearch as jest.Mock).mockReset().mockImplementation(
      () =>
        new Promise((resolve) => {
          pending.push({ resolve: (titles) => resolve({ results: titles.map(result), source: 'hydra' }) });
        })
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const setup = () => {
    render(<SearchInput onStateChange={jest.fn()} />);
    fireEvent.click(screen.getByLabelText('Expandable search input toggle'));
    const input = screen.getByRole('textbox');
    // open the results menu
    fireEvent.keyDown(input, { key: 'a' });
    return input;
  };

  it('ignores a stale response that resolves after a newer one', async () => {
    const input = setup();
    fireEvent.change(input, { target: { value: 'inv' } });
    fireEvent.change(input, { target: { value: 'inventory' } });
    expect(consoleSearch).toHaveBeenCalledTimes(2);

    await act(async () => pending[1].resolve(['Newer']));
    await act(async () => pending[0].resolve(['Stale']));

    expect(screen.getByText('Newer')).toBeInTheDocument();
    expect(screen.queryByText('Stale')).not.toBeInTheDocument();
    // the first request was aborted when the second started
    expect((consoleSearch as jest.Mock).mock.calls[0][0].signal.aborted).toBe(true);
  });

  it('debounces remote queries when Hydra search is enabled', async () => {
    jest.useFakeTimers();
    (isHydraSearchEnabled as jest.Mock).mockReturnValue(true);
    const input = setup();
    fireEvent.change(input, { target: { value: 'i' } });
    fireEvent.change(input, { target: { value: 'in' } });
    fireEvent.change(input, { target: { value: 'inv' } });
    expect(consoleSearch).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(REMOTE_SEARCH_DEBOUNCE_MS);
    });
    expect(consoleSearch).toHaveBeenCalledTimes(1);
    expect(consoleSearch).toHaveBeenCalledWith(expect.objectContaining({ term: 'inv', type: 'services' }));

    await act(async () => pending[0].resolve(['Inventory']));
    expect(screen.getByText('Inventory')).toBeInTheDocument();
  });

  it('cancels a pending remote query when the input is collapsed', () => {
    jest.useFakeTimers();
    (isHydraSearchEnabled as jest.Mock).mockReturnValue(true);
    const input = setup();
    fireEvent.change(input, { target: { value: 'inv' } });
    fireEvent.click(screen.getByLabelText('Expandable search input toggle'));
    act(() => {
      jest.advanceTimersByTime(REMOTE_SEARCH_DEBOUNCE_MS * 2);
    });
    expect(consoleSearch).not.toHaveBeenCalled();
  });

  it('reports which backend answered in the search analytics event', async () => {
    jest.useFakeTimers();
    const input = setup();
    fireEvent.change(input, { target: { value: 'inv' } });
    await act(async () => pending[0].resolve(['Inventory']));
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(track).toHaveBeenCalledWith('chrome.search-query', { query: 'inv', source: 'hydra' });
  });

  it('shows the default state while nothing is typed', () => {
    setup();
    expect(screen.getByTestId('search-default-state')).toHaveTextContent('default state');
    expect(consoleSearch).not.toHaveBeenCalled();
  });

  it('opens the default state when the empty input is clicked, and keeps it open on further clicks', () => {
    const onStateChange = jest.fn();
    render(<SearchInput onStateChange={onStateChange} />);
    fireEvent.click(screen.getByLabelText('Expandable search input toggle'));
    // expanding alone does not open the menu
    expect(onStateChange).not.toHaveBeenCalledWith(true);

    fireEvent.click(screen.getByRole('textbox'));
    expect(screen.getByText('default state')).toBeInTheDocument();
    expect(onStateChange).toHaveBeenLastCalledWith(true);

    fireEvent.click(screen.getByRole('textbox'));
    expect(onStateChange).not.toHaveBeenCalledWith(false);
  });

  it('closes the menu when the input is collapsed', () => {
    const onStateChange = jest.fn();
    render(<SearchInput onStateChange={onStateChange} />);
    fireEvent.click(screen.getByLabelText('Expandable search input toggle'));
    fireEvent.click(screen.getByRole('textbox'));
    expect(onStateChange).toHaveBeenLastCalledWith(true);

    fireEvent.click(screen.getByLabelText('Expandable search input toggle'));
    expect(onStateChange).toHaveBeenLastCalledWith(false);
  });

  it('shows a spinner only until the first results arrive', async () => {
    const input = setup();
    fireEvent.change(input, { target: { value: 'inv' } });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByText('default state')).not.toBeInTheDocument();

    await act(async () => pending[0].resolve(['Inventory']));
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByText('Inventory')).toBeInTheDocument();
  });

  it('keeps the last results on screen while the next query is in flight', async () => {
    const input = setup();
    fireEvent.change(input, { target: { value: 'inv' } });
    await act(async () => pending[0].resolve(['Inventory']));

    fireEvent.change(input, { target: { value: 'inventory sys' } });
    expect(screen.getByText('Inventory')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();

    await act(async () => pending[1].resolve(['Systems']));
    expect(screen.getByText('Systems')).toBeInTheDocument();
    expect(screen.queryByText('Inventory')).not.toBeInTheDocument();
  });

  it('keeps the last results when a later query fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const input = setup();
    fireEvent.change(input, { target: { value: 'inv' } });
    await act(async () => pending[0].resolve(['Inventory']));

    (consoleSearch as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    await act(async () => {
      fireEvent.change(input, { target: { value: 'invx' } });
    });
    expect(console.error).toHaveBeenCalled();
    expect(screen.getByText('Inventory')).toBeInTheDocument();
  });

  it('shows the empty state for a successful search without results', async () => {
    const input = setup();
    fireEvent.change(input, { target: { value: 'zzz' } });
    await act(async () => pending[0].resolve([]));
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByText('default state')).not.toBeInTheDocument();
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('returns to the default state and drops old results when the input is emptied', async () => {
    const input = setup();
    fireEvent.change(input, { target: { value: 'inv' } });
    await act(async () => pending[0].resolve(['Inventory']));

    fireEvent.change(input, { target: { value: '' } });
    expect(screen.getByText('default state')).toBeInTheDocument();
    expect(screen.queryByText('Inventory')).not.toBeInTheDocument();
    expect(consoleSearch).toHaveBeenCalledTimes(1);

    // a new query starts fresh instead of showing results for the old one
    fireEvent.change(input, { target: { value: 'cost' } });
    expect(screen.queryByText('Inventory')).not.toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows the empty state when the search fails unexpectedly', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    (consoleSearch as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    const input = setup();
    await act(async () => {
      fireEvent.change(input, { target: { value: 'inv' } });
    });
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(console.error).toHaveBeenCalled();
  });
});
