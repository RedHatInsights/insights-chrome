import React from 'react';
import PropTypes from 'prop-types';
import * as Sentry from '@sentry/browser';

class ErrorBoundary extends React.Component {
  state = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState(() => ({
      errorId: Sentry.captureException(new Error('Support case created'), {
        error,
        errorInfo,
      }),
    }));
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong. Error ID: {this.state.errorId}</h1>;
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node,
};

export default ErrorBoundary;
