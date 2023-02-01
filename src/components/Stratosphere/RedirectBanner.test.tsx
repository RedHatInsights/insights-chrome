import React, { useEffect } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { InitialEntry } from 'history';
import { Store } from 'redux';

import RedirectBanner, { AWS_BANNER_NAME, AZURE_BANNER_NAME } from './RedirectBanner';

const LocationSpy: React.VoidFunctionComponent<{ changeSpy: jest.Mock }> = ({ changeSpy }) => {
  const { search, pathname, hash, state } = useLocation();
  useEffect(() => {
    changeSpy({
      search,
      pathname,
      hash,
      state,
    });
  }, [search, pathname, hash, state]);
  return null;
};

const Wrapper: React.FC<{ initialEntries?: InitialEntry[]; store: Store; changeSpy?: jest.Mock }> = ({
  changeSpy = jest.fn(),
  store,
  initialEntries,
  children,
}) => (
  <MemoryRouter initialEntries={initialEntries}>
    <LocationSpy changeSpy={changeSpy} />
    <Provider store={store}>{children}</Provider>
  </MemoryRouter>
);

describe('<RedirectBanner>', () => {
  const mockStore = configureStore();
  let store: Store;
  beforeEach(() => {
    store = mockStore({ chrome: {} });
  });

  test('should return null if required query param does not exist', () => {
    render(
      <Wrapper store={store} initialEntries={['/foo/bar']}>
        <RedirectBanner />
      </Wrapper>
    );
    expect(screen.queryByText('Congratulations, your Red Hat and AWS accounts are linked')).not.toBeInTheDocument();
  });

  test('should return inline alert if AWS query param exists', () => {
    render(
      <Wrapper store={store} initialEntries={[`/foo/bar?${AWS_BANNER_NAME}`]}>
        <RedirectBanner />
      </Wrapper>
    );
    expect(screen.queryByText('Congratulations, your Red Hat and AWS accounts are linked')).toBeInTheDocument();
  });

  test('should return inline alert if Azure query param exists', () => {
    render(
      <Wrapper store={store} initialEntries={[`/foo/bar?${AZURE_BANNER_NAME}`]}>
        <RedirectBanner />
      </Wrapper>
    );
    expect(screen.queryByText('Congratulations, your Red Hat and Microsoft Azure accounts are linked')).toBeInTheDocument();
  });

  test('should close inline alert if after clicking on close button', async () => {
    const locationSpy = jest.fn();
    render(
      <Wrapper changeSpy={locationSpy} store={store} initialEntries={[`/foo/bar?${AWS_BANNER_NAME}`]}>
        <RedirectBanner />
      </Wrapper>
    );
    expect(screen.queryByText('Congratulations, your Red Hat and AWS accounts are linked')).toBeInTheDocument();
    const button = screen.getByTestId('stratosphere-banner-close');
    await waitFor(() => {
      fireEvent.click(button);
    });
    expect(locationSpy).toHaveBeenLastCalledWith({
      hash: '',
      pathname: '/foo/bar',
      search: '',
      state: null,
    });
  });
});
