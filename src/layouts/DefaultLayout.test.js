import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import DefaultLayout from './DefaultLayout';
import { render } from '@testing-library/react';

import { Provider as ProviderJotai } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { activeAppAtom } from '../state/atoms/activeAppAtom';
import { appActionAtom, pageObjectIdAtom } from '../state/atoms/pageAtom';

const HydrateAtoms = ({ initialValues, children }) => {
  useHydrateAtoms(initialValues);
  return children;
};

const TestProvider = ({ initialValues, children, store }) => (
  <ProviderJotai store={store}>
    <HydrateAtoms initialValues={initialValues}>{children}</HydrateAtoms>
  </ProviderJotai>
);

jest.mock('../state/atoms/releaseAtom', () => {
  const util = jest.requireActual('../state/atoms/utils');
  return {
    __esModule: true,
    isPreviewAtom: util.atomWithToggle(false),
  };
});

describe('DefaultLayout', () => {
  let config;

  beforeEach(() => {
    config = {
      foo: {
        manifestLocation: '/bar',
        appName: 'foo',
      },
    };
  });

  it('should render correctly - no data', async () => {
    const { container } = render(
      <TestProvider initialValues={[[activeAppAtom, 'some-app']]}>
        <MemoryRouter>
          <DefaultLayout config={config} />
        </MemoryRouter>
      </TestProvider>
    );
    expect(container.querySelector('#chrome-app-render-root')).toMatchSnapshot();
  });

  it('should render correctly', () => {
    const { container } = render(
      <TestProvider initialValues={[[activeAppAtom, 'some-app']]}>
        <MemoryRouter initialEntries={['/some-location/app-id']}>
          <DefaultLayout config={config} />
        </MemoryRouter>
      </TestProvider>
    );
    expect(container.querySelector('#chrome-app-render-root')).toMatchSnapshot();
  });

  it('should render correctly with pageAction', () => {
    const { container } = render(
      <TestProvider
        initialValues={[
          [activeAppAtom, 'some-app'],
          [appActionAtom, 'some-action'],
        ]}
      >
        <MemoryRouter initialEntries={['/some-location/app-id']}>
          <DefaultLayout config={config} />
        </MemoryRouter>
      </TestProvider>
    );
    expect(container.querySelector('#chrome-app-render-root')).toMatchSnapshot();
  });

  it('should render correctly with pageObjectId', () => {
    const { container } = render(
      <TestProvider
        initialValues={[
          [activeAppAtom, 'some-app'],
          [pageObjectIdAtom, 'some-object-id'],
        ]}
      >
        <MemoryRouter initialEntries={['/some-location/app-id']}>
          <DefaultLayout config={config} />
        </MemoryRouter>
      </TestProvider>
    );
    expect(container.querySelector('#chrome-app-render-root')).toMatchSnapshot();
  });

  it('should render correctly with pageObjectId and pageAction', () => {
    const { container } = render(
      <TestProvider
        initialValues={[
          [activeAppAtom, 'some-app'],
          [pageObjectIdAtom, 'some-object-id'],
          [appActionAtom, 'some-action'],
        ]}
      >
        <MemoryRouter initialEntries={['/some-location/app-id']}>
          <DefaultLayout config={config} />
        </MemoryRouter>
      </TestProvider>
    );
    expect(container.querySelector('#chrome-app-render-root')).toMatchSnapshot();
  });
});
