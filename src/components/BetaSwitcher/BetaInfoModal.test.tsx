import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BetaInfoModal from './BetaInfoModal';

describe('BetaInfoModal', () => {
  const defaultProps = {
    isOpen: true,
    toggleOpen: jest.fn(),
    onAccept: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render modal with aria-label for accessibility', () => {
    render(<BetaInfoModal {...defaultProps} />);
    expect(screen.getByRole('dialog', { name: 'Preview information' })).toBeInTheDocument();
  });

  it('should render Preview heading', () => {
    render(<BetaInfoModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: /Preview/i })).toBeInTheDocument();
  });

  it('should render description text', () => {
    render(<BetaInfoModal {...defaultProps} />);
    expect(screen.getByText(/You can enable Preview mode/i)).toBeInTheDocument();
  });

  it('should render Learn more link', () => {
    render(<BetaInfoModal {...defaultProps} />);
    const link = screen.getByRole('link', { name: /Learn more/i });
    expect(link).toHaveAttribute('href', 'https://access.redhat.com/support/policy/updates/hybridcloud-console/lifecycle');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('should render Turn on and Cancel buttons', () => {
    render(<BetaInfoModal {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Turn on' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('should call onAccept when Turn on is clicked', async () => {
    render(<BetaInfoModal {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: 'Turn on' }));
    expect(defaultProps.onAccept).toHaveBeenCalledTimes(1);
  });

  it('should call toggleOpen(false) when Cancel is clicked', async () => {
    render(<BetaInfoModal {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(defaultProps.toggleOpen).toHaveBeenCalledWith(false);
  });

  it('should not render modal when isOpen is false', () => {
    render(<BetaInfoModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
