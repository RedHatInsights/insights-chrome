import React from 'react';

import ErrorComponent from './DefaultErrorComponent';
import AccountOnHoldError, { checkAccountOnHold } from './AccountOnHoldError';

type ErrorBoundaryState = {
  hasError: boolean;
  error?: any;
  errorInfo?: any;
};

const INVALID_AUTH_STATE_ERROR = 'No matching state found in storage';

class ErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    auth?: {
      loginSilent: () => Promise<void>;
      loginRedirect: () => Promise<void>;
    };
  },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  handleInvalidAuthState(): void {
    const repairedUrl = new URL(window.location.href);
    // remove invalid SSO state and force re authentication
    repairedUrl.hash = '';
    // remove possibly broken local storage state from client
    localStorage.clear();
    // hard page reload
    window.location.href = repairedUrl.toString();
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Chrome encountered an error!', error);
    this.setState((prev) => ({
      ...prev,
      error,
      errorInfo,
    }));

    if (typeof error.message === 'string' && error.message === INVALID_AUTH_STATE_ERROR) {
      this.handleInvalidAuthState();
    }
  }

  render() {
    if (this.state.hasError) {
      if (checkAccountOnHold(this.state.error)) {
        return <AccountOnHoldError error={this.state.error} />;
      }
      return <ErrorComponent error={this.state.error} errorInfo={this.state.errorInfo} auth={this.props.auth} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
