import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
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

  it('should render modal with accessible aria-label', () => {
    render(<BetaInfoModal {...defaultProps} />);
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Preview information');
  });

  it('should render Preview heading', () => {
    render(<BetaInfoModal {...defaultProps} />);
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('should render description text', () => {
    render(<BetaInfoModal {...defaultProps} />);
    expect(screen.getByText(/enable Preview mode to try out upcoming features/i)).toBeInTheDocument();
  });

  it('should render Learn more link', () => {
    render(<BetaInfoModal {...defaultProps} />);
    const link = screen.getByText('Learn more');
    expect(link).toHaveAttribute('href', 'https://access.redhat.com/support/policy/updates/hybridcloud-console/lifecycle');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('should call onAccept when Turn on button is clicked', () => {
    render(<BetaInfoModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Turn on'));
    expect(defaultProps.onAccept).toHaveBeenCalledTimes(1);
  });

  it('should call toggleOpen(false) when Cancel button is clicked', () => {
    render(<BetaInfoModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.toggleOpen).toHaveBeenCalledWith(false);
  });

  it('should not render when isOpen is false', () => {
    render(<BetaInfoModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
