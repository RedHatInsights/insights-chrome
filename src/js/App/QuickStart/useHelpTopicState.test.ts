import { renderHook, act } from '@testing-library/react-hooks';

import helpTopicDataMock from './helpTopicDataMock.json';
import useHelpTopicState from './useHelpTopicState';

describe('useHelpTopicState', () => {
  test('should initialize with help topics', () => {
    const { result } = renderHook(() => useHelpTopicState(...helpTopicDataMock));

    expect(result.current.helpTopics).toEqual(helpTopicDataMock);
  });

  test('should add one new topic that is not in the array', () => {
    const { result } = renderHook(() => useHelpTopicState());

    act(() => {
      result.current.updateHelpTopics(helpTopicDataMock[0]);
    });

    expect(result.current.helpTopics).toEqual([helpTopicDataMock[0]]);
  });

  test('should add two new topics that is not in the array', () => {
    const { result } = renderHook(() => useHelpTopicState());

    act(() => {
      result.current.updateHelpTopics(...helpTopicDataMock);
    });

    expect(result.current.helpTopics).toEqual(helpTopicDataMock);
  });

  test('should update existing telp topic based on name', () => {
    const { result } = renderHook(() => useHelpTopicState(...helpTopicDataMock));

    expect(result.current.helpTopics).toEqual(helpTopicDataMock);

    act(() => {
      result.current.updateHelpTopics({ ...helpTopicDataMock[0], title: 'Foo' });
    });

    expect(result.current.helpTopics[0].title).toEqual('Foo');
    expect(result.current.helpTopics[1]).toEqual(helpTopicDataMock[1]);
    expect(result.current.helpTopics).toHaveLength(2);
  });

  test('should update existing topic and add a new topic', () => {
    const { result } = renderHook(() => useHelpTopicState(...helpTopicDataMock));

    expect(result.current.helpTopics).toEqual(helpTopicDataMock);

    act(() => {
      result.current.updateHelpTopics({ ...helpTopicDataMock[0], title: 'Foo' }, { ...helpTopicDataMock[1], name: 'New Topic' });
    });

    expect(result.current.helpTopics[0].title).toEqual('Foo');
    expect(result.current.helpTopics).toHaveLength(3);
  });
});
