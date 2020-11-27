/* eslint-disable camelcase */
import React from 'react';
import { render, waitFor, act } from '@testing-library/react';
import ConnectedInsightsAbout, { InsightsAbout, Copyright } from '../InsightsAbout';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';

describe('InsightsAbout', () => {
  beforeEach(() => {
    fetch.resetMocks();
    fetch.mockResponse(
      JSON.stringify({
        app_name: 'chrome',
        src_hash: 'f3d0275e021cfa46982fd9a4376bda7a5ee9e079',
        src_tag: '',
        src_branch: 'prod-stable',
        travis: { event_type: 'push' },
        build_branch: 'prod-stable',
        build_hash: 'b5b92cf36f81fec1c9abc302a365bff111b9f5b0',
        build_id: '7',
      })
    );
  });
  let globalNavData = require('../../../../../testdata/globalNav.json');

  const initialProps = {
    activeApp: 'someApp',
    appId: 'someID',
    dispatch: jest.fn(),
    onClose: jest.fn(),
    user: {
      username: 'someUser',
    },
    globalNav: [globalNavData],
  };
  it('should render correctly with modal closed', async () => {
    let props = {
      ...initialProps,
      isModalOpen: false,
    };
    await act(async () => {
      render(<InsightsAbout {...props} />);
    });
    await waitFor(() => expect(fetch).toHaveBeenCalled());
  });

  it('should render correctly with modal open', async () => {
    let props = {
      ...initialProps,
      isModalOpen: true,
    };
    await act(async () => {
      render(<InsightsAbout {...props} />);
    });
    await waitFor(() => expect(fetch).toHaveBeenCalled());
  });
});

describe('ConnectedInsightsAbout', () => {
  let initialState;
  let mockStore;
  let globalNavData = require('../../../../../testdata/globalNav.json');
  beforeEach(() => {
    mockStore = configureStore();
    initialState = {
      chrome: {
        user: {
          identity: {
            user: {},
          },
        },
        appId: 'test',
        globalNav: [globalNavData],
        activeApp: 'test',
      },
    };
  });

  it('should render correctly with just username', async () => {
    const store = mockStore(initialState);
    let container;
    let unmount;
    let console;
    await act(async () => {
      console = global.console;
      global.console = { error: jest.fn() };
      let wrapper = render(
        <Provider store={store}>
          <ConnectedInsightsAbout isModalOpen />
        </Provider>,
        { container: document.body }
      );
      container = wrapper.container;
      unmount = wrapper.unmount;
    });
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(container).toMatchSnapshot();
    unmount();
    global.console = console;
  });
});

describe('Copyright', () => {
  it('should render', () => {
    const { container } = render(<Copyright />);
    expect(container.querySelector('div')).toMatchSnapshot();
  });
});
