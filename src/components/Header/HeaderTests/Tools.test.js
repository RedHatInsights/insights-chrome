import React from 'react';
import Tools from '../Tools';
import { ScalprumProvider } from '@scalprum/react-core';
import { act, render } from '@testing-library/react';
import { Provider as JotaiProvider } from 'jotai';
import { MemoryRouter } from 'react-router-dom';
import InternalChromeContext from '../../../utils/internalChromeContext';

jest.mock('../UserToggle', () => () => '<UserToggle />');
jest.mock('../ToolbarToggle', () => () => '<ToolbarToggle />');
jest.mock('../../../state/atoms/releaseAtom', () => {
  const util = jest.requireActual('../../../state/atoms/utils');
  return {
    __esModule: true,
    isPreviewAtom: util.atomWithToggle(false),
  };
});

jest.mock('@unleash/proxy-client-react', () => {
  const proxyClient = jest.requireActual('@unleash/proxy-client-react');
  return {
    __esModule: true,
    ...proxyClient,
    useFlag: () => {
      return true;
    },
  };
});

const mockInternalChromeContext = {
  drawerActions: {
    toggleDrawerContent: jest.fn(),
  },
};

beforeAll(() => {
  global.__webpack_init_sharing__ = () => undefined;
  global.__webpack_share_scopes__ = { default: {} };
});

describe('Tools', () => {
  let assignMock = jest.fn();

  delete window.location;
  window.location = { assign: assignMock, href: '', pathname: '' };
  afterEach(() => {
    assignMock.mockClear();
  });
  it('should render correctly', async () => {
    const mockClick = jest.fn();
    let container;
    await act(async () => {
      container = render(
        <MemoryRouter>
          <ScalprumProvider config={{ notifications: { manifestLocation: '/apps/notifications/fed-mods.json' } }}>
            <JotaiProvider>
              <InternalChromeContext.Provider value={mockInternalChromeContext}>
                <Tools onClick={mockClick} />
              </InternalChromeContext.Provider>
            </JotaiProvider>
          </ScalprumProvider>
        </MemoryRouter>
      ).container;
    });
    expect(container.querySelector('div')).toMatchSnapshot();
  });
});
