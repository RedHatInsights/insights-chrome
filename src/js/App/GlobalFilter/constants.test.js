import { flatTags, updateSelected, storeFilter, createTagsFilter } from './constants';
const setItem = jest.fn();
const getItem = jest.fn();
Object.defineProperty(window, 'localStorage', {
  value: {
    setItem,
    getItem,
  },
});

describe('flatTags', () => {
  const globalFilter = {
    Workloads: {
      SAP: { isSelected: true },
    },
    'SAP ID (SID)': {
      SOMEVAL: { isSelected: true },
    },
    someTag: {
      someKey: {
        isSelected: true,
        value: '[someValue]',
      },
    },
    anotherTag: {
      key: {
        isSelected: false,
        value: 'someValue',
      },
    },
  };

  it('should create flat array of global filter', () => {
    const data = flatTags(globalFilter);
    expect(data.length).toBe(2);
    expect(data).toMatchObject(['someTag/someKey=[someValue]', 'Workloads/SAP']);
  });

  it('no data', () => {
    const data = flatTags({});
    expect(data.length).toBe(0);
    expect(data).toMatchObject([]);
  });

  it('with encode enabled', () => {
    const data = flatTags(globalFilter, true);
    expect(data.length).toBe(2);
    expect(data).toMatchObject(['someTag/someKey=%5BsomeValue%5D', 'Workloads/SAP']);
  });

  it('should return multiple values', () => {
    const [workloads, SID, tags] = flatTags(globalFilter, false, true);
    expect(tags.length).toBe(1);
    expect(tags).toMatchObject(['someTag/someKey=[someValue]']);
    expect(workloads.SAP.isSelected).toBe(true);
    expect(SID).toMatchObject(['SOMEVAL']);
  });
});

describe('updateSelected', () => {
  it('should select correct item', () => {
    const data = updateSelected(
      {
        namespace: {
          key2: {
            isSelected: false,
            value: 'something',
          },
        },
      },
      'namespace',
      'key',
      'value',
      true
    );
    expect(data).toMatchObject({
      namespace: {
        key2: {
          isSelected: false,
          value: 'something',
        },
        key: {
          value: 'value',
          isSelected: true,
        },
      },
    });
  });
});

describe('storeFilter', () => {
  it('should call correct localStorage', () => {
    storeFilter({
      someTag: {
        someKey: {
          isSelected: true,
          item: {
            value: 'some value',
          },
          group: {
            items: ['something'],
            groupValue: 'something else',
          },
        },
        key: {
          isSelected: true,
          value: 'some value',
          group: {
            items: ['something'],
            groupValue: 'something else',
          },
        },
        key2: {
          isSelected: true,
          value: 'some value',
          group: {
            items: ['something'],
            groupValue: 'something else',
          },
        },
      },
    });
    expect(setItem).toHaveBeenCalled();
    const [key, value] = setItem.mock.calls[0];
    expect(value).toBe(
      // eslint-disable-next-line max-len
      '{"someTag":{"someKey":{"isSelected":true,"item":{"tagKey":"someKey"},"group":{"groupValue":"something else"}},"key":{"isSelected":true,"item":{"tagValue":"some value","tagKey":"key"},"group":{"groupValue":"something else"}},"key2":{"isSelected":true,"item":{"tagValue":"some value","tagKey":"key2"},"group":{"groupValue":"something else"}}}}'
    );
    expect(key).toBe('chrome:global-filter/undefined');
  });

  describe('global hash', () => {
    it('should add workloads and empty SID', () => {
      storeFilter({
        Workloads: {
          something: {
            isSelected: true,
          },
        },
      });
      expect(location.hash).toBe('#workloads=something&SIDs=&tags=');
    });

    it('should add SIDs', () => {
      storeFilter({
        'SAP ID (SID)': {
          something: {
            isSelected: true,
          },
        },
      });
      expect(location.hash).toBe('#SIDs=something&tags=');
    });

    it('should add tags', () => {
      storeFilter({
        bridges: {
          porter: {
            isSelected: true,
            item: { tagValue: 'sam' },
          },
        },
        fragile: {
          tag: {
            isSelected: true,
            item: { tagValue: 'sam' },
          },
          tag2: {
            isSelected: true,
            item: { tagValue: 'sam' },
          },
        },
      });
      expect(location.hash).toBe('#SIDs=&tags=bridges%2Fporter%3Dsam%2Cfragile%2Ftag%3Dsam%2Cfragile%2Ftag2%3Dsam');
    });

    it('should build complex hash', () => {
      storeFilter({
        Workloads: {
          something: {
            isSelected: true,
          },
        },
        'SAP ID (SID)': {
          something: {
            isSelected: true,
          },
        },
        bridges: {
          porter: {
            isSelected: true,
            item: { tagValue: 'sam' },
          },
        },
        fragile: {
          tag: {
            isSelected: true,
            item: { tagValue: 'sam' },
          },
          tag2: {
            isSelected: true,
            item: { tagValue: 'sam' },
          },
        },
      });
      expect(location.hash).toBe('#workloads=something&SIDs=something&tags=bridges%2Fporter%3Dsam%2Cfragile%2Ftag%3Dsam%2Cfragile%2Ftag2%3Dsam');
    });
  });

  it('should create filter', () => {
    const value = createTagsFilter(['some', 'namespace/key', 'namespace/tag=value', 'null/another=val']);
    expect(value).toMatchObject({
      some: {},
      namespace: {
        key: {
          isSelected: true,
          group: {
            type: 'checkbox',
            value: 'namespace',
            label: 'namespace',
          },
          item: {},
        },
        'tag=value': {
          isSelected: true,
          group: {},
          item: {
            tagValue: 'value',
            tagKey: 'tag',
          },
        },
      },
      null: {
        'another=val': {
          isSelected: true,
          item: {
            tagKey: 'another',
            tagValue: 'val',
          },
        },
      },
    });
  });
});
