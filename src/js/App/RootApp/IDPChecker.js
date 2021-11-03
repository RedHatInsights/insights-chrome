import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { useSelector } from 'react-redux';

import { isFedRamp } from '../../utils';
import IDPError from '../IDPError/IDPError';

const IDPStatuses = {
  OK: 'OK',
  UNKNOWN: 'UNKNOWN',
  PENDING: 'PENDING',
  ERROR: 'ERROR',
};

const IDPChecker = ({ children }) => {
  const isFedrampEnv = isFedRamp();
  const missingIDP = useSelector(({ chrome }) => chrome?.missingIDP);
  const [status, setStatus] = useState(() => {
    if (isFedrampEnv) {
      return missingIDP === true ? IDPStatuses.ERROR : IDPStatuses.UNKNOWN;
    }
    return IDPStatuses.OK;
  });
  const hasUser = useSelector(({ chrome: { user } }) => Object.keys(user || {}).length > 0);
  const allowStateChange = useRef(isFedrampEnv);

  useEffect(() => {
    if (isFedrampEnv && status !== IDPStatuses.PENDING && hasUser) {
      allowStateChange.current && setStatus(IDPStatuses.PENDING);
      axios
        .get('/api/entitlements/v1/services')
        .then(() => {
          allowStateChange.current && setStatus(IDPStatuses.OK);
        })
        .catch((err) => {
          const authError = err.response.status === 403 && err.message === 'Insights authorization failed - account number not in allow list';
          allowStateChange.current && setStatus(authError ? IDPStatuses.ERROR : IDPStatuses.OK);
        });
    }
  }, [hasUser, missingIDP]);

  useEffect(() => {
    if (missingIDP === true) {
      allowStateChange.current && setStatus(IDPStatuses.ERROR);
      allowStateChange.current = false;
    }
  }, [missingIDP]);

  if (status === IDPStatuses.OK) {
    return children;
  }
  if (status === IDPStatuses.ERROR) {
    return <IDPError />;
  }
  return null;
};

IDPChecker.propTypes = {
  children: PropTypes.node,
};

export default IDPChecker;
