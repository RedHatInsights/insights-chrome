import React from 'react';
import PropTypes from 'prop-types';
import LoadingFallback from '../../utils/loading-fallback';
import AsyncComponent from '@redhat-cloud-services/frontend-components/AsyncComponent';

// TODO: remove me once every app uses new loader
const AsyncInventory = ({ componentName, innerRef, ...props }) => {
  return <AsyncComponent appName="inventory" module={`./${componentName}`} fallback={LoadingFallback} ref={innerRef} {...props} />;
};

AsyncInventory.propTypes = {
  store: PropTypes.object,
  onLoad: PropTypes.func,
  componentName: PropTypes.string,
  history: PropTypes.object,
  innerRef: PropTypes.shape({
    current: PropTypes.any,
  }),
};

AsyncInventory.defaultProps = {
  onLoad: () => undefined,
};

export default AsyncInventory;
