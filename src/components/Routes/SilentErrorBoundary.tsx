import React from 'react';

// NOTE: This component should not be used generally.
// Using to load the bot as it is a non-critical component that is on every page.

type ErrorBoundaryState = {
  hasError: boolean;
  error?: any;
  errorInfo?: any;
};

class SilentErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
  },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Chrome encountered an error!', error);
    this.setState((prev) => ({
      ...prev,
      error,
      errorInfo,
    }));
  }

  render() {
    if (this.state.hasError) {
      return null;
    }

    return this.props.children;
  }
}

export default SilentErrorBoundary;
