import { FlagTagsFilter } from '../../@types/types';

/**
 * Determines the initial filter state based on URL parameters or persisted sessionStorage value.
 * URL parameters take priority to support deep linking.
 *
 * @param urlFilter - Filter object parsed from URL hash parameters
 * @param persistedValue - Filter value persisted in sessionStorage
 * @returns The filter state to initialize with
 */
export const getInitialFilterState = (urlFilter: FlagTagsFilter, persistedValue: FlagTagsFilter): FlagTagsFilter => {
  // Check if URL has actual selections (not just empty objects)
  const hasUrlParams = Object.keys(urlFilter).some((key) => {
    const value = urlFilter[key];
    return value && typeof value === 'object' && Object.keys(value).length > 0;
  });

  if (hasUrlParams) {
    // URL params exist with actual selections - use them (for deep linking)
    return urlFilter;
  } else {
    // No URL params with selections - use persisted sessionStorage value
    return persistedValue;
  }
};
