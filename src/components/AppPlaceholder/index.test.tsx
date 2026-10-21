import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockGetUrl = jest.fn();

jest.mock('../../hooks/useBundle', () => ({
  getUrl: () => mockGetUrl(),
}));

jest.mock('../ChromeLink', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../Footer/Footer', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../Header/Logo', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../Navigation/Loader', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../../utils/loading-fallback', () => ({
  __esModule: true,
  default: <div data-testid="default-loading" />,
  LightwellLoadingFallback: <div data-testid="lightwell-loading" />,
}));

// Load after the local module mocks above are registered.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const AppPlaceholder = require('./index').default as typeof import('./index').default;

describe('AppPlaceholder', () => {
  beforeEach(() => {
    mockGetUrl.mockReturnValue('lightwell');
  });

  it('uses the Lightwell loading fallback on Lightwell routes', () => {
    render(<AppPlaceholder />);

    expect(screen.getByTestId('lightwell-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('default-loading')).not.toBeInTheDocument();
  });

  it('uses the default loading fallback on non-Lightwell routes', () => {
    mockGetUrl.mockReturnValue('insights');

    render(<AppPlaceholder />);

    expect(screen.getByTestId('default-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('lightwell-loading')).not.toBeInTheDocument();
  });
});
