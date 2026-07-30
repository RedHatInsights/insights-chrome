import { renderHook } from '@testing-library/react';
import useFavoritedServices from './useFavoritedServices';
import { LIGHTWELL_PATH } from '../utils/common';

// Mock dependencies
jest.mock('./useFavoritePagesWrapper');
jest.mock('./useAllServices');
jest.mock('./useAllLinks');
jest.mock('../state/atoms/visibleBundlesAtom');

import useFavoritePagesWrapper from './useFavoritePagesWrapper';
import useAllServices from './useAllServices';
import useAllLinks from './useAllLinks';
import { useVisibleBundles } from '../state/atoms/visibleBundlesAtom';

const mockUseFavoritePagesWrapper = useFavoritePagesWrapper as jest.MockedFunction<typeof useFavoritePagesWrapper>;
const mockUseAllServices = useAllServices as jest.MockedFunction<typeof useAllServices>;
const mockUseAllLinks = useAllLinks as jest.MockedFunction<typeof useAllLinks>;
const mockUseVisibleBundles = useVisibleBundles as jest.MockedFunction<typeof useVisibleBundles>;

const setupMocks = ({
  favoritePages = [],
  availableSections = [],
  allLinks = [],
  bundles = [],
}: {
  favoritePages?: Array<{ pathname: string; favorite: boolean }>;
  availableSections?: Array<{ id: string; title: string; links: Array<{ href: string; title: string }> }>;
  allLinks?: Array<{ href: string; title: string; isExternal?: boolean; description?: string }>;
  bundles?: Array<unknown>;
} = {}) => {
  mockUseFavoritePagesWrapper.mockReturnValue({
    favoritePages,
    favoritePage: jest.fn(),
    unfavoritePage: jest.fn(),
    initialized: true,
  } as ReturnType<typeof useFavoritePagesWrapper>);
  mockUseAllServices.mockReturnValue({
    availableSections,
    linkSections: availableSections,
    ready: true,
    error: false,
    filterValue: '',
    setFilterValue: jest.fn(),
  } as ReturnType<typeof useAllServices>);
  mockUseAllLinks.mockReturnValue(allLinks as ReturnType<typeof useAllLinks>);
  mockUseVisibleBundles.mockReturnValue(bundles as ReturnType<typeof useVisibleBundles>);
};

describe('useFavoritedServices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty array when no favorites exist', () => {
    setupMocks();
    const { result } = renderHook(() => useFavoritedServices());
    expect(result.current).toEqual([]);
  });

  it('should return favorited service that exists in allLinks', () => {
    setupMocks({
      favoritePages: [{ pathname: '/insights/advisor', favorite: true }],
      allLinks: [{ href: '/insights/advisor', title: 'Advisor' }],
    });
    const { result } = renderHook(() => useFavoritedServices());
    expect(result.current).toHaveLength(1);
    expect(result.current[0].pathname).toBe('/insights/advisor');
    expect(result.current[0].name).toContain('Advisor');
  });

  it('should return Lightwell favorite when /lightwell is favorited', () => {
    setupMocks({
      favoritePages: [{ pathname: LIGHTWELL_PATH, favorite: true }],
      allLinks: [],
      availableSections: [],
    });
    const { result } = renderHook(() => useFavoritedServices());
    expect(result.current).toHaveLength(1);
    expect(result.current[0].pathname).toBe(LIGHTWELL_PATH);
    expect(result.current[0].name).toContain('Lightwell');
  });

  it('should not duplicate Lightwell if already present in links', () => {
    setupMocks({
      favoritePages: [{ pathname: LIGHTWELL_PATH, favorite: true }],
      allLinks: [{ href: LIGHTWELL_PATH, title: 'Lightwell Custom' }],
    });
    const { result } = renderHook(() => useFavoritedServices());
    expect(result.current).toHaveLength(1);
    expect(result.current[0].name).toContain('Lightwell Custom');
  });

  it('should exclude non-favorite pages', () => {
    setupMocks({
      favoritePages: [{ pathname: '/insights/advisor', favorite: false }],
      allLinks: [{ href: '/insights/advisor', title: 'Advisor' }],
    });
    const { result } = renderHook(() => useFavoritedServices());
    expect(result.current).toEqual([]);
  });

  it('should exclude external links from favorites', () => {
    setupMocks({
      favoritePages: [{ pathname: 'https://example.com', favorite: true }],
      allLinks: [{ href: 'https://example.com', title: 'External', isExternal: true }],
    });
    const { result } = renderHook(() => useFavoritedServices());
    expect(result.current).toEqual([]);
  });
});
