import {
  onGetAllSIDs,
  onGetAllSIDsPending,
  onGetAllTags,
  onGetAllTagsPending,
  onGetAllWorkloads,
  onGetAllWorkloadsPending,
  onGlobalFilterToggle,
  onSetGlobalFilterScope,
  onTagSelect,
} from './globalFilterReducers';
import { toggleGlobalFilter } from './actions';

describe('onGetAllTags', () => {
  it('should format tags from an API', () => {
    const {
      tags: { items },
    } = onGetAllTags(
      {},
      {
        payload: {
          results: [
            {
              tag: {
                namespace: 'something',
                key: 'someKey',
                value: 'some value',
                count: 10,
              },
            },
          ],
        },
      }
    );
    expect(items).toMatchObject([
      {
        name: 'something',
        tags: [
          {
            tag: {
              count: 10,
              key: 'someKey',
              namespace: 'something',
              value: 'some value',
            },
          },
        ],
      },
    ]);
  });

  it('should not fail with no payload', () => {
    const {
      tags: { items },
    } = onGetAllTags({}, {});
    expect(items).toMatchObject([]);
  });

  it('should not fail with no results', () => {
    const {
      tags: { items },
    } = onGetAllTags({}, { payload: {} });
    expect(items).toMatchObject([]);
  });

  it('should set all meta data', () => {
    const {
      tags: { page, perPage, total, count, isLoaded },
    } = onGetAllTags(
      {},
      {
        payload: {
          // eslint-disable-next-line camelcase
          per_page: 10,
          page: 1,
          total: 100,
          count: 10,
        },
      }
    );
    expect(page).toBe(1);
    expect(perPage).toBe(10);
    expect(total).toBe(100);
    expect(count).toBe(10);
    expect(isLoaded).toBe(true);
  });
});

describe('onGetAllTagsPending', () => {
  it('should set loading state', () => {
    const { tags } = onGetAllTagsPending({
      tags: {
        some: {
          value: 'val',
        },
      },
    });
    expect(tags).toMatchObject({ isLoaded: false });
  });
});

describe('onSetGlobalFilterScope', () => {
  it('should set scope', () => {
    expect(onSetGlobalFilterScope({}, { payload: 'someScope' })).toMatchObject({ scope: 'someScope' });
  });
});

describe('onGlobalFilterToggle', () => {
  it('should hide global filter', () => {
    const state = onGlobalFilterToggle(
      {
        someState: {},
      },
      toggleGlobalFilter()
    );
    expect(state).toEqual({
      someState: {},
      globalFilterHidden: true,
    });
  });

  it('should show global filter', () => {
    const state = onGlobalFilterToggle(
      {
        someState: {},
      },
      toggleGlobalFilter(false)
    );
    expect(state).toEqual({
      someState: {},
      globalFilterHidden: false,
    });
  });
});

describe('onTagSelect', () => {
  it('should select tag', () => {
    expect(onTagSelect({}, { payload: 'selected' })).toMatchObject({ selectedTags: 'selected' });
  });
});

describe('onGetAllSIDs', () => {
  it('should format SIDs from an API', () => {
    const {
      sid: { items },
    } = onGetAllSIDs(
      {},
      {
        payload: {
          results: [
            {
              value: 'something',
              count: 10,
            },
          ],
          total: 1,
        },
      }
    );
    expect(items).toMatchObject([
      {
        name: 'SAP ID (SID)',
        tags: [
          {
            tag: { key: 'something', namespace: 'SAP ID (SID)' },
            count: 10,
          },
        ],
      },
    ]);
  });

  it('should not fail with no payload', () => {
    const {
      sid: { items },
    } = onGetAllSIDs({}, {});
    expect(items).toBe(undefined);
  });

  it('should not fail with no results', () => {
    const {
      sid: { items },
    } = onGetAllSIDs({}, { payload: {} });
    expect(items).toBe(undefined);
  });

  it('should set all meta data', () => {
    const {
      sid: { page, perPage, total, count, isLoaded },
    } = onGetAllSIDs(
      {},
      {
        payload: {
          // eslint-disable-next-line camelcase
          per_page: 10,
          page: 1,
          total: 100,
          count: 10,
        },
      }
    );
    expect(page).toBe(1);
    expect(perPage).toBe(10);
    expect(total).toBe(100);
    expect(count).toBe(10);
    expect(isLoaded).toBe(true);
  });
});

describe('onGetAllSIDsPending', () => {
  it('should set loading state', () => {
    const { sid } = onGetAllSIDsPending({
      sid: {
        some: {
          value: 'val',
        },
      },
    });
    expect(sid).toMatchObject({ isLoaded: false });
  });
});

describe('onGetAllWorkloads', () => {
  it('should format workloads from an API', () => {
    const { workloads } = onGetAllWorkloads(
      {},
      {
        payload: {
          SAP: {
            results: [
              {
                value: true,
                count: 10,
              },
            ],
          },
          AAP: {
            total: 5,
          },
          MSSQL: {
            total: 5,
          },
        },
      }
    );
    expect(workloads.tags[0].count).toBe(10);
    expect(workloads.tags[1].count).toBe(5);
    expect(workloads.tags[2].count).toBe(5);
  });
});

describe('onGetAllWorkloadsPending', () => {
  it('should set loading state', () => {
    const { workloads } = onGetAllWorkloadsPending({
      workloads: {
        some: {
          value: 'val',
        },
      },
    });
    expect(workloads).toMatchObject({ isLoaded: false });
  });
});
