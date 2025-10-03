import React, { useEffect } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { InitialEntry } from 'history';
import { Provider as JotaiProvider } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';

import RedirectBanner from './RedirectBanner';
import { AWS_BANNER_NAME, AZURE_BANNER_NAME } from '../../hooks/useMarketplacePartner';
import { activeProductAtom } from '../../state/atoms/activeProductAtom';

const HydrateAtoms: React.FC<{ initialValues: any[]; children: React.ReactNode }> = ({ initialValues, children }) => {
  useHydrateAtoms(initialValues);
  return children;
};

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

const Wrapper: React.FC<React.PropsWithChildren<{ initialEntries?: InitialEntry[]; changeSpy?: jest.Mock; atomValues?: any[] }>> = ({
  changeSpy = jest.fn(),
  initialEntries,
  children,
  atomValues = [],
}) => (
  <MemoryRouter initialEntries={initialEntries}>
    <JotaiProvider>
      <HydrateAtoms initialValues={atomValues}>
        <LocationSpy changeSpy={changeSpy} />
        <div>{children}</div>
      </HydrateAtoms>
    </JotaiProvider>
  </MemoryRouter>
);

describe('<RedirectBanner>', () => {
  const defaultAtomValues = [[activeProductAtom, null]];

  test('should return null if required query param does not exist', () => {
    render(
      <Wrapper initialEntries={['/foo/bar']} atomValues={defaultAtomValues}>
        <RedirectBanner />
      </Wrapper>
    );
    expect(screen.queryByText('Congratulations, your Red Hat and AWS accounts are linked')).not.toBeInTheDocument();
  });

  test('should return inline alert if AWS query param exists', () => {
    render(
      <Wrapper initialEntries={[`/foo/bar?${AWS_BANNER_NAME}`]} atomValues={defaultAtomValues}>
        <RedirectBanner />
      </Wrapper>
    );
    expect(screen.queryByText('Congratulations, your Red Hat and AWS accounts are linked')).toBeInTheDocument();
  });

  test('should return inline alert if Azure query param exists', () => {
    render(
      <Wrapper initialEntries={[`/foo/bar?${AZURE_BANNER_NAME}`]} atomValues={defaultAtomValues}>
        <RedirectBanner />
      </Wrapper>
    );
    expect(screen.queryByText('Congratulations, your Red Hat and Microsoft Azure accounts are linked')).toBeInTheDocument();
  });

  test('should close inline alert if after clicking on close button', async () => {
    const locationSpy = jest.fn();
    render(
      <Wrapper changeSpy={locationSpy} initialEntries={[`/foo/bar?${AWS_BANNER_NAME}`]} atomValues={defaultAtomValues}>
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
