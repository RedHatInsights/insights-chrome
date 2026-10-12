import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'jotai';
import * as Sentry from '@sentry/react';
import ChromeRoutes from './Routes';

jest.mock('@sentry/react', () => ({ captureMessage: jest.fn() }));
jest.mock('@unleash/proxy-client-react', () => ({ useFlag: () => false }));
jest.mock('../../hooks/useTrialRedirect', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../state/atoms/chromeModuleAtom', () => ({
  moduleRoutesAtom: jest.requireActual('jotai').atom([{ path: '/working', module: 'Working app', scope: 'test' }]),
}));
jest.mock('../ChromeRoute', () => ({ __esModule: true, default: ({ module }: { module: string }) => <div>{module}</div> }));
jest.mock('../NotFoundRoute', () => ({ __esModule: true, default: () => <div>Not found</div> }));

describe('ChromeRoutes storage failure isolation', () => {
  afterEach(() => jest.restoreAllMocks());

  it('keeps application routes available when the experimental quickstarts setting cannot be read', () => {
    const getItem = localStorage.getItem.bind(localStorage);
    jest.spyOn(localStorage, 'getItem').mockImplementation((key) => {
      if (key === 'chrome:experimental:quickstarts') throw new DOMException('Storage unavailable', 'SecurityError');
      return getItem(key);
    });

    render(
      <Provider>
        <MemoryRouter initialEntries={['/working']}>
          <ChromeRoutes />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText('Working app')).toBeInTheDocument();
    expect(Sentry.captureMessage).toHaveBeenCalledWith('Unable to read experimental quickstarts setting', expect.any(Object));
  });
});
