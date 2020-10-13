import { flatTags, selectWorkloads, updateSelected, storeFilter } from './constants';
const setItem = jest.fn();
const getItem = jest.fn();
Object.defineProperty(window, 'localStorage', { value: {
    setItem,
    getItem
} });

describe('flatTags', () => {
    const globalFilter = {
        Workloads: {
            SAP: { isSelected: true }
        },
        'SAP ID (SID)': {
            SOMEVAL: { isSelected: true }
        },
        someTag: {
            someKey: {
                isSelected: true,
                value: '[someValue]'
            }
        },
        anotherTag: {
            key: {
                isSelected: false,
                value: 'someValue'
            }
        }
    };

    it('should create flat array of global filter', () => {
        const data = flatTags(globalFilter);
        expect(data.length).toBe(2);
        expect(data).toMatchObject([
            'someTag/someKey=[someValue]',
            'Workloads/SAP'
        ]);
    });

    it('no data', () => {
        const data = flatTags({});
        expect(data.length).toBe(0);
        expect(data).toMatchObject([]);
    });

    it('with encode enabled', () => {
        const data = flatTags(globalFilter, true);
        expect(data.length).toBe(2);
        expect(data).toMatchObject([
            'someTag/someKey=%5BsomeValue%5D',
            'Workloads/SAP'
        ]);
    });

    it('should return multiple values', () => {
        const [workloads, SID, tags] = flatTags(globalFilter, false, true);
        expect(tags.length).toBe(1);
        expect(tags).toMatchObject(['someTag/someKey=[someValue]']);
        expect(workloads.SAP.isSelected).toBe(true);
        expect(SID).toMatchObject(['SOMEVAL']);
    });
});

describe('selectWorkloads', () => {
    it('should create workloads all chip', () => {
        const data = selectWorkloads();
        expect(data).toMatchObject({
            'All workloads': {
                group: { name: 'Workloads', noFilter: true, type: 'radio' },
                isSelected: true,
                item: {}
            }
        });
    });
});

describe('updateSelected', () => {
    it('should select correct item', () => {
        const data = updateSelected({
            namespace: {
                key2: {
                    isSelected: false,
                    value: 'something'
                }
            }
        }, 'namespace', 'key', 'value', true);
        expect(data).toMatchObject({
            namespace: {
                key2: {
                    isSelected: false,
                    value: 'something'
                },
                key: {
                    value: 'value',
                    isSelected: true
                }
            }
        });
    });
});

describe('storeFilter', () => {
    it('should call correct localStorage and change location hash', () => {
        storeFilter({
            someTag: {
                someKey: {
                    isSelected: true,
                    item: {
                        value: 'some value'
                    },
                    group: {
                        items: ['something'],
                        groupValue: 'something else'
                    }
                },
                key: {
                    isSelected: true,
                    value: 'some value',
                    group: {
                        items: ['something'],
                        groupValue: 'something else'
                    }
                },
                key2: {
                    isSelected: true,
                    value: 'some value',
                    group: {
                        items: ['something'],
                        groupValue: 'something else'
                    }
                }
            }
        });
        expect(setItem).toHaveBeenCalled();
        const [key, value] = setItem.mock.calls[0];
        expect(value).toBe(
            // eslint-disable-next-line max-len
            '{"someTag":{"someKey":{"isSelected":true,"item":{},"group":{"groupValue":"something else"}},"key":{"isSelected":true,"item":{"tagValue":"some value"},"group":{"groupValue":"something else"}},"key2":{"isSelected":true,"item":{"tagValue":"some value"},"group":{"groupValue":"something else"}}}}'
        );
        expect(key).toBe('chrome:global-filter/undefined');
        expect(location.hash).toBe('');
    });

    it('should update global hash', () => {
        storeFilter({
            Workloads: {
                something: {
                    isSelected: true
                }
            }
        });
        expect(location.hash).toBe('#workloads=something');
    });
});
