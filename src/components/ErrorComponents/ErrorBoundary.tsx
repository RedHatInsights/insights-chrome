import React from 'react';

import ErrorComponent from './DefaultErrorComponent';

type ErrorBoundaryState = {
  hasError: boolean;
  error?: any;
  errorInfo?: any;
};

class ErrorBoundary extends React.Component<
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
      return <ErrorComponent error={this.state.error} errorInfo={this.state.errorInfo} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
