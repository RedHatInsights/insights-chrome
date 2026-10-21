import { render, screen } from '@testing-library/react';
import AppPlaceholder from './index';

jest.mock('../Header/Logo', () => ({ __esModule: true, default: () => <span>Logo</span> }));
jest.mock('../Footer/Footer', () => ({ __esModule: true, default: () => <footer>Footer</footer> }));
jest.mock('../Navigation/Loader', () => ({ __esModule: true, default: () => <nav>Navigation loader</nav> }));

describe('AppPlaceholder', () => {
  afterEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it.each(['/lightwell', '/lightwell/lens'])('shows the spinner without the content card on %s', (pathname) => {
    window.history.replaceState({}, '', pathname);
    const { container } = render(<AppPlaceholder />);

    expect(container.querySelector('.pf-v6-c-page')).toHaveClass('chr-c-page--lightwell-placeholder');
    expect(container.querySelector('[data-ouia-component-id="remote-module-loader"]')).toBeInTheDocument();
    expect(screen.queryByText('Footer')).not.toBeInTheDocument();
  });

  it('preserves the default loading layout on other routes', () => {
    window.history.replaceState({}, '', '/insights/dashboard');
    const { container } = render(<AppPlaceholder />);

    expect(container.querySelector('.pf-v6-c-page')).not.toHaveClass('chr-c-page--lightwell-placeholder');
    expect(screen.getByText('Footer')).toBeInTheDocument();
    expect(screen.getByText('Navigation loader')).toBeInTheDocument();
  });
});
