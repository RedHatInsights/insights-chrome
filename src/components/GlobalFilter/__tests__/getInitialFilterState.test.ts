import { getInitialFilterState } from '../getInitialFilterState';
import { FlagTagsFilter } from '../../../@types/types';

describe('getInitialFilterState', () => {
  it('should return persisted value when URL filter is empty', () => {
    const urlFilter: FlagTagsFilter = {};
    const persistedValue: FlagTagsFilter = {
      Workloads: {
        SAP: true,
      },
    };

    const result = getInitialFilterState(urlFilter, persistedValue);
    expect(result).toBe(persistedValue);
  });

  it('should return persisted value when URL filter has only empty objects', () => {
    const urlFilter: FlagTagsFilter = {
      Workloads: {},
    };
    const persistedValue: FlagTagsFilter = {
      Workloads: {
        SAP: true,
      },
    };

    const result = getInitialFilterState(urlFilter, persistedValue);
    expect(result).toBe(persistedValue);
  });

  it('should return URL filter when it has actual selections', () => {
    const urlFilter: FlagTagsFilter = {
      Workloads: {
        SAP: true,
      },
    };
    const persistedValue: FlagTagsFilter = {
      Workloads: {
        AAP: true,
      },
    };

    const result = getInitialFilterState(urlFilter, persistedValue);
    expect(result).toBe(urlFilter);
  });

  it('should prioritize URL filter over persisted value when both exist', () => {
    const urlFilter: FlagTagsFilter = {
      Workloads: {
        SAP: true,
      },
    };
    const persistedValue: FlagTagsFilter = {
      Workloads: {
        AAP: true,
      },
      'SAP IDs (SID)': {
        HXE: true,
      },
    };

    const result = getInitialFilterState(urlFilter, persistedValue);
    expect(result).toBe(urlFilter);
  });

  it('should return empty persisted value when both URL and persisted are empty', () => {
    const urlFilter: FlagTagsFilter = {};
    const persistedValue: FlagTagsFilter = {};

    const result = getInitialFilterState(urlFilter, persistedValue);
    expect(result).toBe(persistedValue);
  });

  it('should handle multiple namespaces in URL filter', () => {
    const urlFilter: FlagTagsFilter = {
      Workloads: {
        SAP: true,
      },
      'SAP IDs (SID)': {
        HXE: true,
      },
    };
    const persistedValue: FlagTagsFilter = {};

    const result = getInitialFilterState(urlFilter, persistedValue);
    expect(result).toBe(urlFilter);
  });

  it('should return persisted value when URL filter has multiple empty namespaces', () => {
    const urlFilter: FlagTagsFilter = {
      Workloads: {},
      'SAP IDs (SID)': {},
      Tags: {},
    };
    const persistedValue: FlagTagsFilter = {
      Workloads: {
        SAP: true,
      },
    };

    const result = getInitialFilterState(urlFilter, persistedValue);
    expect(result).toBe(persistedValue);
  });

  it('should return URL filter when only one namespace has selections', () => {
    const urlFilter: FlagTagsFilter = {
      Workloads: {},
      'SAP IDs (SID)': {
        HXE: true,
      },
    };
    const persistedValue: FlagTagsFilter = {
      Workloads: {
        SAP: true,
      },
    };

    const result = getInitialFilterState(urlFilter, persistedValue);
    expect(result).toBe(urlFilter);
  });
});
