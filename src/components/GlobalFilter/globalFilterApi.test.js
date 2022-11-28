import { createTagsFilter, escaper, flatTags, updateSelected } from './globalFilterApi';
import { storeFilter } from './filterApi';
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
    'someTag/slash': {
      someKey: {
        isSelected: true,
        value: '[someValue=value]',
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
    expect(data).toMatchObject(['someTag%2Fslash/someKey=[someValue%3Dvalue]', 'Workloads/SAP']);
  });

  it('no data', () => {
    const data = flatTags({});
    expect(data.length).toBe(0);
    expect(data).toMatchObject([]);
  });

  it('with encode enabled', () => {
    const data = flatTags(globalFilter, true);
    expect(data.length).toBe(2);
    expect(data).toMatchObject(['someTag%252Fslash/someKey=%5BsomeValue%253Dvalue%5D', 'Workloads/SAP']);
  });

  it('should return multiple values', () => {
    const [workloads, SID, tags] = flatTags(globalFilter, false, true);
    expect(tags.length).toBe(1);
    expect(tags).toMatchObject(['someTag%2Fslash/someKey=[someValue%3Dvalue]']);
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
  describe('global hash', () => {
    it('should add workloads and empty SID', (done) => {
      expect.assertions(1);
      const navigate = jest.fn();
      storeFilter(
        {
          Workloads: {
            something: {
              isSelected: true,
            },
          },
        },
        true,
        navigate
      );
      setTimeout(() => {
        expect(navigate).toHaveBeenCalledWith({ hash: 'workloads=something&SIDs=&tags=', pathname: '/', search: '' });
        done();
      });
    });

    it('should add SIDs', (done) => {
      expect.assertions(1);
      const navigate = jest.fn();
      storeFilter(
        {
          'SAP ID (SID)': {
            something: {
              isSelected: true,
            },
          },
        },
        true,
        navigate
      );
      setTimeout(() => {
        expect(navigate).toHaveBeenCalledWith({ hash: 'SIDs=something&tags=', pathname: '/', search: '' });
        done();
      });
    });

    it('should add tags', (done) => {
      expect.assertions(1);
      const navigate = jest.fn();
      storeFilter(
        {
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
        },
        true,
        navigate
      );
      setTimeout(() => {
        expect(navigate).toHaveBeenCalledWith({
          hash: 'SIDs=&tags=bridges%2Fporter%3Dsam%2Cfragile%2Ftag%3Dsam%2Cfragile%2Ftag2%3Dsam',
          pathname: '/',
          search: '',
        });
        done();
      });
    });

    it('should build complex hash', (done) => {
      expect.assertions(1);
      const navigate = jest.fn();
      storeFilter(
        {
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
        },
        true,
        navigate
      );
      setTimeout(() => {
        expect(navigate).toHaveBeenCalledWith({
          hash: 'workloads=something&SIDs=something&tags=bridges%2Fporter%3Dsam%2Cfragile%2Ftag%3Dsam%2Cfragile%2Ftag2%3Dsam',
          pathname: '/',
          search: '',
        });
        done();
      });
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

describe('escaper', () => {
  it('should espace all slashes', () => {
    expect(escaper('////r///rrrr//')).toBe('%2F%2F%2F%2Fr%2F%2F%2Frrrr%2F%2F');
  });

  it('should escape all equals', () => {
    expect(escaper('=f==r')).toBe('%3Df%3D%3Dr');
  });

  it('should escape all equals and slashes', () => {
    expect(escaper('f=r/f')).toBe('f%3Dr%2Ff');
  });

  it("shouldn't escape", () => {
    expect(escaper('Some value!')).toBe('Some value!');
  });
});
