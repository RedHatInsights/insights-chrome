import React, { useEffect } from 'react';
import { fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import ChromeLink from '../../components/ChromeLink';
import { activeNavListenersAtom, addNavListenerAtom, deleteNavListenerAtom, triggerNavListenersAtom } from './activeAppAtom';
import { Provider as ProviderJotai, useAtomValue, useSetAtom } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { MemoryRouter } from 'react-router-dom';
import { NavDOMEvent } from '@redhat-cloud-services/types';

const HydrateAtoms = ({ initialValues, children }: { initialValues: any; children: React.ReactNode }) => {
  useHydrateAtoms(initialValues);
  return children;
};

const TestProvider = ({ initialValues, children }: { initialValues: any; children: React.ReactNode }) => (
  <ProviderJotai>
    <HydrateAtoms initialValues={initialValues}>{children}</HydrateAtoms>
  </ProviderJotai>
);

test('addNavListenerAtom should add a listener', async () => {
  const mockNavListener = jest.fn();

  const MockComponent = () => {
    const addNavListener = useSetAtom(addNavListenerAtom);

    useEffect(() => {
      addNavListener(mockNavListener);
    }, []);

    return (
      <MemoryRouter>
        <ChromeLink href="/allservices" className="pf-v6-u-font-size-sm pf-v6-u-p-md" data-ouia-component-id="add-event-listener">
          Add Event Listener
        </ChromeLink>
      </MemoryRouter>
    );
  };

  const { getByText } = render(
    <TestProvider initialValues={[[activeNavListenersAtom, {}]]}>
      <MockComponent />
    </TestProvider>
  );

  fireEvent.click(getByText('Add Event Listener'));

  await waitFor(() => {
    expect(mockNavListener).toHaveBeenCalled();
  });
});

test('deleteNavListenerAtom should remove a listener by id', async () => {
  let listenerId: number;
  const mockNavListener = jest.fn();

  const MockComponent = () => {
    const addNavListener = useSetAtom(addNavListenerAtom);
    const deleteNavListener = useSetAtom(deleteNavListenerAtom);

    useEffect(() => {
      listenerId = addNavListener(mockNavListener);
    }, [addNavListener]);

    useEffect(() => {
      if (listenerId) {
        deleteNavListener(listenerId);
      }
    }, [deleteNavListener, listenerId]);

    return null;
  };

  render(
    <ProviderJotai>
      <MockComponent />
    </ProviderJotai>
  );

  await waitFor(() => {
    const activeNavListeners = renderHook(() => useAtomValue(activeNavListenersAtom)).result.current;
    expect(activeNavListeners[listenerId]).toBeUndefined();
  });
});

test('triggerNavListenersAtom should call all activeListeners', async () => {
  const mockNavListener1 = jest.fn();
  const mockNavListener2 = jest.fn();

  const sampleNavEvent: {
    nav: string;
    domEvent: NavDOMEvent;
  } = {
    nav: 'sample-id',
    domEvent: {
      href: 'foo',
      id: 'bar',
      navId: 'baz',
      type: 'quazz',
      target: {} as any,
    },
  };

  const MockComponent = () => {
    const triggerNavListeners = useSetAtom(triggerNavListenersAtom);
    return (
      <button
        onClick={() => {
          triggerNavListeners(sampleNavEvent);
        }}
      >
        Foo
      </button>
    );
  };

  await render(
    <TestProvider
      initialValues={[
        [
          activeNavListenersAtom,
          {
            1: mockNavListener1,
            2: mockNavListener2,
          },
        ],
      ]}
    >
      <MockComponent />
    </TestProvider>
  );

  await fireEvent.click(screen.getByText('Foo'));

  await waitFor(() => {
    expect(mockNavListener1).toHaveBeenCalledWith(sampleNavEvent);
    expect(mockNavListener2).toHaveBeenCalledWith(sampleNavEvent);
  });
});
