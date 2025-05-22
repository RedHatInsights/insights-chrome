import { UserManager } from 'oidc-client-ts';
import React from 'react';
import AppPlaceholder from '../../components/AppPlaceholder';

type SessionErrorBoundaryState = {
  hasError: boolean;
  hasValidError: boolean;
  error?: any;
  errorInfo?: any;
};

export const SESSION_NOT_ACTIVE = 'Session not active';
export const TOKEN_NOT_ACTIVE = new Set(['Token not active', 'Token is not active']);

function isInvalidAuthStateError(error: any): boolean {
  return error?.error_description === SESSION_NOT_ACTIVE || (error?.error_description && TOKEN_NOT_ACTIVE.has(error?.error_description));
}
/**
 *  The session not active and token not active are not handled by the oidc-client library and will "bubble up".
 *  We need a specific error boundary to handle these error. There is no way of preventing the errors from being thrown. And they will always show up in Sentry.
 * */
export default class OIDCUserManagerErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    userManager: UserManager;
  },
  SessionErrorBoundaryState
> {
  state: SessionErrorBoundaryState = {
    hasValidError: false,
    hasError: false,
  };

  static getDerivedStateFromError(error: any) {
    const authError = isInvalidAuthStateError(error);
    return { hasError: true, hasValidError: authError, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    this.setState((prev) => ({
      ...prev,
      error,
      errorInfo,
    }));

    if (isInvalidAuthStateError(error)) {
      this.props.userManager.signinRedirect();
    }
  }

  render() {
    if (this.state.hasValidError) {
      if (isInvalidAuthStateError(this.state.error)) {
        return <AppPlaceholder />;
      }
    } else if (this.state.hasError) {
      // pass non auth error to parent error boundary
      throw this.state.error;
    }

    return this.props.children;
  }
}
