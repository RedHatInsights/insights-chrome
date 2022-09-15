import React from 'react';
import PropTypes from 'prop-types';

import ErrorComponent from './ErrorComponents/DefaultErrorComponent';

class ErrorBoundary extends React.Component {
  state = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
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

ErrorBoundary.propTypes = {
  children: PropTypes.node,
};

export default ErrorBoundary;
