import type { ChromeSearchAPI } from '@redhat-cloud-services/types';
import { searchAPI } from '../utils/searchAPI';

/**
 * Hook that exposes the Chrome search API for remote consumption via Module Federation.
 */
const useSearch = (): ChromeSearchAPI => {
  return searchAPI;
};

export default useSearch;
