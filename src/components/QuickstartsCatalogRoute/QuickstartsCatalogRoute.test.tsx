import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { useFlag } from '@unleash/proxy-client-react';
import { ScalprumComponent } from '@scalprum/react-core';
import QuickstartCatalogRoute from './QuickstartsCatalogRoute';
import { LEARNING_RESOURCES_QUICKSTARTS_FLAG, LEARNING_RESOURCES_QUICKSTARTS_STORAGE_KEY } from '../RootApp/useLearningResourcesQuickstarts';

jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: jest.fn(() => false),
}));

jest.mock('@scalprum/react-core', () => ({
  ScalprumComponent: jest.fn(() => <div data-testid="remote-catalog" />),
}));

jest.mock('../QuickStart/LazyQuickStartCatalog', () => ({
  LazyQuickStartCatalog: () => <div data-testid="legacy-catalog" />,
}));

jest.mock('../../hooks/useBundle', () => ({
  getUrl: () => 'insights',
}));

const mockedUseFlag = useFlag as jest.Mock;
const MockedScalprumComponent = ScalprumComponent as jest.Mock;

const renderRoute = () =>
  render(
    <IntlProvider locale="en">
      <QuickstartCatalogRoute />
    </IntlProvider>
  );

describe('QuickstartsCatalogRoute', () => {
  beforeEach(() => {
    mockedUseFlag.mockReturnValue(false);
    window.localStorage.removeItem(LEARNING_RESOURCES_QUICKSTARTS_STORAGE_KEY);
    MockedScalprumComponent.mockClear();
  });

  afterEach(() => {
    window.localStorage.removeItem(LEARNING_RESOURCES_QUICKSTARTS_STORAGE_KEY);
  });

  it('uses leftover Chrome catalog when the flag is off', () => {
    renderRoute();

    expect(screen.getByTestId('legacy-catalog')).toBeInTheDocument();
    expect(screen.queryByTestId('remote-catalog')).not.toBeInTheDocument();
    expect(mockedUseFlag).toHaveBeenCalledWith(LEARNING_RESOURCES_QUICKSTARTS_FLAG);
  });

  it('loads learning-resources QuickStartCatalog when the Unleash flag is on', () => {
    mockedUseFlag.mockReturnValue(true);
    renderRoute();

    expect(screen.getByTestId('remote-catalog')).toBeInTheDocument();
    expect(screen.queryByTestId('legacy-catalog')).not.toBeInTheDocument();
    const props = MockedScalprumComponent.mock.calls[0][0];
    expect(props.scope).toBe('learningResources');
    expect(props.module).toBe('./QuickStartCatalog');
  });

  it('loads the remote catalog when localStorage override is set', () => {
    window.localStorage.setItem(LEARNING_RESOURCES_QUICKSTARTS_STORAGE_KEY, 'true');
    renderRoute();

    expect(screen.getByTestId('remote-catalog')).toBeInTheDocument();
    expect(screen.queryByTestId('legacy-catalog')).not.toBeInTheDocument();
  });

  it('renders a localized unavailable state when the remote catalog fails', () => {
    mockedUseFlag.mockReturnValue(true);
    renderRoute();

    const props = MockedScalprumComponent.mock.calls[0][0];
    const { getByTestId, getByText } = render(<IntlProvider locale="en">{props.ErrorComponent}</IntlProvider>);

    expect(getByTestId('quickstarts-catalog-unavailable')).toBeInTheDocument();
    expect(getByText('Unable to load the quickstarts content.')).toBeInTheDocument();
  });
});
