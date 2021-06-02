import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { NotAuthorized } from '@redhat-cloud-services/frontend-components/NotAuthorized';
import { Spinner } from '@redhat-cloud-services/frontend-components/Spinner';
import { Bullseye } from '@patternfly/react-core';

const NoAccess = ({ activeAppTitle }) =>
  activeAppTitle ? (
    <NotAuthorized serviceName={activeAppTitle} />
  ) : (
    <Bullseye>
      <Spinner centered />
    </Bullseye>
  );

NoAccess.propTypes = {
  activeAppTitle: PropTypes.string,
};

function stateToProps({ chrome: { activeAppTitle } }) {
  return { activeAppTitle };
}

export default connect(stateToProps, null)(NoAccess);
