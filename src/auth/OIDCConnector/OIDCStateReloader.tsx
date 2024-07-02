import React, { PropsWithChildren } from 'react';

const INVALID_AUTH_STATE_ERROR = 'No matching state found in storage';

export default class OIDCStateReloader extends React.Component<PropsWithChildren> {
  state: { hasError: boolean } = {
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

  componentDidCatch(error: Error): void {
    // handle invalid auth state error
    if (typeof error.message === 'string' && error.message === INVALID_AUTH_STATE_ERROR) {
      this.handleInvalidAuthState();
    }
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}
