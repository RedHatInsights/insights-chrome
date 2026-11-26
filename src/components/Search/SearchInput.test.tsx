import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PrimitiveAtom, Provider, createStore } from 'jotai';
import { ReleaseEnv } from '@redhat-cloud-services/types/index.js';
import SearchInput from './SearchInput';
import { SearchResultItem, localQuery } from '../../utils/localSearch';

jest.mock('../../analytics/useSegment', () => ({ useSegment: () => ({ ready: false }) }));
jest.mock('../../hooks/useWindowWidth', () => ({ __esModule: true, default: () => ({ md: true }) }));
jest.mock('../../utils/localSearch', () => ({ localQuery: jest.fn() }));
jest.mock('./EmptySearchState', () => ({ __esModule: true, default: () => <div>No results found</div> }));
jest.mock('./SearchFeedback', () => ({ __esModule: true, default: () => null }));
jest.mock('../ChromeLink', () => ({
  __esModule: true,
  default: (props: React.ComponentProps<'a'>) => <a {...props} />,
}));
// Index contents have atom and browser coverage. Distinct tokens isolate the
// component's query lifecycle without rebuilding Orama in these tests.
jest.mock('../../state/atoms/localSearchAtom', () => {
  const { atom } = jest.requireActual('jotai');
  return { asyncLocalOrama: atom({}) };
});
const { asyncLocalOrama: indexAtom } = jest.requireMock<{ asyncLocalOrama: PrimitiveAtom<object> }>('../../state/atoms/localSearchAtom');

const englishResult: SearchResultItem = { id: 'users', title: 'Users', description: 'Manage users', pathname: '/iam/users', bundleTitle: 'IAM' };
const frenchResult: SearchResultItem = { ...englishResult, title: 'Utilisateurs', description: 'Gérer les utilisateurs' };

beforeEach(() => jest.mocked(localQuery).mockReset());

function mountSearch() {
  const store = createStore();
  const index = store.get(indexAtom);
  const view = render(
    <Provider store={store}>
      <SearchInput onStateChange={jest.fn()} />
    </Provider>
  );
  fireEvent.click(screen.getByRole('button', { name: 'Expandable search input toggle' }));
  const input = screen.getByPlaceholderText('Search for services');
  fireEvent.keyDown(input, { key: 'P' });
  return { store, index, input, ...view };
}

it('reruns an open query for a new locale index and ignores the late previous-index response', async () => {
  let resolveEnglish!: (results: SearchResultItem[]) => void;
  const oldQuery = new Promise<SearchResultItem[]>((resolve) => {
    resolveEnglish = resolve;
  });
  jest.mocked(localQuery).mockReturnValueOnce(oldQuery).mockResolvedValueOnce([frenchResult]).mockResolvedValueOnce([englishResult]);
  const { store, index: englishIndex, input } = mountSearch();
  fireEvent.change(input, { target: { value: 'People' } });
  expect(localQuery).toHaveBeenCalledWith(englishIndex, 'People', ReleaseEnv.STABLE, 'services');

  const frenchIndex = {};
  act(() => store.set(indexAtom, frenchIndex));
  expect(await screen.findByText('Utilisateurs')).toBeVisible();
  expect(localQuery).toHaveBeenLastCalledWith(frenchIndex, 'People', ReleaseEnv.STABLE, 'services');
  await act(async () => {
    resolveEnglish([englishResult]);
    await oldQuery;
  });
  expect(screen.getByText('Utilisateurs')).toBeVisible();
  expect(screen.queryByText('Users')).not.toBeInTheDocument();

  act(() => store.set(indexAtom, englishIndex));
  expect(await screen.findByText('Users')).toBeVisible();
  expect(screen.queryByText('Utilisateurs')).not.toBeInTheDocument();
  expect(localQuery).toHaveBeenLastCalledWith(englishIndex, 'People', ReleaseEnv.STABLE, 'services');
  expect(localQuery).toHaveBeenCalledTimes(3);
  expect(screen.getByRole('menuitem', { name: /Users/ })).toHaveAttribute('href', englishResult.pathname);
});

it('clears results without querying the empty term or allowing an obsolete query to repopulate them', async () => {
  let resolveOld!: (results: SearchResultItem[]) => void;
  const oldQuery = new Promise<SearchResultItem[]>((resolve) => {
    resolveOld = resolve;
  });
  jest.mocked(localQuery).mockResolvedValueOnce([englishResult]).mockReturnValueOnce(oldQuery);
  const { input } = mountSearch();
  expect(localQuery).not.toHaveBeenCalled();
  fireEvent.change(input, { target: { value: 'People' } });
  expect(await screen.findByText('Users')).toBeVisible();
  fireEvent.change(input, { target: { value: 'Old query' } });
  await waitFor(() => expect(localQuery).toHaveBeenCalledTimes(2));
  fireEvent.change(input, { target: { value: '' } });
  expect(await screen.findByText('No results found')).toBeVisible();
  await act(async () => {
    resolveOld([englishResult]);
    await oldQuery;
  });
  expect(screen.queryByText('Users')).not.toBeInTheDocument();
  expect(localQuery).toHaveBeenCalledTimes(2);
});
